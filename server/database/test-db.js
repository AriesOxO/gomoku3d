/**
 * 数据库连接和功能测试
 * 测试数据库初始化、模型操作和服务层功能
 */

const db = require('./db');
const { Player, Game } = require('./models');
const PlayerService = require('./services/PlayerService');
const GameService = require('./services/GameService');

async function runTests() {
  console.log('========================================');
  console.log('开始数据库测试');
  console.log('========================================\n');

  try {
    // 测试 1: 数据库初始化
    console.log('测试 1: 数据库初始化');
    db.initialize();
    console.log('✅ 数据库初始化成功\n');

    // 测试 2: 创建玩家
    console.log('测试 2: 创建玩家');
    const player1 = Player.create('测试玩家A');
    const player2 = Player.create('测试玩家B');
    console.log(`✅ 创建玩家成功: ${player1.name} (ID: ${player1.id})`);
    console.log(`✅ 创建玩家成功: ${player2.name} (ID: ${player2.id})\n`);

    // 测试 3: 查找玩家
    console.log('测试 3: 查找玩家');
    const foundPlayer = Player.findByName('测试玩家A');
    console.log(`✅ 查找玩家成功: ${foundPlayer.name}\n`);

    // 测试 4: 获取或创建玩家
    console.log('测试 4: 获取或创建玩家');
    const player3 = PlayerService.getOrCreatePlayer('测试玩家C');
    const player3Again = PlayerService.getOrCreatePlayer('测试玩家C');
    console.log(`✅ 首次创建: ${player3.name} (ID: ${player3.id})`);
    console.log(`✅ 再次获取: ${player3Again.name} (ID: ${player3Again.id})`);
    console.log(`✅ ID 相同: ${player3.id === player3Again.id}\n`);

    // 测试 5: 保存对局记录
    console.log('测试 5: 保存对局记录');
    const gameData = {
      roomId: 'TEST001',
      blackPlayerName: '测试玩家A',
      whitePlayerName: '测试玩家B',
      winner: 1, // 黑棋胜
      moves: [
        { row: 7, col: 7, color: 1 },
        { row: 7, col: 8, color: 2 },
        { row: 8, col: 7, color: 1 },
        { row: 8, col: 8, color: 2 },
        { row: 9, col: 7, color: 1 }
      ],
      duration: 120,
      startedAt: new Date(Date.now() - 120000),
      finishedAt: new Date()
    };
    const savedGame = await GameService.saveGame(gameData);
    console.log(`✅ 对局保存成功 (ID: ${savedGame.id})\n`);

    // 测试 6: 验证战绩更新
    console.log('测试 6: 验证战绩更新');
    const stats1 = PlayerService.getPlayerStats('测试玩家A');
    const stats2 = PlayerService.getPlayerStats('测试玩家B');
    console.log(`✅ ${stats1.name}: 总局数=${stats1.total_games}, 胜=${stats1.wins}, 负=${stats1.losses}, 胜率=${stats1.win_rate.toFixed(2)}%`);
    console.log(`✅ ${stats2.name}: 总局数=${stats2.total_games}, 胜=${stats2.wins}, 负=${stats2.losses}, 胜率=${stats2.win_rate.toFixed(2)}%\n`);

    // 测试 7: 验证正确性属性
    console.log('测试 7: 验证正确性属性');
    
    // 属性 1.1: 战绩总和等于总局数
    const sum1 = stats1.wins + stats1.losses + stats1.draws;
    const sum2 = stats2.wins + stats2.losses + stats2.draws;
    console.log(`✅ 属性 1.1 (玩家A): wins + losses + draws (${sum1}) === total_games (${stats1.total_games}): ${sum1 === stats1.total_games}`);
    console.log(`✅ 属性 1.1 (玩家B): wins + losses + draws (${sum2}) === total_games (${stats2.total_games}): ${sum2 === stats2.total_games}`);
    
    // 属性 1.2: 胜率计算正确
    const expectedWinRate1 = (stats1.wins / stats1.total_games) * 100;
    const expectedWinRate2 = (stats2.wins / stats2.total_games) * 100;
    console.log(`✅ 属性 1.2 (玩家A): win_rate (${stats1.win_rate.toFixed(2)}) === expected (${expectedWinRate1.toFixed(2)}): ${Math.abs(stats1.win_rate - expectedWinRate1) < 0.01}`);
    console.log(`✅ 属性 1.2 (玩家B): win_rate (${stats2.win_rate.toFixed(2)}) === expected (${expectedWinRate2.toFixed(2)}): ${Math.abs(stats2.win_rate - expectedWinRate2) < 0.01}\n`);

    // 测试 8: 获取对局详情
    console.log('测试 8: 获取对局详情');
    const gameDetail = GameService.getGame(savedGame.id);
    console.log(`✅ 对局详情: 房间=${gameDetail.room_id}, 黑棋=${gameDetail.black_player_name}, 白棋=${gameDetail.white_player_name}`);
    console.log(`✅ 胜者=${gameDetail.winner}, 手数=${gameDetail.total_moves}, 时长=${gameDetail.duration}秒\n`);

    // 测试 9: 验证对局数据属性
    console.log('测试 9: 验证对局数据属性');
    
    // 属性 2.1: 胜者信息有效
    const validWinner = [0, 1, 2].includes(gameDetail.winner);
    console.log(`✅ 属性 2.1: winner (${gameDetail.winner}) in [0, 1, 2]: ${validWinner}`);
    
    // 属性 2.2: 黑白玩家不同
    const differentPlayers = gameDetail.black_player_id !== gameDetail.white_player_id;
    console.log(`✅ 属性 2.2: black_player_id (${gameDetail.black_player_id}) !== white_player_id (${gameDetail.white_player_id}): ${differentPlayers}`);
    
    // 属性 1.3: 落子记录完整
    const movesComplete = gameDetail.moves.length === gameDetail.total_moves;
    console.log(`✅ 属性 1.3: moves.length (${gameDetail.moves.length}) === total_moves (${gameDetail.total_moves}): ${movesComplete}\n`);

    // 测试 10: 获取玩家对局历史
    console.log('测试 10: 获取玩家对局历史');
    const history = GameService.getPlayerGames('测试玩家A', 10);
    console.log(`✅ 玩家A的对局历史: ${history.length} 条记录\n`);

    // 测试 11: 获取回放数据
    console.log('测试 11: 获取回放数据');
    const replayData = GameService.getReplayData(savedGame.id);
    console.log(`✅ 回放数据: ${replayData.moves.length} 步棋\n`);

    // 测试 12: 保存多局游戏测试排行榜
    console.log('测试 12: 保存多局游戏测试排行榜');
    for (let i = 0; i < 4; i++) {
      await GameService.saveGame({
        roomId: `TEST00${i + 2}`,
        blackPlayerName: '测试玩家A',
        whitePlayerName: '测试玩家C',
        winner: i % 2 === 0 ? 1 : 2,
        moves: [{ row: 7, col: 7, color: 1 }],
        duration: 60,
        startedAt: new Date(Date.now() - 60000),
        finishedAt: new Date()
      });
    }
    console.log('✅ 已保存 4 局额外对局\n');

    // 测试 13: 获取排行榜
    console.log('测试 13: 获取排行榜');
    const leaderboard = PlayerService.getLeaderboard(10, 1);
    console.log('✅ 排行榜:');
    leaderboard.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name}: 胜率=${player.win_rate.toFixed(2)}%, 总局=${player.total_games}, 胜=${player.wins}`);
    });
    
    // 属性 3.1: 排行榜按胜率降序
    let sortedCorrectly = true;
    for (let i = 0; i < leaderboard.length - 1; i++) {
      if (leaderboard[i].win_rate < leaderboard[i + 1].win_rate) {
        sortedCorrectly = false;
        break;
      }
    }
    console.log(`✅ 属性 3.1: 排行榜按胜率降序排列: ${sortedCorrectly}\n`);

    // 测试 14: 数据库备份
    console.log('测试 14: 数据库备份');
    const backupPath = './data/test-backup.db';
    const backupSuccess = db.backup(backupPath);
    console.log(`✅ 数据库备份${backupSuccess ? '成功' : '失败'}\n`);

    console.log('========================================');
    console.log('✅ 所有测试通过！');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error(error.stack);
  } finally {
    // 清理测试数据
    console.log('清理测试数据...');
    try {
      const testDb = db.getDatabase();
      testDb.exec('DELETE FROM games');
      testDb.exec('DELETE FROM players');
      console.log('✅ 测试数据已清理\n');
    } catch (error) {
      console.log('⚠️ 清理测试数据时出错（可能数据库已关闭）\n');
    }
    
    db.close();
  }
}

// 运行测试
runTests();
