/**
 * 统计服务层
 * 提供全局统计和排行榜功能
 */

const Player = require('../models/Player');
const Game = require('../models/Game');

class StatsService {
  /**
   * 获取排行榜
   * @param {string} sortBy - 排序方式 (win_rate|wins|total_games)
   * @param {number} limit - 返回数量
   * @param {number} minGames - 最低局数要求
   * @returns {Array} 排行榜数据
   */
  static getLeaderboard(sortBy = 'win_rate', limit = 100, minGames = 5) {
    try {
      // 使用 Player 模型的排行榜方法
      const leaderboard = Player.getLeaderboard(limit, minGames);
      
      // 添加排名
      return leaderboard.map((player, index) => ({
        rank: index + 1,
        ...player
      }));
    } catch (error) {
      console.error('获取排行榜失败:', error);
      throw error;
    }
  }

  /**
   * 获取玩家排名
   * @param {string} playerName - 玩家名称
   * @param {number} minGames - 最低局数要求
   * @returns {Object|null} 排名信息
   */
  static getPlayerRank(playerName, minGames = 5) {
    try {
      const player = Player.findByName(playerName);
      if (!player) {
        return null;
      }

      const rank = Player.getRank(player.id, minGames);
      
      return {
        rank,
        name: player.name,
        total_games: player.total_games,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        win_rate: player.win_rate
      };
    } catch (error) {
      console.error('获取玩家排名失败:', error);
      throw error;
    }
  }

  /**
   * 获取全局统计信息
   * @returns {Object} 全局统计数据
   */
  static getGlobalStats() {
    try {
      const { getDatabase } = require('../db');
      const db = getDatabase();

      // 总玩家数
      const totalPlayersStmt = db.prepare('SELECT COUNT(*) as count FROM players');
      const totalPlayers = totalPlayersStmt.get().count;

      // 活跃玩家数（至少玩过一局）
      const activePlayersStmt = db.prepare('SELECT COUNT(*) as count FROM players WHERE total_games > 0');
      const activePlayers = activePlayersStmt.get().count;

      // 总对局数
      const totalGames = Game.count();

      // 今日对局数
      const todayGamesStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM games 
        WHERE date(finished_at) = date('now')
      `);
      const todayGames = todayGamesStmt.get().count;

      // 本周对局数
      const weekGamesStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM games 
        WHERE finished_at >= datetime('now', '-7 days')
      `);
      const weekGames = weekGamesStmt.get().count;

      // 平均每局手数
      const avgMovesStmt = db.prepare('SELECT AVG(total_moves) as avg FROM games');
      const avgMoves = Math.round(avgMovesStmt.get().avg || 0);

      // 最长对局
      const longestGameStmt = db.prepare(`
        SELECT g.*, bp.name as black_player_name, wp.name as white_player_name
        FROM games g
        LEFT JOIN players bp ON g.black_player_id = bp.id
        LEFT JOIN players wp ON g.white_player_id = wp.id
        ORDER BY total_moves DESC
        LIMIT 1
      `);
      const longestGame = longestGameStmt.get();

      // 最快对局
      const fastestGameStmt = db.prepare(`
        SELECT g.*, bp.name as black_player_name, wp.name as white_player_name
        FROM games g
        LEFT JOIN players bp ON g.black_player_id = bp.id
        LEFT JOIN players wp ON g.white_player_id = wp.id
        WHERE duration IS NOT NULL AND duration > 0
        ORDER BY duration ASC
        LIMIT 1
      `);
      const fastestGame = fastestGameStmt.get();

      return {
        totalPlayers,
        activePlayers,
        totalGames,
        todayGames,
        weekGames,
        avgMoves,
        longestGame: longestGame ? {
          id: longestGame.id,
          blackPlayer: longestGame.black_player_name,
          whitePlayer: longestGame.white_player_name,
          moves: longestGame.total_moves,
          date: longestGame.finished_at
        } : null,
        fastestGame: fastestGame ? {
          id: fastestGame.id,
          blackPlayer: fastestGame.black_player_name,
          whitePlayer: fastestGame.white_player_name,
          duration: fastestGame.duration,
          date: fastestGame.finished_at
        } : null
      };
    } catch (error) {
      console.error('获取全局统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近活跃玩家
   * @param {number} limit - 返回数量
   * @returns {Array} 最近活跃玩家列表
   */
  static getRecentActivePlayers(limit = 10) {
    try {
      const { getDatabase } = require('../db');
      const db = getDatabase();

      const stmt = db.prepare(`
        SELECT name, total_games, wins, win_rate, last_played_at
        FROM players
        WHERE last_played_at IS NOT NULL
        ORDER BY last_played_at DESC
        LIMIT ?
      `);

      return stmt.all(limit);
    } catch (error) {
      console.error('获取最近活跃玩家失败:', error);
      throw error;
    }
  }
}

module.exports = StatsService;
