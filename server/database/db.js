/**
 * 数据库连接管理模块
 * 使用 SQLite 作为本地数据库
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库配置
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/gomoku.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * 初始化数据库连接
 */
function initialize() {
  try {
    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接
    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null
    });

    // 启用外键约束
    db.pragma('foreign_keys = ON');

    // 执行数据库表结构初始化
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    console.log(`✅ 数据库已初始化: ${DB_PATH}`);
    return db;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initialize()');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
function close() {
  if (db) {
    db.close();
    db = null;
    console.log('数据库连接已关闭');
  }
}

/**
 * 执行数据库备份
 */
function backup(backupPath) {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  try {
    // 确保备份目录存在
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 执行备份
    db.backup(backupPath);
    console.log(`✅ 数据库已备份到: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('❌ 数据库备份失败:', error);
    return false;
  }
}

/**
 * 优化数据库（VACUUM）
 */
function optimize() {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  try {
    db.exec('VACUUM');
    console.log('✅ 数据库已优化');
    return true;
  } catch (error) {
    console.error('❌ 数据库优化失败:', error);
    return false;
  }
}

module.exports = {
  initialize,
  getDatabase,
  close,
  backup,
  optimize
};
