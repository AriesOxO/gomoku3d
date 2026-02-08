-- 游戏持久化数据库表结构
-- SQLite 数据库

-- 玩家表
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0.0,
  last_played_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 玩家表索引
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_win_rate ON players(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_players_total_games ON players(total_games DESC);

-- 对局表
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  black_player_id INTEGER NOT NULL,
  white_player_id INTEGER NOT NULL,
  winner INTEGER, -- 0=平局, 1=黑胜, 2=白胜
  total_moves INTEGER NOT NULL,
  duration INTEGER, -- 游戏时长（秒）
  moves TEXT NOT NULL, -- JSON 格式: [{row, col, color, timestamp}]
  started_at DATETIME NOT NULL,
  finished_at DATETIME NOT NULL,
  FOREIGN KEY (black_player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (white_player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 对局表索引
CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player_id);
CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_finished_at ON games(finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
