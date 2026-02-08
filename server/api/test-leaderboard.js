/**
 * 排行榜功能测试
 * 测试 StatsService 和排行榜 API
 */

const StatsService = require('../database/services/StatsService');
const { initialize } = require('../database/db');

async function testLeaderboard() {
  console.log('=== 排行榜功能测试 ===\n');

  try {
    // 初始化数据库
    initialize();
    console.log('✅ 数据库初始化成功\n');

    // 测试 1: 获取排行榜
    console.log('测试 1: 获取排行榜');
    const leaderboard = StatsService.getLeaderboard('win_rate', 10, 5);
    console.log(`✅ 获取到 ${leaderboard.length} 条排行榜数据`);
    if (leaderboard.length > 0) {
      console.log('前三名:');
      leaderboard.slice(0, 3).forEach(player => {
        console.log(`  ${player.rank}. ${player.name} - 胜率: ${player.win_rate.toFixed(1)}% (${player.wins}胜/${player.total_games}局)`);
      });
    }
    console.log();

    // 测试 2: 获取全局统计
    console.log('测试 2: 获取全局统计');
    const stats = StatsService.getGlobalStats();
    console.log('✅ 全局统计:');
    console.log(`  总玩家数: ${stats.totalPlayers}`);
    console.log(`  活跃玩家: ${stats.activePlayers}`);
    console.log(`  总对局数: ${stats.totalGames}`);
    console.log(`  今日对局: ${stats.todayGames}`);
    console.log(`  本周对局: ${stats.weekGames}`);
    console.log(`  平均手数: ${stats.avgMoves}`);
    if (stats.longestGame) {
      console.log(`  最长对局: ${stats.longestGame.moves} 手 (${stats.longestGame.blackPlayer} vs ${stats.longestGame.whitePlayer})`);
    }
    if (stats.fastestGame) {
      console.log(`  最快对局: ${stats.fastestGame.duration} 秒 (${stats.fastestGame.blackPlayer} vs ${stats.fastestGame.whitePlayer})`);
    }
    console.log();

    // 测试 3: 获取玩家排名
    if (leaderboard.length > 0) {
      console.log('测试 3: 获取玩家排名');
      const playerName = leaderboard[0].name;
      const rank = StatsService.getPlayerRank(playerName, 5);
      if (rank) {
        console.log(`✅ 玩家 ${playerName} 的排名: 第 ${rank.rank} 名`);
      }
      console.log();
    }

    // 测试 4: 获取最近活跃玩家
    console.log('测试 4: 获取最近活跃玩家');
    const activePlayers = StatsService.getRecentActivePlayers(5);
    console.log(`✅ 获取到 ${activePlayers.length} 个最近活跃玩家`);
    activePlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} - ${player.total_games} 局 (胜率: ${player.win_rate.toFixed(1)}%)`);
    });
    console.log();

    console.log('=== 所有测试通过 ✅ ===');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testLeaderboard();
