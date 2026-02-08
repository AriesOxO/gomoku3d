const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// Game state
const rooms = new Map();

function createRoom(roomId) {
  return {
    id: roomId,
    board: Array(15).fill(null).map(() => Array(15).fill(0)),
    players: [],
    currentTurn: 1, // 1 = black, 2 = white
    gameOver: false,
    winner: null,
    moveHistory: []
  };
}

function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal
    [1, -1]   // anti-diagonal
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    // Check forward
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
        count++;
      } else break;
    }
    // Check backward
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
        count++;
      } else break;
    }
    if (count >= 5) return true;
  }
  return false;
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('create_room', (data) => {
    const roomId = data.roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    if (rooms.has(roomId)) {
      socket.emit('error_msg', { message: '房间已存在，请换一个房间号' });
      return;
    }
    const room = createRoom(roomId);
    room.players.push({ id: socket.id, name: data.name || '玩家1', color: 1 });
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerColor = 1;
    socket.emit('room_created', { roomId, color: 1, playerName: data.name || '玩家1' });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on('join_room', (data) => {
    const roomId = data.roomId;
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error_msg', { message: '房间不存在' });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('error_msg', { message: '房间已满' });
      return;
    }
    room.players.push({ id: socket.id, name: data.name || '玩家2', color: 2 });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerColor = 2;
    socket.emit('room_joined', {
      roomId,
      color: 2,
      playerName: data.name || '玩家2',
      opponentName: room.players[0].name
    });
    // Notify the first player
    io.to(room.players[0].id).emit('opponent_joined', {
      opponentName: data.name || '玩家2'
    });
    // Start game
    io.to(roomId).emit('game_start', {
      players: room.players.map(p => ({ name: p.name, color: p.color })),
      currentTurn: 1
    });
    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  socket.on('place_stone', (data) => {
    const room = rooms.get(socket.roomId);
    if (!room || room.gameOver) return;
    if (room.players.length < 2) {
      socket.emit('error_msg', { message: '等待对手加入...' });
      return;
    }
    if (room.currentTurn !== socket.playerColor) {
      socket.emit('error_msg', { message: '还没到你的回合' });
      return;
    }

    const { row, col } = data;
    if (row < 0 || row >= 15 || col < 0 || col >= 15 || room.board[row][col] !== 0) {
      socket.emit('error_msg', { message: '无效的位置' });
      return;
    }

    room.board[row][col] = socket.playerColor;
    room.moveHistory.push({ row, col, color: socket.playerColor });

    if (checkWin(room.board, row, col, socket.playerColor)) {
      room.gameOver = true;
      room.winner = socket.playerColor;
      io.to(socket.roomId).emit('stone_placed', {
        row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
      });
      const winnerPlayer = room.players.find(p => p.color === socket.playerColor);
      io.to(socket.roomId).emit('game_over', {
        winner: socket.playerColor,
        winnerName: winnerPlayer.name
      });
      return;
    }

    // Check draw
    if (room.moveHistory.length >= 225) {
      room.gameOver = true;
      io.to(socket.roomId).emit('stone_placed', {
        row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
      });
      io.to(socket.roomId).emit('game_over', { winner: 0, winnerName: '平局' });
      return;
    }

    room.currentTurn = room.currentTurn === 1 ? 2 : 1;
    io.to(socket.roomId).emit('stone_placed', {
      row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
    });
    io.to(socket.roomId).emit('turn_change', { currentTurn: room.currentTurn });
  });

  socket.on('restart_game', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;
    room.board = Array(15).fill(null).map(() => Array(15).fill(0));
    room.currentTurn = 1;
    room.gameOver = false;
    room.winner = null;
    room.moveHistory = [];
    io.to(socket.roomId).emit('game_restart', { currentTurn: 1 });
  });

  socket.on('chat_message', (data) => {
    const room = rooms.get(socket.roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    io.to(socket.roomId).emit('chat_message', {
      name: player ? player.name : '未知',
      message: data.message,
      color: socket.playerColor
    });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        io.to(socket.roomId).emit('opponent_left', { message: '对手已离开游戏' });
        rooms.delete(socket.roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 3D五子棋服务器已启动！`);
  console.log(`📡 本地访问: http://localhost:${PORT}`);
  
  // Show LAN IPs
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
