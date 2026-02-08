# 游戏持久化功能需求文档

## 功能概述

为 3D 五子棋游戏添加本地数据库持久化功能，保存玩家战绩、对局历史和房间信息，使游戏数据在服务器重启后不会丢失。

## 用户故事

### 1. 战绩统计
**作为** 玩家  
**我想要** 查看我的历史战绩（胜/负/平局次数）  
**以便** 了解自己的游戏水平和进步情况

**验收标准**:
- 1.1 系统记录每个玩家的昵称和战绩
- 1.2 战绩包括：总局数、胜局、负局、平局、胜率
- 1.3 玩家可以在大厅界面查看自己的战绩
- 1.4 战绩数据持久化存储，服务器重启后不丢失

### 2. 对局历史
**作为** 玩家  
**我想要** 查看我的历史对局记录  
**以便** 回顾之前的游戏和对手

**验收标准**:
- 2.1 系统记录每局游戏的详细信息（时间、对手、结果、手数）
- 2.2 玩家可以查看最近 N 局的对局历史
- 2.3 对局历史按时间倒序排列
- 2.4 可以查看对局的基本统计信息

### 3. 对局回放
**作为** 玩家  
**我想要** 回放历史对局的棋谱  
**以便** 学习和分析棋局

**验收标准**:
- 3.1 系统记录每局游戏的完整落子序列
- 3.2 玩家可以选择历史对局进行回放
- 3.3 回放支持播放、暂停、快进、后退
- 3.4 回放显示当前手数和落子位置

### 4. 房间持久化
**作为** 系统管理员  
**我想要** 房间信息在服务器重启后恢复  
**以便** 玩家可以继续未完成的游戏

**验收标准**:
- 4.1 活跃房间信息保存到数据库
- 4.2 服务器重启后自动恢复房间状态
- 4.3 玩家重新连接后可以继续游戏
- 4.4 超过 24 小时未活动的房间自动清理

### 5. 排行榜
**作为** 玩家  
**我想要** 查看全局排行榜  
**以便** 了解自己在所有玩家中的排名

**验收标准**:
- 5.1 系统维护全局玩家排行榜
- 5.2 排行榜按胜率或胜局数排序
- 5.3 显示前 100 名玩家
- 5.4 玩家可以看到自己的排名

## 技术需求

### 数据库选择
- **首选**: SQLite（轻量级、无需额外服务、适合单机部署）
- **备选**: LowDB（纯 JavaScript、JSON 存储）

### 数据模型

#### 玩家表 (players)
```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 对局表 (games)
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  black_player_id INTEGER NOT NULL,
  white_player_id INTEGER NOT NULL,
  winner INTEGER, -- 0=平局, 1=黑胜, 2=白胜
  total_moves INTEGER NOT NULL,
  duration INTEGER, -- 游戏时长（秒）
  moves TEXT NOT NULL, -- JSON 格式的落子序列
  started_at DATETIME NOT NULL,
  finished_at DATETIME NOT NULL,
  FOREIGN KEY (black_player_id) REFERENCES players(id),
  FOREIGN KEY (white_player_id) REFERENCES players(id)
);
```

#### 房间表 (rooms)
```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  black_player_id INTEGER,
  white_player_id INTEGER,
  current_turn INTEGER DEFAULT 1,
  board_state TEXT, -- JSON 格式的棋盘状态
  move_history TEXT, -- JSON 格式的落子历史
  game_over INTEGER DEFAULT 0,
  winner INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (black_player_id) REFERENCES players(id),
  FOREIGN KEY (white_player_id) REFERENCES players(id)
);
```

## 非功能需求

### 性能要求
- 数据库查询响应时间 < 100ms
- 不影响游戏实时性（落子延迟 < 50ms）
- 支持至少 10000 条对局记录

### 可靠性要求
- 数据库操作失败不影响游戏进行
- 定期备份数据库文件
- 数据库损坏时有恢复机制

### 安全性要求
- 防止 SQL 注入（使用参数化查询）
- 玩家昵称唯一性校验
- 数据访问权限控制

## 实现优先级

### P0 (必须实现)
- 玩家战绩统计
- 对局历史记录
- 数据库基础架构

### P1 (重要)
- 对局回放功能
- 排行榜功能

### P2 (可选)
- 房间持久化
- 数据导出功能

## 技术方案建议

### 数据库层
```
server/
├── database/
│   ├── db.js           # 数据库连接和初始化
│   ├── models/         # 数据模型
│   │   ├── Player.js   # 玩家模型
│   │   ├── Game.js     # 对局模型
│   │   └── Room.js     # 房间模型（扩展现有）
│   └── migrations/     # 数据库迁移脚本
│       └── 001_init.sql
```

### API 设计
- `GET /api/players/:name/stats` - 获取玩家战绩
- `GET /api/players/:name/games` - 获取对局历史
- `GET /api/games/:id` - 获取对局详情
- `GET /api/games/:id/replay` - 获取对局回放数据
- `GET /api/leaderboard` - 获取排行榜

### 前端界面
- 大厅添加"战绩"按钮
- 新增战绩查看页面
- 新增对局历史页面
- 新增回放播放器

## 风险和限制

### 风险
1. 数据库文件损坏导致数据丢失
2. 并发写入可能导致数据不一致
3. 数据库文件过大影响性能

### 缓解措施
1. 定期自动备份数据库
2. 使用事务保证数据一致性
3. 定期清理过期数据

### 限制
1. SQLite 不支持高并发写入（单机游戏可接受）
2. 数据库文件需要定期维护
3. 跨服务器数据同步需要额外方案

## 测试计划

### 单元测试
- 数据库 CRUD 操作
- 数据模型验证
- 统计计算准确性

### 集成测试
- 游戏结束后数据正确保存
- 战绩统计正确更新
- 对局回放数据完整

### 性能测试
- 1000 条记录查询性能
- 并发写入压力测试
- 数据库文件大小增长测试

## 后续扩展

### 短期
- 添加玩家头像
- 添加成就系统
- 添加好友系统

### 长期
- 支持多服务器数据同步
- 云端数据备份
- 数据分析和可视化

## 参考资料

- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [better-sqlite3 库](https://github.com/WiseLibs/better-sqlite3)
- [Node.js 数据库最佳实践](https://nodejs.org/en/docs/guides/database/)
