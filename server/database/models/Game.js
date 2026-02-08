/**
 * Game 数据模型
 * 管理对局记录和回放数据
 */

const { getDatabase } = require('../db');

class Game {
  /**
   * 创建新对局记录
   * @param {Object} gameData - 对局数据
   * @param {string} gameData.roomId - 房间号
   * @param {number} gameData.blackPlayerId - 黑棋玩家 ID
   * @param {number} gameData.whitePlayerId - 白棋玩家 ID
   * @param {number} gameData.winner - 胜者 (0=平局, 1=黑胜, 2=白胜)
   * @param {Array} gameData.moves - 落子序列
   * @param {number} gameData.duration - 游戏时长（秒）
   * @param {Date} gameData.startedAt - 开始时间
   * @param {Date} gameData.finishedAt - 结束时间
   */
  static create(gameData) {
    const db = getDatabase();
    
    // 验证数据
    this.validate(gameData);

    // 将落子序列转换为 JSON
    const movesJson = JSON.stringify(gameData.moves);

    const stmt = db.prepare(`
      INSERT INTO games (
        room_id, black_player_id, white_player_id, winner,
        total_moves, duration, moves, started_at, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      gameData.roomId,
      gameData.blackPlayerId,
      gameData.whitePlayerId,
      gameData.winner,
      gameData.moves.length,
      gameData.duration,
      movesJson,
      gameData.startedAt.toISOString(),
      gameData.finishedAt.toISOString()
    );

    return this.findById(result.lastInsertRowid);
  }

  /**
   * 验证对局数据
   */
  static validate(gameData) {
    if (!gameData.roomId) {
      throw new Error('缺少房间号');
    }
    if (!gameData.blackPlayerId || !gameData.whitePlayerId) {
      throw new Error('缺少玩家信息');
    }
    if (gameData.blackPlayerId === gameData.whitePlayerId) {
      throw new Error('黑白玩家不能相同');
    }
    if (!Array.isArray(gameData.moves) || gameData.moves.length === 0) {
      throw new Error('落子数据无效');
    }
    if (![0, 1, 2].includes(gameData.winner)) {
      throw new Error('胜者信息无效');
    }
  }

  /**
   * 根据 ID 查找对局
   */
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        g.*,
        bp.name as black_player_name,
        wp.name as white_player_name
      FROM games g
      LEFT JOIN players bp ON g.black_player_id = bp.id
      LEFT JOIN players wp ON g.white_player_id = wp.id
      WHERE g.id = ?
    `);

    const game = stmt.get(id);
    if (game) {
      game.moves = JSON.parse(game.moves);
    }
    return game;
  }

  /**
   * 获取玩家的对局历史
   * @param {number} playerId - 玩家 ID
   * @param {number} limit - 返回数量
   * @param {number} offset - 偏移量
   */
  static findByPlayer(playerId, limit = 20, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        g.id,
        g.room_id,
        g.winner,
        g.total_moves,
        g.duration,
        g.finished_at,
        bp.name as black_player_name,
        wp.name as white_player_name,
        CASE 
          WHEN g.black_player_id = ? THEN 1
          WHEN g.white_player_id = ? THEN 2
        END as my_color
      FROM games g
      LEFT JOIN players bp ON g.black_player_id = bp.id
      LEFT JOIN players wp ON g.white_player_id = wp.id
      WHERE g.black_player_id = ? OR g.white_player_id = ?
      ORDER BY g.finished_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(playerId, playerId, playerId, playerId, limit, offset);
  }

  /**
   * 获取回放数据
   */
  static getReplayData(gameId) {
    const game = this.findById(gameId);
    if (!game) {
      return null;
    }

    return {
      id: game.id,
      roomId: game.room_id,
      blackPlayer: game.black_player_name,
      whitePlayer: game.white_player_name,
      winner: game.winner,
      totalMoves: game.total_moves,
      duration: game.duration,
      moves: game.moves,
      startedAt: game.started_at,
      finishedAt: game.finished_at
    };
  }

  /**
   * 获取最近的对局
   */
  static getLatest(limit = 10) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        g.id,
        g.room_id,
        g.winner,
        g.total_moves,
        g.finished_at,
        bp.name as black_player_name,
        wp.name as white_player_name
      FROM games g
      LEFT JOIN players bp ON g.black_player_id = bp.id
      LEFT JOIN players wp ON g.white_player_id = wp.id
      ORDER BY g.finished_at DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  /**
   * 统计总对局数
   */
  static count() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM games');
    const result = stmt.get();
    return result.count;
  }

  /**
   * 删除过期对局
   * @param {number} daysOld - 保留天数
   */
  static cleanupOld(daysOld = 90) {
    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM games
      WHERE finished_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    return result.changes;
  }

  /**
   * 删除对局
   */
  static delete(gameId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM games WHERE id = ?');
    const result = stmt.run(gameId);
    return result.changes > 0;
  }
}

module.exports = Game;
