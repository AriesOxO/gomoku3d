# 🎮 3D 五子棋 · 局域网对战

一个支持局域网多人对战的 3D 五子棋游戏，使用 Three.js 渲染 3D 棋盘，Socket.IO 实现实时对战。

![Tech Stack](https://img.shields.io/badge/Node.js-Express-green) ![Tech Stack](https://img.shields.io/badge/Three.js-r128-blue) ![Tech Stack](https://img.shields.io/badge/Socket.IO-4.7-orange)

## ✨ 功能特性

- 🎲 **3D 棋盘渲染** - Three.js 打造的精美 3D 棋盘和棋子
- 🌐 **局域网对战** - 同一网络下的设备可以互相对战
- 💬 **实时聊天** - 游戏内聊天功能
- 🎯 **落子动画** - 棋子掉落弹跳动画效果
- 📱 **移动端适配** - 支持触摸操作和手势
- 🔄 **视角控制** - 右键拖拽旋转视角，滚轮缩放

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm start
```

### 3. 访问游戏

服务器启动后会显示访问地址：
- 本地访问: `http://localhost:3000`
- 局域网访问: `http://你的IP:3000`

### 4. 开始对战

1. **玩家1**: 输入昵称 → 点击「创建房间」→ 将房间号告诉朋友
2. **玩家2**: 输入昵称 → 输入房间号 → 点击「加入房间」
3. 黑棋先手，轮流落子，先连成五子者获胜！

## 🎮 操作说明

| 操作 | PC | 手机 |
|------|-----|------|
| 落子 | 左键点击 | 单击 |
| 旋转视角 | 右键拖拽 | 单指滑动 |
| 缩放 | 滚轮 | 双指缩放 |

## 🛠 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: Three.js (3D渲染) + 原生 HTML/CSS/JS
- **通信**: WebSocket (Socket.IO)

## 📁 项目结构

```
gomoku3d/
├── server/                 # 服务端代码
│   ├── index.js           # 服务器入口
│   ├── game/              # 游戏逻辑
│   │   ├── GameLogic.js   # 胜负判断
│   │   └── Room.js        # 房间管理
│   └── socket/            # Socket 通信
│       └── handlers.js    # 事件处理器
├── public/                # 前端资源
│   ├── index.html         # 主页面
│   ├── css/               # 样式文件
│   │   └── style.css      # 主样式
│   └── js/                # JavaScript 模块
│       ├── main.js        # 应用入口
│       ├── state.js       # 状态管理
│       ├── socket.js      # Socket 通信
│       ├── ui.js          # UI 控制
│       └── game3d.js      # 3D 渲染
├── docs/                  # 项目文档
│   └── 项目架构.md        # 架构说明
├── package.json           # 项目配置
└── README.md             # 项目说明
```

> 📖 详细架构说明请查看 [docs/项目架构.md](docs/项目架构.md)

## ⚙️ 自定义配置

修改 `server/index.js` 中的端口号：
```javascript
const PORT = process.env.PORT || 3000;
```

或通过环境变量设置：
```bash
PORT=8080 npm start
```

## 📚 项目文档

- [项目架构说明](docs/项目架构.md) - 详细的技术架构和设计原则
- [测试指南](docs/测试指南.md) - 完整的功能测试清单
- [重构总结](docs/重构总结.md) - 项目重构过程和成果

## 🔄 版本历史

### v2.0.0 (当前版本)
- ✅ 完全模块化重构
- ✅ 前端拆分为 11 个模块
- ✅ 后端拆分为 4 个模块
- ✅ 所有文件 ≤ 300 行
- ✅ 完善的中文文档

### v1.0.0 (已归档)
- 原始单文件版本
- 备份文件: `server_old.js`, `public/index_old.html`
