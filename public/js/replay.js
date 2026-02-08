/**
 * 对局回放控制器
 * 管理回放播放、暂停、进度控制等功能
 */

class ReplayController {
  constructor(gameData) {
    this.gameData = gameData;
    this.moves = gameData.moves || [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.speed = 1000; // 每步间隔（毫秒）
    this.playTimer = null;
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
  }

  /**
   * 播放回放
   */
  play() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.moves.length) {
      this.currentStep = 0;
      this.resetBoard();
    }

    this.isPlaying = true;
    this.playTimer = setInterval(() => {
      if (this.currentStep < this.moves.length) {
        this.nextStep();
      } else {
        this.pause();
      }
    }, this.speed);
  }

  /**
   * 暂停回放
   */
  pause() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  /**
   * 下一步
   */
  nextStep() {
    if (this.currentStep < this.moves.length) {
      const move = this.moves[this.currentStep];
      this.board[move.row][move.col] = move.color;
      this.currentStep++;
      return move;
    }
    return null;
  }

  /**
   * 上一步
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      const move = this.moves[this.currentStep];
      this.board[move.row][move.col] = 0;
      return move;
    }
    return null;
  }

  /**
   * 跳转到指定步数
   */
  gotoStep(step) {
    if (step < 0 || step > this.moves.length) return;

    this.pause();
    this.resetBoard();
    this.currentStep = 0;

    for (let i = 0; i < step; i++) {
      this.nextStep();
    }
  }

  /**
   * 设置播放速度
   */
  setSpeed(speed) {
    this.speed = speed;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  /**
   * 重置棋盘
   */
  resetBoard() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
  }

  /**
   * 获取当前棋盘状态
   */
  getBoard() {
    return this.board;
  }

  /**
   * 获取当前步数
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * 获取总步数
   */
  getTotalSteps() {
    return this.moves.length;
  }

  /**
   * 是否正在播放
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * 销毁控制器
   */
  destroy() {
    this.pause();
    this.board = null;
    this.moves = null;
  }
}

// 导出到全局
window.ReplayController = ReplayController;
