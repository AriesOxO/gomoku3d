// UI 控制模块
// 负责所有 UI 元素的显示和交互

/**
 * 显示大厅错误信息
 */
function showLobbyError(message) {
  document.getElementById('lobbyError').textContent = message;
}

/**
 * 进入游戏界面
 */
function enterGame() {
  const lobby = document.getElementById('lobby');
  lobby.style.animation = 'fadeOut 0.3s ease forwards';
  
  setTimeout(() => {
    lobby.classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('topBar').classList.remove('hidden');
    document.getElementById('statusPanel').classList.remove('hidden');
    document.getElementById('chatPanel').classList.remove('hidden');
    document.getElementById('bottomControls').classList.remove('hidden');
    document.getElementById('displayRoomId').textContent = gameState.roomId;
    initThreeJS();
  }, 300);
}

/**
 * 显示等待对手界面
 */
function showWaiting() {
  document.getElementById('waitingRoomCode').textContent = gameState.roomId;
  document.getElementById('waitingOverlay').classList.remove('hidden');
}

/**
 * 隐藏等待对手界面
 */
function hideWaiting() {
  document.getElementById('waitingOverlay').classList.add('hidden');
}

/**
 * 更新玩家名称显示
 */
function updatePlayerNames(blackName, whiteName) {
  document.getElementById('blackPlayerName').textContent = blackName;
  document.getElementById('whitePlayerName').textContent = whiteName;
}

/**
 * 更新回合指示器
 */
function updateTurnUI() {
  const el = document.getElementById('turnIndicator');
  const isMyTurn = gameState.currentTurn === gameState.myColor;
  el.className = 'turn-indicator ' + (isMyTurn ? 'my-turn' : 'opponent-turn');
  el.textContent = isMyTurn ? '✨ 你的回合' : '⏳ 对手回合';
}

/**
 * 更新手数显示
 */
function updateMoveCount(count) {
  document.getElementById('moveCount').textContent = `第 ${count} 手`;
}

/**
 * 添加系统消息
 */
function addSystemMessage(msg) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="system">${msg}</span>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

/**
 * 添加聊天消息
 */
function addChatMessage(name, message, color) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="name ${color === 1 ? 'black' : 'white'}">${name}:</span>${message}`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

/**
 * 显示游戏结束界面
 */
function showGameOver(data) {
  const overlay = document.getElementById('gameOverOverlay');
  const isWin = data.winner === gameState.myColor;
  const isDraw = data.winner === 0;
  
  let title, subtitle;
  if (isDraw) {
    title = '平局';
    subtitle = '旗鼓相当！';
  } else if (isWin) {
    title = '🎉 胜利';
    subtitle = '恭喜你赢得了比赛！';
  } else {
    title = '💫 败北';
    subtitle = `${data.winnerName} 获得了胜利`;
  }
  
  overlay.innerHTML = `
    <div class="game-over-card">
      <h2 class="${isWin || isDraw ? 'win' : 'lose'}">${title}</h2>
      <p>${subtitle}</p>
      <button class="btn-restart" onclick="handleRestartClick()">再来一局</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

/**
 * 隐藏游戏结束界面
 */
function hideGameOver() {
  document.getElementById('gameOverOverlay').classList.add('hidden');
}

/**
 * 处理重新开始按钮点击
 */
function handleRestartClick() {
  hideGameOver();
  restartGame();
}

/**
 * 初始化 UI 事件监听器
 */
function initUIListeners() {
  // 创建房间按钮
  document.getElementById('btnCreate').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim() || '玩家';
    const rid = document.getElementById('roomId').value.trim().toUpperCase();
    createRoom(name, rid);
  });

  // 加入房间按钮
  document.getElementById('btnJoin').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim() || '玩家';
    const rid = document.getElementById('roomId').value.trim().toUpperCase();
    joinRoom(name, rid);
  });

  // 聊天发送按钮
  document.getElementById('chatSend').addEventListener('click', handleChatSend);
  
  // 聊天输入框回车键
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSend();
  });

  // 重新开始按钮
  document.getElementById('btnRestart').addEventListener('click', () => {
    restartGame();
  });

  // 重置视角按钮
  document.getElementById('btnResetView').addEventListener('click', () => {
    resetCameraView();
  });
}

/**
 * 处理聊天发送
 */
function handleChatSend() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  sendChatMessage(msg);
  input.value = '';
}
