/**
 * API 调用封装模块
 * 封装所有后端 API 调用
 */

const API = {
  /**
   * 基础请求方法
   */
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '请求失败');
      }

      return data.data;
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  },

  /**
   * 获取玩家战绩
   * @param {string} playerName - 玩家名称
   * @returns {Promise<Object>} 战绩数据
   */
  async getPlayerStats(playerName) {
    return this.request(`/api/players/${encodeURIComponent(playerName)}/stats`);
  },

  /**
   * 获取玩家对局历史
   * @param {string} playerName - 玩家名称
   * @param {number} limit - 返回数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 对局历史数据
   */
  async getPlayerGames(playerName, limit = 20, offset = 0) {
    return this.request(
      `/api/players/${encodeURIComponent(playerName)}/games?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * 获取对局详情
   * @param {number} gameId - 对局 ID
   * @returns {Promise<Object>} 对局详情
   */
  async getGame(gameId) {
    return this.request(`/api/games/${gameId}`);
  },

  /**
   * 获取对局回放数据
   * @param {number} gameId - 对局 ID
   * @returns {Promise<Object>} 回放数据
   */
  async getReplayData(gameId) {
    return this.request(`/api/games/${gameId}/replay`);
  },

  /**
   * 获取排行榜
   * @param {string} sortBy - 排序方式 (win_rate|wins)
   * @param {number} limit - 返回数量
   * @param {number} minGames - 最低局数
   * @returns {Promise<Object>} 排行榜数据
   */
  async getLeaderboard(sortBy = 'win_rate', limit = 100, minGames = 5) {
    return this.request(
      `/api/leaderboard?sort=${sortBy}&limit=${limit}&minGames=${minGames}`
    );
  },

  /**
   * 获取最近对局
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 对局列表
   */
  async getRecentGames(limit = 10) {
    return this.request(`/api/games/recent?limit=${limit}`);
  }
};

// 导出到全局
window.API = API;
