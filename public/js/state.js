// 游戏状态管理模块
// 集中管理所有游戏状态数据

const gameState = {
  // 玩家信息
  myColor: 0,        // 1=黑棋, 2=白棋
  myName: '',
  roomId: '',
  
  // 游戏状态
  currentTurn: 1,
  gameActive: false,
  moveCount: 0
};

// 棋盘配置常量
const BOARD_CONFIG = {
  SIZE: 15,
  CELL_SIZE: 1,
  get WIDTH() {
    return (this.SIZE - 1) * this.CELL_SIZE;
  }
};
