/**
 * 游戏逻辑模块
 * 负责胜负判断等核心游戏逻辑
 */

class GameLogic {
  /**
   * 检查是否获胜
   * @param {Array} board - 15x15 棋盘数组
   * @param {number} row - 落子行
   * @param {number} col - 落子列
   * @param {number} player - 玩家颜色 (1=黑, 2=白)
   * @returns {boolean} 是否获胜
   */
  static checkWin(board, row, col, player) {
    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 主对角线
      [1, -1]   // 副对角线
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // 正向检查
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
          count++;
        } else {
          break;
        }
      }
      
      // 反向检查
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 5) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 检查是否平局
   * @param {Array} moveHistory - 落子历史
   * @returns {boolean} 是否平局
   */
  static checkDraw(moveHistory) {
    return moveHistory.length >= 225; // 15x15 = 225
  }
}

module.exports = GameLogic;
