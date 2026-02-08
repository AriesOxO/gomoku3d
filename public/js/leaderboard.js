/**
 * 排行榜页面逻辑
 */

let allPlayers = [];
let filteredPlayers = [];

// 加载排行榜数据
async function loadLeaderboard() {
  try {
    // 加载全局统计
    const stats = await API.getGlobalStats();
    displayGlobalStats(stats);

    // 加载排行榜
    const data = await API.getLeaderboard('win_rate', 100, 5);
    allPlayers = data.leaderboard;
    filteredPlayers = allPlayers;
    
    displayLeaderboard();

    // 显示内容
    document.getElementById('loading').style.display = 'none';
    document.getElementById('leaderboard-content').style.display = 'block';
  } catch (error) {
    showError(error.message || '加载排行榜失败');
  }
}

// 显示全局统计
function displayGlobalStats(stats) {
  document.getElementById('total-players').textContent = stats.totalPlayers;
  document.getElementById('active-players').textContent = stats.activePlayers;
  document.getElementById('total-games').textContent = stats.totalGames;
  document.getElementById('today-games').textContent = stats.todayGames;
  document.getElementById('week-games').textContent = stats.weekGames;
  document.getElementById('avg-moves').textContent = stats.avgMoves;
}

// 显示排行榜
function displayLeaderboard() {
  const list = document.getElementById('leaderboard-list');

  if (filteredPlayers.length === 0) {
    list.innerHTML = '<div class="empty">暂无符合条件的玩家</div>';
    return;
  }

  list.innerHTML = filteredPlayers.map(player => {
    const rankClass = player.rank === 1 ? 'rank-1' :
                      player.rank === 2 ? 'rank-2' :
                      player.rank === 3 ? 'rank-3' : 'rank-other';

    const winRateClass = player.win_rate >= 70 ? 'high' :
                         player.win_rate >= 50 ? 'medium' : 'low';

    const rankIcon = player.rank === 1 ? '🥇' :
                     player.rank === 2 ? '🥈' :
                     player.rank === 3 ? '🥉' : player.rank;

    return `
      <div class="table-row" onclick="viewPlayer('${player.name}')">
        <div class="rank ${rankClass}">${rankIcon}</div>
        <div class="player-name">${player.name}</div>
        <div class="stat-value">${player.total_games}</div>
        <div class="stat-value hide-mobile">${player.wins}</div>
        <div class="stat-value hide-mobile">${player.losses}</div>
        <div class="stat-value hide-mobile">${player.draws}</div>
        <div class="stat-value win-rate ${winRateClass}">${player.win_rate.toFixed(1)}%</div>
      </div>
    `;
  }).join('');
}

// 搜索玩家
function searchPlayers(query) {
  if (!query || query.trim() === '') {
    filteredPlayers = allPlayers;
  } else {
    const lowerQuery = query.toLowerCase();
    filteredPlayers = allPlayers.filter(player => 
      player.name.toLowerCase().includes(lowerQuery)
    );
  }
  displayLeaderboard();
}

// 查看玩家详情
function viewPlayer(playerName) {
  window.location.href = `/stats.html?name=${encodeURIComponent(playerName)}`;
}

// 显示错误
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();

  // 搜索输入
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPlayers(e.target.value);
    }, 300);
  });
});
