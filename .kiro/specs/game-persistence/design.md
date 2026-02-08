# 游戏持久化功能设计文档

## 1. 架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 战绩页面  │  │ 历史页面  │  │ 回放页面  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
│       └─────────────┴─────────────┘                     │
│                     │                                   │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────┼───────────────────────────────────┐
│                     │         API 层                     │
│       ┌─────────────▼─────────────┐                     │
│       │   REST API 路由            │                     │
│       │  /api/players/*            │                     │
│       │  /api/games/*              │                     │
│       │  /api/leaderboard          │                     │
│       └─────────────┬─────────────┘                     │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                     │      业务逻辑层                    │
│       ┌─────────────▼─────────────┐                     │
│       │   数据库服务层              │                     │
│       │  PlayerService             │                     │
│       │  GameService               │                     │
│       │  StatsService              │                     │
│       └─────────────┬─────────────┘                     │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                     │       数据访问层                   │
│       ┌─────────────▼─────────────┐                     │
│       │   数据模型 (Models)         │                     │
│       │  Player, Game, Room        │                     │
│       └─────────────┬─────────────┘                     │
│                     │                                   │
│       ┌─────────────▼─────────────┐                     │
│       │   SQLite 数据库             │                     │
│       │  gomoku.db                 │                     │
│       └───────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块划分

#### 后端模块
```
server/
├── database/
│   ├── db.js                 # 数据库连接管理
│   ├── schema.sql            # 数据库表结构
│   ├── models/               # 数据模型
│   │   ├── Player.js         # 玩家模型
│   │   ├── Game.js           # 对局模型
│   │   └── index.js          # 模型导出
│   └── services/             # 业务服务
│       ├── PlayerService.js  # 玩家服务
│       ├── GameService.js    # 对局服务
│       └── StatsService.js   # 统计服务
├── api/
│   └── routes.js             # API 路由定义
└── index.js                  # 服务器入口（扩展）
```

#### 前端模块
```
public/
├── js/
│   ├── api.js                # API 调用封装
│   ├── stats.js              # 战绩页面逻辑
│   ├── history.js            # 历史页面逻辑
│   └── replay.js             # 回放页面逻辑
└── pages/
    ├── stats.html            # 战绩页面
    ├── history.html          # 历史页面
    └── replay.html           # 回放页面
```

## 2. 数据库设计

### 2.1 数据库表结构

#### players 表（玩家信息）

```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0.0,
  last_played_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_win_rate ON players(win_rate DESC);
```

#### games 表（对局记录）
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  black_player_id INTEGER NOT NULL,
  white_player_id INTEGER NOT NULL,
  winner INTEGER, -- 0=平局, 1=黑胜, 2=白胜
  total_moves INTEGER NOT NULL,
  duration INTEGER, -- 游戏时长（秒）
  moves TEXT NOT NULL, -- JSON: [{row, col, color, timestamp}]
  started_at DATETIME NOT NULL,
  finished_at DATETIME NOT NULL,
  FOREIGN KEY (black_player_id) REFERENCES players(id),
  FOREIGN KEY (white_player_id) REFERENCES players(id)
);

CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_finished_at ON games(finished_at DESC);
```

### 2.2 数据关系

```
players (1) ──< (N) games (黑棋玩家)
players (1) ──< (N) games (白棋玩家)
```

## 3. API 设计

### 3.1 RESTful API 端点

#### 玩家相关
```
GET    /api/players/:name/stats      # 获取玩家战绩
GET    /api/players/:name/games      # 获取玩家对局历史
POST   /api/players                  # 创建/更新玩家
```

#### 对局相关
```
GET    /api/games/:id                # 获取对局详情
GET    /api/games/:id/replay         # 获取回放数据
POST   /api/games                    # 保存对局记录
```

#### 排行榜相关
```
GET    /api/leaderboard              # 获取排行榜
  ?sort=win_rate|wins                # 排序方式
  &limit=100                         # 返回数量
```

### 3.2 API 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 4. 核心功能设计

### 4.1 玩家战绩统计

#### 数据流程
```
游戏结束 → 保存对局记录 → 更新玩家战绩 → 重新计算胜率
```

#### 胜率计算公式
```javascript
win_rate = (wins / total_games) * 100
```

#### 战绩更新逻辑
```javascript
// 伪代码
function updatePlayerStats(playerId, gameResult) {
  player.total_games += 1;
  
  if (gameResult === 'win') {
    player.wins += 1;
  } else if (gameResult === 'loss') {
    player.losses += 1;
  } else {
    player.draws += 1;
  }
  
  player.win_rate = (player.wins / player.total_games) * 100;
  player.last_played_at = new Date();
  player.updated_at = new Date();
  
  savePlayer(player);
}
```

### 4.2 对局历史记录

#### 落子数据格式
```json
{
  "moves": [
    {"row": 7, "col": 7, "color": 1, "timestamp": 1234567890},
    {"row": 7, "col": 8, "color": 2, "timestamp": 1234567891}
  ]
}
```

#### 保存时机
- 游戏结束时保存完整对局数据
- 包含：玩家信息、结果、落子序列、时长

### 4.3 对局回放功能

#### 回放控制器设计
```javascript
class ReplayController {
  constructor(gameData) {
    this.moves = gameData.moves;
    this.currentStep = 0;
    this.isPlaying = false;
    this.speed = 1000; // 每步间隔（毫秒）
  }
  
  play() { /* 播放 */ }
  pause() { /* 暂停 */ }
  next() { /* 下一步 */ }
  prev() { /* 上一步 */ }
  goto(step) { /* 跳转到指定步 */ }
  setSpeed(speed) { /* 设置播放速度 */ }
}
```

#### 回放界面功能
- 播放/暂停按钮
- 进度条（可拖动）
- 速度控制（0.5x, 1x, 2x, 4x）
- 步数显示
- 上一步/下一步按钮

### 4.4 排行榜功能

#### 排序规则
1. 主排序：胜率（win_rate DESC）
2. 次排序：总局数（total_games DESC）
3. 最低局数要求：至少 5 局

#### 查询优化
```sql
SELECT 
  name,
  total_games,
  wins,
  losses,
  draws,
  win_rate
