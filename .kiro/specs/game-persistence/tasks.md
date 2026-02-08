# 游戏持久化功能任务列表

## Phase 1: 基础持久化（P0）

### 1. 数据库基础设施
- [x] 1.1 安装 better-sqlite3 依赖
- [x] 1.2 创建数据库连接模块 `server/database/db.js`
- [x] 1.3 创建数据库表结构 SQL 文件 `server/database/schema.sql`
- [x] 1.4 实现数据库初始化函数
- [x] 1.5 添加数据库连接测试

### 2. 数据模型实现
- [x] 2.1 创建 Player 模型 `server/database/models/Player.js`
  - [x] 2.1.1 实现 create() 方法
  - [x] 2.1.2 实现 findByName() 方法
  - [x] 2.1.3 实现 updateStats() 方法
- [x] 2.2 创建 Game 模型 `server/database/models/Game.js`
  - [x] 2.2.1 实现 create() 方法
  - [x] 2.2.2 实现 findById() 方法
  - [x] 2.2.3 实现 findByPlayer() 方法
- [x] 2.3 创建模型导出文件 `server/database/models/index.js`

### 3. 业务服务层
- [x] 3.1 创建 PlayerService `server/database/services/PlayerService.js`
  - [x] 3.1.1 实现 getOrCreatePlayer()
  - [x] 3.1.2 实现 getPlayerStats()
  - [x] 3.1.3 实现 updatePlayerStats()
- [x] 3.2 创建 GameService `server/database/services/GameService.js`
  - [x] 3.2.1 实现 saveGame()
  - [x] 3.2.2 实现 getGame()
  - [x] 3.2.3 实现 getPlayerGames()

### 4. 集成到现有代码
- [x] 4.1 修改 `server/index.js` 添加数据库初始化
- [x] 4.2 修改 `server/socket/handlers.js` 在游戏结束时保存数据
- [x] 4.3 修改 `server/game/Room.js` 添加游戏时长记录
- [x] 4.4 测试游戏结束后数据正确保存

## Phase 2: 战绩查询（P0）

### 5. API 路由实现
- [x] 5.1 创建 API 路由文件 `server/api/routes.js`
- [x] 5.2 实现 `GET /api/players/:name/stats` 端点
- [x] 5.3 实现错误处理中间件
- [x] 5.4 集成到 Express 应用

### 6. 前端 API 封装
- [x] 6.1 创建 API 调用模块 `public/js/api.js`
- [x] 6.2 实现 getPlayerStats() 函数
- [x] 6.3 实现错误处理

### 7. 战绩页面
- [x] 7.1 创建战绩页面 HTML `public/stats.html`
- [x] 7.2 创建战绩页面逻辑 `public/js/stats.js`
- [x] 7.3 在大厅添加"查看战绩"按钮
- [x] 7.4 实现战绩数据展示
- [x] 7.5 添加返回大厅功能

## Phase 3: 对局历史（P1）

### 8. 历史查询 API
- [x] 8.1 实现 `GET /api/players/:name/games` 端点
- [x] 8.2 添加分页支持（limit, offset）
- [x] 8.3 添加排序支持（按时间）

### 9. 历史页面
- [x] 9.1 创建历史页面 HTML `public/history.html`
- [x] 9.2 创建历史页面逻辑 `public/js/history.js`
- [x] 9.3 实现对局列表展示
- [x] 9.4 实现"加载更多"功能
- [x] 9.5 添加跳转到回放功能

## Phase 4: 回放功能（P1）

### 10. 回放数据 API
- [ ] 10.1 实现 `GET /api/games/:id` 端点
- [ ] 10.2 实现 `GET /api/games/:id/replay` 端点
- [ ] 10.3 优化回放数据格式

### 11. 回放控制器
- [ ] 11.1 创建回放控制器 `public/js/replay.js`
- [ ] 11.2 实现播放/暂停功能
- [ ] 11.3 实现上一步/下一步功能
- [ ] 11.4 实现进度条拖动
- [ ] 11.5 实现速度控制（0.5x, 1x, 2x, 4x）

