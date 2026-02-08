/**
 * 玩家业务服务层
 * 封装玩家相关的业务逻辑
 */

const Player = require('../models/Player');

class PlayerService {
  /**
   * 获取或创建玩家
   * @param {string} name - 玩家名称
   * @returns {Object} 玩家对象
   */
  static getOrCreatePlayer(name) {
    try {
      return Player.getOrCreate(name);
    } catch (error) {
      console.error('获取或创建玩家失败:', error);
      throw error;
    }
  }

  /**
   * 获取玩家战绩
   * @param {string} name - 玩家名称
   * @returns {Object|null} 战绩对象
   */
  static getPlayerStats(name) {
    try {
      return Player.getStats(name);
    } catch (error) {
      console.error('获取玩家战绩失败:', error);
      throw error;
    }
  }

  /**
   * 更新玩家战绩
   * @param {number} playerId - 玩家 ID
   * @param {string} result - 比赛结果: 'win', 'loss', 'draw'
   * @returns {Object} 更新后的玩家对象
   */
  static updatePlayerStats(playerId, result) {
    try {
      if (!['win', 'loss', 'draw'].includes(result)) {
        throw new Error(`无效的比赛结果: ${result}`);
      }
      return Player.updateStats(playerId, result);
    } catch (error) {
      console.error('更新玩家战绩失败:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜
   * @param {number} limit - 返回数量
   * @param {number} minGames - 最低局数要求
   * @returns {Array} 排行榜数据
   */
  static getLeaderboard(limit = 100, minGames = 5) {
    try {
      return Player.getLeaderboard(limit, minGames);
    } catch (error) {
      console.error('获取排行榜失败:', error);
      throw error;
    }
  }

  /**
   * 获取玩家排名
   * @param {number} playerId - 玩家 ID
   * @param {number} minGames - 最低局数要求
   * @returns {number|null} 排名
   */
  static getPlayerRank(playerId, minGames = 5) {
    try {
      return Player.getRank(playerId, minGames);
    } catch (error) {
      console.error('获取玩家排名失败:', error);
      throw error;
    }
  }
}

module.exports = PlayerService;