FROM players
WHERE total_games >= 5
ORDER BY win_rate DESC, total_games DESC
LIMIT 100;
```

## 5. 数据库服务层设计

### 5.1 PlayerService

```javascript
class PlayerService {
  // 创建或获取玩家
  async getOrCreatePlayer(name)
  
  // 获取玩家战绩
  async getPlayerStats(name)
  
  // 更新玩家战绩
  async updatePlayerStats(playerId, result)
  
  // 获取玩家对局历史
  async getPlayerGames(name, limit = 20)
}
```

### 5.2 GameService

```javascript
class GameService {
  // 保存对局记录
  async saveGame(gameData)
  
  // 获取对局详情
  async getGame(gameId)
  
  // 获取回放数据
  async getReplayData(gameId)
  
  // 删除过期对局
  async cleanupOldGames(daysOld = 90)
}
```

### 5.3 StatsService

```javascript
class StatsService {
  // 获取排行榜
  async getLeaderboard(sortBy = 'win_rate', limit = 100)
  
  // 获取全局统计
  async getGlobalStats()
  
  // 获取玩家排名
  async getPlayerRank(playerId)
}
```

## 6. 前端界面设计

### 6.1 战绩页面布局

```
┌─────────────────────────────────────┐
│  ← 返回大厅          玩家战绩         │
├─────────────────────────────────────┤
│                                     │
│  昵称: 玩家名                        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  总局数    胜局    负局    平局 │   │
│  │    50      35     10      5   │   │
│  │                               │   │
│  │  胜率: 70.0%                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  最近对局                            │
│  ┌─────────────────────────────┐   │
│  │ 2024-02-08  vs 对手A  胜利   │   │
│  │ 2024-02-07  vs 对手B  失败   │   │
│  │ 2024-02-06  vs 对手C  胜利   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [查看完整历史]  [查看排行榜]        │
└─────────────────────────────────────┘
```

### 6.2 对局历史页面

```
┌─────────────────────────────────────┐
│  ← 返回          对局历史             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 2024-02-08 15:30             │   │
│  │ 黑棋: 玩家A  vs  白棋: 玩家B  │   │
│  │ 结果: 黑胜  手数: 45         │   │
│  │ [回放]                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 2024-02-07 20:15             │   │
│  │ 黑棋: 玩家C  vs  白棋: 玩家A  │   │
│  │ 结果: 白胜  手数: 52         │   │
│  │ [回放]                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [加载更多]                          │
└─────────────────────────────────────┘
```

### 6.3 回放页面

```
┌─────────────────────────────────────┐
│  ← 返回          对局回放             │
├─────────────────────────────────────┤
│                                     │
│  黑棋: 玩家A  vs  白棋: 玩家B         │
│  结果: 黑胜  总手数: 45              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      3D 棋盘显示区域          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  当前: 第 25 手                      │
│  ┌─────────────────────────────┐   │
│  │ ◀◀  ◀  ▶▶  ▶               │   │
│  │ [━━━━━━●━━━━━━━━━━━━━━━━]  │   │
│  │ 0.5x  1x  2x  4x            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 7. 集成方案

