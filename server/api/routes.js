/**
 * API 路由模块
 * 提供 RESTful API 端点
 */

const express = require('express');
const PlayerService = require('../database/services/PlayerService');
const GameService = require('../database/services/GameService');

const router = express.Router();

/**
 * 获取玩家战绩
 * GET /api/players/:name/stats
 */
router.get('/players/:name/stats', (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAYER_NAME',
          message: '玩家名称不能为空'
        }
      });
    }

    const stats = PlayerService.getPlayerStats(name);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: '玩家不存在'
        }
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取玩家战绩失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * 获取玩家对局历史
 * GET /api/players/:name/games?limit=20&offset=0
 */
router.get('/players/:name/games', (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAYER_NAME',
          message: '玩家名称不能为空'
        }
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'limit 必须在 1-100 之间'
        }
      });
    }

    const games = GameService.getPlayerGames(name, limit, offset);

    res.json({
      success: true,
      data: {
        games,
        limit,
        offset,
        hasMore: games.length === limit
      }
    });
  } catch (error) {
    console.error('获取玩家对局历史失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * 获取最近对局
 * GET /api/games/recent?limit=10
 */
router.get('/games/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'limit 必须在 1-50 之间'
        }
      });
    }

    const games = GameService.getLatestGames(limit);

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('获取最近对局失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * 获取对局详情
 * GET /api/games/:id
 */
router.get('/games/:id', (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    if (isNaN(gameId) || gameId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GAME_ID',
          message: '无效的对局 ID'
        }
      });
    }

    const game = GameService.getGame(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: '对局不存在'
        }
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('获取对局详情失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * 获取对局回放数据
 * GET /api/games/:id/replay
 */
router.get('/games/:id/replay', (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    if (isNaN(gameId) || gameId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GAME_ID',
          message: '无效的对局 ID'
        }
      });
    }

    const replayData = GameService.getReplayData(gameId);

    if (!replayData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: '对局不存在'
        }
      });
    }

    res.json({
      success: true,
      data: replayData
    });
  } catch (error) {
    console.error('获取回放数据失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * 获取排行榜
 * GET /api/leaderboard?sort=win_rate&limit=100
 */
router.get('/leaderboard', (req, res) => {
  try {
    const sortBy = req.query.sort || 'win_rate';
    const limit = parseInt(req.query.limit) || 100;
    const minGames = parseInt(req.query.minGames) || 5;

    if (!['win_rate', 'wins'].includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SORT',
          message: 'sort 必须是 win_rate 或 wins'
        }
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'limit 必须在 1-100 之间'
        }
      });
    }

    const leaderboard = PlayerService.getLeaderboard(limit, minGames);

    res.json({
      success: true,
      data: {
        leaderboard,
        sortBy,
        limit,
        minGames
      }
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

  }
});

module.exports = router;
