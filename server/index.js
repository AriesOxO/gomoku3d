const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { setupSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 设置 Socket.IO 事件处理器
setupSocketHandlers(io);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 3D五子棋服务器已启动！`);
  console.log(`📡 本地访问: http://localhost:${PORT}`);
  
  // 显示局域网 IP 地址
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`🌐 局域网访问: http://${iface.address}:${PORT}`);
      }
    }
  }
  console.log(`\n在同一局域网下的设备都可以通过上述地址访问游戏！\n`);
});