### 12. 回放页面
- [ ] 12.1 创建回放页面 HTML `public/pages/replay.html`
- [ ] 12.2 集成 3D 棋盘渲染
- [ ] 12.3 实现回放控制界面
- [ ] 12.4 实现步数和玩家信息显示
- [ ] 12.5 添加返回历史页面功能

## Phase 5: 排行榜（P1）

### 13. 排行榜服务
- [ ] 13.1 创建 StatsService `server/database/services/StatsService.js`
- [ ] 13.2 实现 getLeaderboard() 方法
- [ ] 13.3 实现 getPlayerRank() 方法
- [ ] 13.4 添加缓存机制

### 14. 排行榜 API
- [ ] 14.1 实现 `GET /api/leaderboard` 端点
- [ ] 14.2 添加排序参数支持
- [ ] 14.3 添加分页支持

### 15. 排行榜页面
- [ ] 15.1 创建排行榜页面或组件
- [ ] 15.2 实现排行榜数据展示
- [ ] 15.3 实现排序切换功能
- [ ] 15.4 高亮显示当前玩家

## Phase 6: 优化和完善（P2）

### 16. 性能优化
- [ ] 16.1 添加数据库索引
- [ ] 16.2 实现查询结果缓存
- [ ] 16.3 优化大数据量查询
- [ ] 16.4 添加数据库连接池

### 17. 数据维护
- [ ] 17.1 实现数据库备份功能
- [ ] 17.2 添加定时备份任务（node-cron）
- [ ] 17.3 实现过期数据清理
- [ ] 17.4 添加数据库 VACUUM 优化

### 18. 错误处理和日志
- [ ] 18.1 完善错误处理机制
- [ ] 18.2 添加详细日志记录
- [ ] 18.3 实现错误恢复机制
- [ ] 18.4 添加数据验证

### 19. 测试
- [ ] 19.1 编写数据模型单元测试
- [ ] 19.2 编写服务层单元测试
- [ ] 19.3 编写 API 集成测试
- [ ] 19.4 编写端到端测试
- [ ] 19.5 性能测试和压力测试

### 20. 文档和部署
- [ ] 20.1 更新项目文档
- [ ] 20.2 编写数据库迁移指南
- [ ] 20.3 编写备份恢复指南
- [ ] 20.4 更新 README.md
- [ ] 20.5 创建部署检查清单

## 可选功能（未来扩展）

### 21. 高级功能
- [ ]* 21.1 添加玩家头像上传
- [ ]* 21.2 实现成就系统
- [ ]* 21.3 添加好友系统
- [ ]* 21.4 实现私信功能
- [ ]* 21.5 添加房间持久化

### 22. 数据分析
- [ ]* 22.1 实现胜率趋势图
- [ ]* 22.2 添加对局统计分析
- [ ]* 22.3 实现热力图展示
- [ ]* 22.4 添加 AI 棋力评估

### 23. 云端同步
- [ ]* 23.1 设计云端同步方案
- [ ]* 23.2 实现数据上传
- [ ]* 23.3 实现数据下载
- [ ]* 23.4 处理冲突解决

## 任务说明

- `[ ]` - 未开始
- `[x]` - 已完成
- `[-]` - 进行中
- `[~]` - 已排队
- `[ ]*` - 可选任务（标记为可选）

## 预估工作量

- Phase 1: 8-10 小时
- Phase 2: 4-6 小时
- Phase 3: 4-6 小时
- Phase 4: 6-8 小时
- Phase 5: 4-6 小时
- Phase 6: 8-10 小时

**总计**: 34-46 小时

## 依赖关系

```
Phase 1 (基础) → Phase 2 (战绩) → Phase 3 (历史) → Phase 4 (回放)
                                                    ↓
                                                 Phase 5 (排行榜)
                                                    ↓
                                                 Phase 6 (优化)
```

## 里程碑

- **M1**: Phase 1 完成 - 基础持久化可用
- **M2**: Phase 2 完成 - 玩家可查看战绩
- **M3**: Phase 3-4 完成 - 完整的历史和回放功能
- **M4**: Phase 5 完成 - 排行榜上线
- **M5**: Phase 6 完成 - 生产环境就绪
