/**
 * 对局历史页面逻辑
 */

let currentPlayerName = '';
let allGames = [];
let displayedGames = [];
let currentFilter = 'all';
let currentSort = 'time-desc';
const GAMES_PER_PAGE = 20;
let currentOffset = 0;

// 从 URL 参数获取玩家名称
function getPlayerNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('name');
}

// 加载玩家数据
async function loadPlayerData() {
  currentPlayerName = getPlayerNameFromURL();

  if (!currentPlayerName) {
    showError('未指定玩家名称');
    return;
  }

  try {
    // 加载战绩统计
    const stats = await API.getPlayerStats(currentPlayerName);
    displayStats(stats);

    // 加载对局历史
    await loadGames();

    // 显示内容
    document.getElementById('loading').style.display = 'none';
    document.getElementById('history-content').style.display = 'block';
  } catch (error) {
    showError(error.message || '加载数据失败');
  }
}

// 加载对局数据
async function loadGames() {
  try {
    const data = await API.getPlayerGames(currentPlayerName, GAMES_PER_PAGE, currentOffset);
    
    if (currentOffset === 0) {
      allGames = data.games;
    } else {
      allGames = allGames.concat(data.games);
    }

    // 显示"加载更多"按钮
    if (data.hasMore) {
      document.getElementById('load-more-container').style.display = 'block';
    } else {
      document.getElementById('load-more-container').style.display = 'none';
    }

    applyFiltersAndSort();
  } catch (error) {
    console.error('加载对局失败:', error);
    throw error;
  }
}

// 显示战绩统计
function displayStats(stats) {
  document.getElementById('player-name').textContent = stats.name;
  document.getElementById('total-games').textContent = stats.total_games;
  document.getElementById('wins').textContent = stats.wins;
  document.getElementById('losses').textContent = stats.losses;
  document.getElementById('draws').textContent = stats.draws;
  document.getElementById('win-rate').textContent = stats.win_rate.toFixed(1) + '%';
}

// 应用筛选和排序
function applyFiltersAndSort() {
  // 筛选
  let filtered = allGames;
  if (currentFilter !== 'all') {
    filtered = allGames.filter(game => {
      const isWin = (game.my_color === game.winner);
      const isDraw = (game.winner === 0);
      const isLoss = !isWin && !isDraw;

      if (currentFilter === 'win') return isWin;
      if (currentFilter === 'loss') return isLoss;
      if (currentFilter === 'draw') return isDraw;
      return true;
    });
  }

  // 排序
  if (currentSort === 'time-desc') {
    filtered.sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at));
  } else if (currentSort === 'time-asc') {
    filtered.sort((a, b) => new Date(a.finished_at) - new Date(b.finished_at));
  }

  displayedGames = filtered;
  displayGames();
}

// 显示对局列表
function displayGames() {
  const gamesList = document.getElementById('games-list');

  if (displayedGames.length === 0) {
    gamesList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎮</div>
        <p>暂无对局记录</p>
      </div>
    `;
    return;
  }

  gamesList.innerHTML = displayedGames.map((game, index) => {
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
    const myColor = game.my_color === 1 ? '黑棋' : '白棋';
    const date = new Date(game.finished_at);
    const dateStr = date.toLocaleDateString('zh-CN');
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const duration = game.duration ? formatDuration(game.duration) : '未知';

    return `
      <div class="game-card" onclick="viewGame(${game.id})">
        <div class="game-number">#${allGames.length - index}</div>
        <div class="game-info">
          <div class="game-players">
            <span class="player-black">${game.black_player_name}</span>
            <span style="color: #666;"> vs </span>
            <span class="player-white">${game.white_player_name}</span>
          </div>
          <div class="game-meta">
            <div class="meta-item">
              <span>🎯</span>
              <span>我方: ${myColor}</span>
            </div>
            <div class="meta-item">
              <span>👤</span>
              <span>对手: ${opponent}</span>
            </div>
            <div class="meta-item">
              <span>📊</span>
              <span>${game.total_moves} 手</span>
            </div>
            <div class="meta-item">
              <span>⏱️</span>
              <span>${duration}</span>
            </div>
            <div class="meta-item">
              <span>📅</span>
              <span>${dateStr} ${timeStr}</span>
            </div>
          </div>
        </div>
        <div class="game-result ${resultClass}">${resultText}</div>
      </div>
    `;
  }).join('');
}

// 格式化时长
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}分${secs}秒`;
}

// 查看对局详情（跳转到回放页面）
function viewGame(gameId) {
  // TODO: 实现回放功能后取消注释
  // window.location.href = `/replay.html?id=${gameId}`;
  alert(`对局 ID: ${gameId}\n回放功能将在 Phase 4 实现`);
}

// 加载更多
async function loadMore() {
  currentOffset += GAMES_PER_PAGE;
  document.getElementById('btn-load-more').disabled = true;
  document.getElementById('btn-load-more').textContent = '加载中...';

  try {
    await loadGames();
  } catch (error) {
    alert('加载失败: ' + error.message);
  } finally {
    document.getElementById('btn-load-more').disabled = false;
    document.getElementById('btn-load-more').textContent = '加载更多';
  }
}

// 显示错误
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  loadPlayerData();

  // 排序选择
  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });

  // 筛选选择
  document.getElementById('filter-select').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    applyFiltersAndSort();
  });

  // 加载更多按钮
  document.getElementById('btn-load-more').addEventListener('click', loadMore);
});
