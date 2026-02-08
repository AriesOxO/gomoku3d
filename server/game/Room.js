/**
 * 房间管理模块
 * 负责房间状态和玩家管理
 */

class Room {
  constructor(roomId) {
    this.id = roomId;
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
    this.players = [];
    this.currentTurn = 1; // 1=黑棋, 2=白棋
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.startedAt = null; // 游戏开始时间
  }

  /**
   * 添加玩家
   * @param {Object} player - 玩家信息 {id, name, color}
   * @returns {boolean} 是否添加成功
   */
  addPlayer(player) {
    if (this.players.length >= 2) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  /**
   * 获取玩家
   * @param {string} socketId - Socket ID
   * @returns {Object|null} 玩家对象
   */
  getPlayer(socketId) {
    return this.players.find(p => p.id === socketId);
  }

  /**
   * 移除玩家
   * @param {string} socketId - Socket ID
   */
  removePlayer(socketId) {
    this.players = this.players.filter(p => p.id !== socketId);
  }

  /**
   * 落子
   * @param {number} row - 行
   * @param {number} col - 列
   * @param {number} color - 棋子颜色
   * @returns {boolean} 是否落子成功
   */
  placeStone(row, col, color) {
    if (this.board[row][col] !== 0) {
      return false;
    }
    this.board[row][col] = color;
    this.moveHistory.push({ row, col, color });
    return true;
  }

  /**
   * 切换回合
   */
  switchTurn() {
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
  }

  /**
   * 获取游戏时长（秒）
   * @returns {number} 游戏时长
   */
  getDuration() {
    if (!this.startedAt) {
      return 0;
    }
    return Math.floor((new Date() - this.startedAt) / 1000);
  }

  /**
   * 重置游戏
   */
  reset() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
    this.currentTurn = 1;
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.startedAt = null;
  }

  /**
   * 检查房间是否已满
   * @returns {boolean}
   */
  isFull() {
    return this.players.length >= 2;
  }

  /**
   * 检查房间是否为空
   * @returns {boolean}
   */
  isEmpty() {
    return this.players.length === 0;
  }
}

module.exports = Room;
