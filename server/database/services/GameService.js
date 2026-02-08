/**
 * 对局业务服务层
 * 封装对局相关的业务逻辑
 */

const Game = require('../models/Game');
const PlayerService = require('./PlayerService');

class GameService {
  /**
   * 保存对局记录并更新玩家战绩
   * @param {Object} gameData - 对局数据
   * @param {string} gameData.roomId - 房间号
   * @param {string} gameData.blackPlayerName - 黑棋玩家名称
   * @param {string} gameData.whitePlayerName - 白棋玩家名称
   * @param {number} gameData.winner - 胜者 (0=平局, 1=黑胜, 2=白胜)
   * @param {Array} gameData.moves - 落子序列
   * @param {number} gameData.duration - 游戏时长（秒）
   * @param {Date} gameData.startedAt - 开始时间
   * @param {Date} gameData.finishedAt - 结束时间
   * @returns {Object} 保存的对局对象
   */
  static async saveGame(gameData) {
    try {
      // 获取或创建玩家
      const blackPlayer = PlayerService.getOrCreatePlayer(gameData.blackPlayerName);
      const whitePlayer = PlayerService.getOrCreatePlayer(gameData.whitePlayerName);

      // 创建对局记录
      const game = Game.create({
        roomId: gameData.roomId,
        blackPlayerId: blackPlayer.id,
        whitePlayerId: whitePlayer.id,
        winner: gameData.winner,
        moves: gameData.moves,
        duration: gameData.duration,
        startedAt: gameData.startedAt,
        finishedAt: gameData.finishedAt
      });

      // 更新玩家战绩
      if (gameData.winner === 1) {
        // 黑棋胜
        PlayerService.updatePlayerStats(blackPlayer.id, 'win');
        PlayerService.updatePlayerStats(whitePlayer.id, 'loss');
      } else if (gameData.winner === 2) {
        // 白棋胜
        PlayerService.updatePlayerStats(blackPlayer.id, 'loss');
        PlayerService.updatePlayerStats(whitePlayer.id, 'win');
      } else {
        // 平局
        PlayerService.updatePlayerStats(blackPlayer.id, 'draw');
        PlayerService.updatePlayerStats(whitePlayer.id, 'draw');
      }

      console.log(`✅ 对局已保存: ${game.id}, 房间: ${gameData.roomId}`);
      return game;
    } catch (error) {
      console.error('❌ 保存对局失败:', error);
      throw error;
    }
  }

  /**
   * 获取对局详情
   * @param {number} gameId - 对局 ID
   * @returns {Object|null} 对局对象
   */
  static getGame(gameId) {
    try {
      return Game.findById(gameId);
    } catch (error) {
      console.error('获取对局详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取玩家的对局历史
   * @param {string} playerName - 玩家名称
   * @param {number} limit - 返回数量
   * @param {number} offset - 偏移量
   * @returns {Array} 对局历史列表
   */
  static getPlayerGames(playerName, limit = 20, offset = 0) {
    try {
      const stats = PlayerService.getPlayerStats(playerName);
      if (!stats) {
        return [];
      }

      const player = PlayerService.getOrCreatePlayer(playerName);
      return Game.findByPlayer(player.id, limit, offset);
    } catch (error) {
      console.error('获取玩家对局历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取回放数据
   * @param {number} gameId - 对局 ID
   * @returns {Object|null} 回放数据
   */
  static getReplayData(gameId) {
    try {
      return Game.getReplayData(gameId);
    } catch (error) {
      console.error('获取回放数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的对局
   * @param {number} limit - 返回数量
   * @returns {Array} 对局列表
   */
  static getLatestGames(limit = 10) {
    try {
      return Game.getLatest(limit);
    } catch (error) {
      console.error('获取最近对局失败:', error);
      throw error;
    }
  }

  /**
   * 删除过期对局
   * @param {number} daysOld - 保留天数
   * @returns {number} 删除的记录数
   */
  static cleanupOldGames(daysOld = 90) {
    try {
      const deleted = Game.cleanupOld(daysOld);
      console.log(`✅ 已清理 ${deleted} 条过期对局记录`);
      return deleted;
    } catch (error) {
      console.error('清理过期对局失败:', error);
      throw error;
    }
  }
}

module.exports = GameService;