### 7.1 与现有代码集成

#### handlers.js 扩展
```javascript
// 在游戏结束时保存记录
handlePlaceStone(socket, data) {
  // ... 现有逻辑 ...
  
  if (gameOver) {
    // 保存对局记录
    await GameService.saveGame({
      roomId: socket.roomId,
      blackPlayer: room.players[0].name,
      whitePlayer: room.players[1].name,
      winner: room.winner,
      moves: room.moveHistory,
      duration: calculateDuration(room)
    });
    
    // 更新玩家战绩
    await updateBothPlayersStats(room);
  }
}
```

#### Room.js 扩展
```javascript
class Room {
  constructor(roomId) {
    // ... 现有属性 ...
    this.startedAt = new Date();
  }
  
  getDuration() {
    return Math.floor((new Date() - this.startedAt) / 1000);
  }
}
```

### 7.2 数据库初始化

#### 服务器启动时
```javascript
// server/index.js
const db = require('./database/db');

async function startServer() {
  // 初始化数据库
  await db.initialize();
  
  // 启动 HTTP 服务器
  server.listen(PORT, () => {
    console.log('服务器已启动');
  });
}
```

## 8. 性能优化

### 8.1 数据库优化

#### 索引策略
- players.name: 唯一索引（频繁查询）
- players.win_rate: 降序索引（排行榜）
- games.finished_at: 降序索引（历史查询）

#### 查询优化
- 使用预编译语句（prepared statements）
- 批量插入使用事务
- 定期 VACUUM 清理数据库

### 8.2 缓存策略

#### 内存缓存
```javascript
// 缓存排行榜（5分钟过期）
const leaderboardCache = {
  data: null,
  expireAt: null,
  
  get() {
    if (this.data && Date.now() < this.expireAt) {
      return this.data;
    }
    return null;
  },
  
  set(data) {
    this.data = data;
    this.expireAt = Date.now() + 5 * 60 * 1000;
  }
};
```

### 8.3 异步处理

#### 非阻塞保存
```javascript
// 游戏结束后异步保存，不阻塞响应
async function handleGameOver(room) {
  // 立即发送游戏结束事件
  io.to(roomId).emit('game_over', result);
  
  // 异步保存数据
  setImmediate(async () => {
    try {
      await saveGameData(room);
    } catch (error) {
      console.error('保存对局数据失败:', error);
    }
  });
}
```

## 9. 错误处理

### 9.1 数据库错误

```javascript
try {
  await db.run(sql, params);
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    // 唯一性约束冲突
    throw new Error('玩家名称已存在');
  } else if (error.code === 'SQLITE_BUSY') {
    // 数据库锁定，重试
    await retry(() => db.run(sql, params));
  } else {
    // 其他错误
    console.error('数据库错误:', error);
    throw error;
  }
}
```

### 9.2 数据验证

```javascript
function validateGameData(data) {
  if (!data.blackPlayer || !data.whitePlayer) {
    throw new Error('缺少玩家信息');
  }
  
  if (!Array.isArray(data.moves) || data.moves.length === 0) {
    throw new Error('落子数据无效');
  }
  
  if (data.winner !== 0 && data.winner !== 1 && data.winner !== 2) {
    throw new Error('胜者信息无效');
  }
}
```

## 10. 测试策略

### 10.1 单元测试

#### 数据模型测试
```javascript
describe('Player Model', () => {
  test('创建玩家', async () => {
    const player = await Player.create('测试玩家');
    expect(player.name).toBe('测试玩家');
    expect(player.total_games).toBe(0);
  });
  
  test('更新战绩', async () => {
    await player.updateStats('win');
    expect(player.wins).toBe(1);
    expect(player.win_rate).toBe(100);
  });
});
```

#### 服务层测试
```javascript
describe('GameService', () => {
  test('保存对局', async () => {
    const gameId = await GameService.saveGame(mockGameData);
    expect(gameId).toBeGreaterThan(0);
  });
  
  test('获取回放数据', async () => {
    const replay = await GameService.getReplayData(gameId);
    expect(replay.moves).toHaveLength(45);
  });
});
```

### 10.2 集成测试

