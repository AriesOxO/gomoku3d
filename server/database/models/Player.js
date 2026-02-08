/**
 * Player 数据模型
 * 管理玩家信息和战绩
 */

const { getDatabase } = require('../db');

class Player {
  /**
   * 创建新玩家
   */
  static create(name) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(`
        INSERT INTO players (name, created_at, updated_at)
        VALUES (?, datetime('now'), datetime('now'))
      `);
      
      const result = stmt.run(name);
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error(`玩家名称 "${name}" 已存在`);
      }
      throw error;
    }
  }

  /**
   * 根据 ID 查找玩家
   */
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 根据名称查找玩家
   */
  static findByName(name) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM players WHERE name = ?');
    return stmt.get(name);
  }

  /**
   * 获取或创建玩家
   */
  static getOrCreate(name) {
    let player = this.findByName(name);
    if (!player) {
      player = this.create(name);
    }
    return player;
  }

  /**
   * 更新玩家战绩
   * @param {number} playerId - 玩家 ID
   * @param {string} result - 比赛结果: 'win', 'loss', 'draw'
   */
  static updateStats(playerId, result) {
    const db = getDatabase();
    
    // 获取当前战绩
    const player = this.findById(playerId);
    if (!player) {
      throw new Error(`玩家 ID ${playerId} 不存在`);
    }

    // 计算新战绩
    const newStats = {
      total_games: player.total_games + 1,
      wins: player.wins + (result === 'win' ? 1 : 0),
      losses: player.losses + (result === 'loss' ? 1 : 0),
      draws: player.draws + (result === 'draw' ? 1 : 0)
    };

    // 计算胜率
    newStats.win_rate = (newStats.wins / newStats.total_games) * 100;

    // 更新数据库
    const stmt = db.prepare(`
      UPDATE players
      SET total_games = ?,
          wins = ?,
          losses = ?,
          draws = ?,
          win_rate = ?,
          last_played_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      newStats.total_games,
      newStats.wins,
      newStats.losses,
      newStats.draws,
      newStats.win_rate,
      playerId
    );

    return this.findById(playerId);
  }

  /**
   * 获取玩家统计信息
   */
  static getStats(name) {
    const player = this.findByName(name);
    if (!player) {
      return null;
    }

    return {
      name: player.name,
      total_games: player.total_games,
      wins: player.wins,
      losses: player.losses,
      draws: player.draws,
      win_rate: player.win_rate,
      last_played_at: player.last_played_at,
      created_at: player.created_at
    };
  }

  /**
   * 获取排行榜
   * @param {number} limit - 返回数量
   * @param {number} minGames - 最低局数要求
   */
  static getLeaderboard(limit = 100, minGames = 5) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT name, total_games, wins, losses, draws, win_rate
      FROM players
      WHERE total_games >= ?
      ORDER BY win_rate DESC, total_games DESC
      LIMIT ?
    `);

    return stmt.all(minGames, limit);
  }

  /**
   * 获取玩家排名
   */
  static getRank(playerId, minGames = 5) {
    const db = getDatabase();
    const player = this.findById(playerId);
    
    if (!player) {
      return null;
    }

    const stmt = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM players
      WHERE total_games >= ?
        AND (win_rate > ? OR (win_rate = ? AND total_games > ?))
    `);

    const result = stmt.get(minGames, player.win_rate, player.win_rate, player.total_games);
    return result.rank;
  }

  /**
   * 删除玩家
   */
  static delete(playerId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM players WHERE id = ?');
    const result = stmt.run(playerId);
    return result.changes > 0;
  }
}

module.exports = Player;
