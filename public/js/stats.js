/**
 * 战绩页面逻辑
 */

// 从 URL 参数获取玩家名称
function getPlayerNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('name');
}

// 加载玩家战绩
async function loadPlayerStats() {
  const playerName = getPlayerNameFromURL();

  if (!playerName) {
    showError('未指定玩家名称');
    return;
  }

  try {
    // 加载战绩数据
    const stats = await API.getPlayerStats(playerName);
    
    // 加载最近对局
    const gamesData = await API.getPlayerGames(playerName, 5);

    // 显示战绩
    displayStats(stats);
    
    // 显示最近对局
    displayRecentGames(gamesData.games, playerName);

    // 显示内容
    document.getElementById('loading').style.display = 'none';
    document.getElementById('stats-content').style.display = 'block';
  } catch (error) {
    showError(error.message || '加载战绩失败');
  }
}

// 显示战绩数据
function displayStats(stats) {
  document.getElementById('player-name').textContent = stats.name;
  document.getElementById('total-games').textContent = stats.total_games;
  document.getElementById('wins').textContent = stats.wins;
  document.getElementById('losses').textContent = stats.losses;
  document.getElementById('draws').textContent = stats.draws;
  document.getElementById('win-rate').textContent = stats.win_rate.toFixed(1) + '%';
}

// 显示最近对局
function displayRecentGames(games, currentPlayer) {
  const gamesList = document.getElementById('games-list');

  if (games.length === 0) {
    gamesList.innerHTML = '<div class="empty">暂无对局记录</div>';
    return;
  }

  gamesList.innerHTML = games.map(game => {
    const isWin = (game.my_color === game.winner);
    const isDraw = (game.winner === 0);
    const isLoss = !isWin && !isDraw;

    let resultClass = 'result-draw';
    let resultText = '平局';
    
    if (isWin) {
      resultClass = 'result-win';
      resultText = '胜利';
    } else if (isLoss) {
      resultClass = 'result-loss';
      resultText = '失败';
    }

    const opponent = game.my_color === 1 ? game.white_player_name : game.black_player_name;
    const date = new Date(game.finished_at).toLocaleString('zh-CN');

    return `
      <div class="game-item">
        <div class="game-info">
          <div class="game-players">
            ${game.black_player_name} (黑) vs ${game.white_player_name} (白)
          </div>
          <div class="game-meta">
            对手: ${opponent} | 手数: ${game.total_moves} | ${date}
          </div>
        </div>
        <div class="game-result ${resultClass}">${resultText}</div>
      </div>
    `;
  }).join('');
}

// 显示错误
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// 查看完整历史
function viewHistory() {
  const playerName = getPlayerNameFromURL();
  window.location.href = `/history.html?name=${encodeURIComponent(playerName)}`;
}

// 页面加载时执行
window.addEventListener('DOMContentLoaded', loadPlayerStats);