```javascript
describe('完整对局流程', () => {
  test('游戏结束后正确保存数据', async () => {
    // 模拟完整对局
    await playFullGame();
    
    // 验证数据已保存
    const game = await GameService.getLatestGame();
    expect(game).toBeDefined();
    
    // 验证战绩已更新
    const stats = await PlayerService.getPlayerStats('玩家A');
    expect(stats.total_games).toBe(1);
  });
});
```

## 11. 部署和维护

### 11.1 数据库备份

#### 自动备份脚本
```javascript
const cron = require('node-cron');

// 每天凌晨 3 点备份
cron.schedule('0 3 * * *', async () => {
  const backupPath = `backups/gomoku_${Date.now()}.db`;
  await db.backup(backupPath);
  console.log(`数据库已备份到: ${backupPath}`);
});
```

### 11.2 数据清理

#### 清理过期数据
```javascript
// 每周清理 90 天前的对局记录
cron.schedule('0 4 * * 0', async () => {
  const deleted = await GameService.cleanupOldGames(90);
  console.log(`已清理 ${deleted} 条过期记录`);
});
```

### 11.3 监控指标

- 数据库文件大小
- 查询响应时间
- 错误率
- 活跃玩家数

## 12. 安全考虑

### 12.1 SQL 注入防护

```javascript
// ✅ 正确：使用参数化查询
db.get('SELECT * FROM players WHERE name = ?', [playerName]);

// ❌ 错误：字符串拼接
db.get(`SELECT * FROM players WHERE name = '${playerName}'`);
```

### 12.2 输入验证

```javascript
function sanitizePlayerName(name) {
  // 移除特殊字符
  name = name.trim().replace(/[<>\"']/g, '');
  
  // 长度限制
  if (name.length > 12) {
    name = name.substring(0, 12);
  }
  
  return name;
}
```

### 12.3 访问控制

```javascript
// 玩家只能查看自己的详细数据
function checkAccess(requestedPlayer, currentPlayer) {
  if (requestedPlayer !== currentPlayer) {
    throw new Error('无权访问其他玩家的详细数据');
  }
}
```

## 13. 正确性属性

### 13.1 数据一致性属性

**属性 1.1**: 玩家战绩总和等于总局数
```
player.wins + player.losses + player.draws === player.total_games
```

**属性 1.2**: 胜率计算正确
```
player.win_rate === (player.wins / player.total_games) * 100
```

**属性 1.3**: 对局记录完整
```
game.moves.length === game.total_moves
```

### 13.2 业务逻辑属性

**属性 2.1**: 每局游戏有且仅有一个胜者或平局
```
game.winner === 0 || game.winner === 1 || game.winner === 2
```

**属性 2.2**: 黑白玩家不能相同
```
game.black_player_id !== game.white_player_id
```

**属性 2.3**: 游戏时长合理
```
game.duration > 0 && game.duration < 7200 // 最多2小时
```

### 13.3 排行榜属性

**属性 3.1**: 排行榜按胜率降序排列
```
leaderboard[i].win_rate >= leaderboard[i+1].win_rate
```

**属性 3.2**: 排行榜玩家满足最低局数
```
leaderboard.every(player => player.total_games >= 5)
```

## 14. 实现优先级

### Phase 1: 基础持久化（P0）
1. 数据库初始化和连接
2. Player 和 Game 模型
3. 基础 CRUD 操作
4. 游戏结束时保存数据

### Phase 2: 战绩查询（P0）
1. PlayerService 实现
2. 战绩查询 API
3. 前端战绩页面

### Phase 3: 对局历史（P1）
1. GameService 实现
2. 历史查询 API
3. 前端历史页面

### Phase 4: 回放功能（P1）
1. 回放数据 API
2. 回放控制器
3. 前端回放页面

### Phase 5: 排行榜（P1）
1. StatsService 实现
2. 排行榜 API
3. 前端排行榜页面

### Phase 6: 优化和完善（P2）
1. 缓存机制
2. 数据备份
3. 性能优化
4. 监控和日志

## 15. 依赖库

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2",  // SQLite 驱动
    "node-cron": "^3.0.3"         // 定时任务
  },
  "devDependencies": {
    "jest": "^29.7.0"             // 测试框架
  }
}
```

## 16. 配置管理

```javascript
// config/database.js
module.exports = {
  dbPath: process.env.DB_PATH || './data/gomoku.db',
  backupPath: process.env.BACKUP_PATH || './backups',
  backupSchedule: '0 3 * * *',  // 每天凌晨3点
  cleanupDays: 90,               // 保留90天数据
  minGamesForLeaderboard: 5      // 排行榜最低局数
};
```
