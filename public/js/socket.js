// Socket.IO 通信模块
// 负责与服务器的 WebSocket 通信

let socket = null;

/**
 * 连接到服务器
 */
function connectSocket() {
  if (socket) return;
  socket = io();

  // 错误消息
  socket.on('error_msg', (data) => {
    showLobbyError(data.message);
  });

  // 房间创建成功
  socket.on('room_created', (data) => {
    gameState.roomId = data.roomId;
    gameState.myColor = data.color;
    enterGame();
    showWaiting();
  });

  // 加入房间成功
  socket.on('room_joined', (data) => {
    gameState.roomId = data.roomId;
    gameState.myColor = data.color;
    enterGame();
  });

  // 对手加入
  socket.on('opponent_joined', () => {
    hideWaiting();
  });

  // 游戏开始
  socket.on('game_start', (data) => {
    hideWaiting();
    gameState.gameActive = true;
    gameState.currentTurn = data.currentTurn;
    gameState.moveCount = 0;
    
    const blackP = data.players.find(p => p.color === 1);
    const whiteP = data.players.find(p => p.color === 2);
    updatePlayerNames(blackP ? blackP.name : '?', whiteP ? whiteP.name : '?');
    updateTurnUI();
    addSystemMessage('游戏开始！黑棋先手。');
  });

  // 棋子落下
  socket.on('stone_placed', (data) => {
    placeStone3D(data.row, data.col, data.color);
    gameState.moveCount = data.moveNumber;
    updateMoveCount(gameState.moveCount);
  });

  // 回合切换
  socket.on('turn_change', (data) => {
    gameState.currentTurn = data.currentTurn;
    updateTurnUI();
  });

  // 游戏结束
  socket.on('game_over', (data) => {
    gameState.gameActive = false;
    showGameOver(data);
  });

  // 游戏重新开始
  socket.on('game_restart', (data) => {
    gameState.currentTurn = data.currentTurn;
    gameState.moveCount = 0;
    gameState.gameActive = true;
    updateMoveCount(0);
    clearStones();
    hideGameOver();
    updateTurnUI();
    addSystemMessage('新一局开始！');
  });

  // 对手离开
  socket.on('opponent_left', (data) => {
    gameState.gameActive = false;
    addSystemMessage(data.message);
  });

  // 聊天消息
  socket.on('chat_message', (data) => {
    addChatMessage(data.name, data.message, data.color);
  });
}

/**
 * 创建房间
 */
function createRoom(playerName, roomId) {
  gameState.myName = playerName;
  connectSocket();
  socket.emit('create_room', { name: playerName, roomId: roomId || undefined });
}

/**
 * 加入房间
 */
function joinRoom(playerName, roomId) {
  if (!roomId) {
    showLobbyError('请输入房间号');
    return;
  }
  gameState.myName = playerName;
  connectSocket();
  socket.emit('join_room', { name: playerName, roomId });
}

/**
 * 落子
 */
function placeStone(row, col) {
  if (!socket) return;
  socket.emit('place_stone', { row, col });
}

/**
 * 重新开始游戏
 */
function restartGame() {
  if (!socket) return;
  socket.emit('restart_game');
}

/**
 * 发送聊天消息
 */
function sendChatMessage(message) {
  if (!socket || !message) return;
  socket.emit('chat_message', { message });
}

/**
 * 获取 socket 实例
 */
function getSocket() {
  return socket;
}
