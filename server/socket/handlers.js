/**
 * Socket 事件处理器
 * 处理所有客户端 Socket 事件
 */

const Room = require('../game/Room');
const GameLogic = require('../game/GameLogic');
const GameService = require('../database/services/GameService');

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  /**
   * 处理客户端连接
   */
  handleConnection(socket) {
    console.log(`玩家已连接: ${socket.id}`);

    socket.on('create_room', (data) => this.handleCreateRoom(socket, data));
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
    socket.on('place_stone', (data) => this.handlePlaceStone(socket, data));
    socket.on('restart_game', () => this.handleRestartGame(socket));
    socket.on('chat_message', (data) => this.handleChatMessage(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * 创建房间
   */
  handleCreateRoom(socket, data) {
    const roomId = data.roomId || this.generateRoomId();
    
    if (this.rooms.has(roomId)) {
      socket.emit('error_msg', { message: '房间已存在，请换一个房间号' });
      return;
    }

    const room = new Room(roomId);
    const player = { id: socket.id, name: data.name || '玩家1', color: 1 };
    room.addPlayer(player);
    
    this.rooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerColor = 1;
    
    socket.emit('room_created', { 
      roomId, 
      color: 1, 
      playerName: player.name 
    });
    
    console.log(`房间 ${roomId} 已创建，创建者: ${socket.id}`);
  }

  /**
   * 加入房间
   */
  handleJoinRoom(socket, data) {
    const roomId = data.roomId;
    const room = this.rooms.get(roomId);

    if (!room) {
      socket.emit('error_msg', { message: '房间不存在' });
      return;
    }

    if (room.isFull()) {
      socket.emit('error_msg', { message: '房间已满' });
      return;
    }

    const player = { id: socket.id, name: data.name || '玩家2', color: 2 };
    room.addPlayer(player);
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerColor = 2;

    socket.emit('room_joined', {
      roomId,
      color: 2,
      playerName: player.name,
      opponentName: room.players[0].name
    });

    // 通知第一个玩家
    this.io.to(room.players[0].id).emit('opponent_joined', {
      opponentName: player.name
    });

    // 开始游戏
    this.io.to(roomId).emit('game_start', {
      players: room.players.map(p => ({ name: p.name, color: p.color })),
      currentTurn: 1
    });

    // 记录游戏开始时间
    room.startedAt = new Date();

    console.log(`玩家 ${socket.id} 加入房间 ${roomId}`);
  }

  /**
   * 落子
   */
  handlePlaceStone(socket, data) {
    const room = this.rooms.get(socket.roomId);
    
    if (!room || room.gameOver) {
      return;
    }

    if (!room.isFull()) {
      socket.emit('error_msg', { message: '等待对手加入...' });
      return;
    }

    if (room.currentTurn !== socket.playerColor) {
      socket.emit('error_msg', { message: '还没到你的回合' });
      return;
    }

    const { row, col } = data;
    
    // 验证位置
    if (row < 0 || row >= 15 || col < 0 || col >= 15) {
      socket.emit('error_msg', { message: '无效的位置' });
      return;
    }

    // 落子
    if (!room.placeStone(row, col, socket.playerColor)) {
      socket.emit('error_msg', { message: '该位置已有棋子' });
      return;
    }

    // 检查胜负
    if (GameLogic.checkWin(room.board, row, col, socket.playerColor)) {
      room.gameOver = true;
      room.winner = socket.playerColor;
      
      this.io.to(socket.roomId).emit('stone_placed', {
        row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
      });

      const winnerPlayer = room.getPlayer(socket.id);
      this.io.to(socket.roomId).emit('game_over', {
        winner: socket.playerColor,
        winnerName: winnerPlayer.name
      });

      // 异步保存对局数据
      this.saveGameData(room).catch(error => {
        console.error('保存对局数据失败:', error);
      });

      return;
    }

    // 检查平局
    if (GameLogic.checkDraw(room.moveHistory)) {
      room.gameOver = true;
      
      this.io.to(socket.roomId).emit('stone_placed', {
        row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
      });
      
      this.io.to(socket.roomId).emit('game_over', { 
        winner: 0, 
        winnerName: '平局' 
      });

      // 异步保存对局数据
      this.saveGameData(room).catch(error => {
        console.error('保存对局数据失败:', error);
      });

      return;
    }

    // 切换回合
    room.switchTurn();
    
    this.io.to(socket.roomId).emit('stone_placed', {
      row, col, color: socket.playerColor, moveNumber: room.moveHistory.length
    });
    
    this.io.to(socket.roomId).emit('turn_change', { 
      currentTurn: room.currentTurn 
    });
  }

  /**
   * 保存对局数据到数据库
   */
  async saveGameData(room) {
    try {
      if (!room.startedAt || room.players.length < 2) {
        console.log('⚠️ 对局数据不完整，跳过保存');
        return;
      }

      const gameData = {
        roomId: room.id,
        blackPlayerName: room.players[0].name,
        whitePlayerName: room.players[1].name,
        winner: room.winner || 0,
        moves: room.moveHistory,
        duration: room.getDuration(),
        startedAt: room.startedAt,
        finishedAt: new Date()
      };

      await GameService.saveGame(gameData);
    } catch (error) {
      console.error('保存对局数据失败:', error);
    }
  }

  /**
   * 重新开始游戏
   */
  handleRestartGame(socket) {
    const room = this.rooms.get(socket.roomId);
    
    if (!room) {
      return;
    }

    room.reset();
    // 重新记录开始时间
    room.startedAt = new Date();
    this.io.to(socket.roomId).emit('game_restart', { currentTurn: 1 });
  }

  /**
   * 聊天消息
   */
  handleChatMessage(socket, data) {
    const room = this.rooms.get(socket.roomId);
    
    if (!room) {
      return;
    }

    const player = room.getPlayer(socket.id);
    
    this.io.to(socket.roomId).emit('chat_message', {
      name: player ? player.name : '未知',
      message: data.message,
      color: socket.playerColor
    });
  }

  /**
   * 断开连接
   */
  handleDisconnect(socket) {
    console.log(`玩家已断开: ${socket.id}`);
    
    if (socket.roomId) {
      const room = this.rooms.get(socket.roomId);
      
      if (room) {
        this.io.to(socket.roomId).emit('opponent_left', { 
          message: '对手已离开游戏' 
        });
        this.rooms.delete(socket.roomId);
      }
    }
  }

  /**
   * 生成随机房间号
   */
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

/**
 * 设置 Socket.IO 事件处理器
 * @param {Server} io - Socket.IO 服务器实例
 */
function setupSocketHandlers(io) {
  const handlers = new SocketHandlers(io);
  
  io.on('connection', (socket) => {
    handlers.handleConnection(socket);
  });
}

module.exports = { SocketHandlers, setupSocketHandlers };
