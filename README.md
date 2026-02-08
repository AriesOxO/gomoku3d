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
├── server.js          # 服务端 (Express + Socket.IO)
├── package.json       # 项目配置
├── README.md          # 说明文档
└── public/
    └── index.html     # 前端页面 (Three.js + 游戏逻辑)
```

## ⚙️ 自定义配置

修改 `server.js` 中的端口号：
```javascript
const PORT = process.env.PORT || 3000;
```

或通过环境变量设置：
```bash
PORT=8080 npm start
```
