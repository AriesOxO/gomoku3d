/**
 * 数据库维护模块
 * 提供备份、清理、优化等维护功能
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./db');

class DatabaseMaintenance {
  /**
   * 备份数据库
   * @param {string} backupPath - 备份文件路径（可选）
   * @returns {string} 备份文件路径
   */
  static backup(backupPath) {
    try {
      const db = getDatabase();
      
      // 生成备份文件名
      if (!backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '../../data/backups');
        
        // 确保备份目录存在
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        backupPath = path.join(backupDir, `gomoku-backup-${timestamp}.db`);
      }
      
      // 执行备份
      db.backup(backupPath);
      
      console.log(`✅ 数据库备份成功: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ 数据库备份失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   * @param {number} daysToKeep - 保留天数（默认 90 天）
   * @returns {Object} 清理统计
   */
  static cleanupOldData(daysToKeep = 90) {
    try {
      const db = getDatabase();
      
      // 计算截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString();
      
      // 清理过期对局
      const deleteGamesStmt = db.prepare(`
        DELETE FROM games 
        WHERE finished_at < ?
      `);
      const gamesResult = deleteGamesStmt.run(cutoffDateStr);
      
      // 清理无对局的玩家
      const deletePlayersStmt = db.prepare(`
        DELETE FROM players 
        WHERE total_games = 0 
        AND created_at < ?
      `);
      const playersResult = deletePlayersStmt.run(cutoffDateStr);
      
      const stats = {
        gamesDeleted: gamesResult.changes,
        playersDeleted: playersResult.changes,
        cutoffDate: cutoffDateStr
      };
      
      console.log(`✅ 数据清理完成: 删除 ${stats.gamesDeleted} 局对局, ${stats.playersDeleted} 个玩家`);
      return stats;
    } catch (error) {
      console.error('❌ 数据清理失败:', error);
      throw error;
    }
  }

  /**
   * 优化数据库（VACUUM）
   * 回收空间并优化性能
   */
  static optimize() {
    try {
      const db = getDatabase();
      
      // 获取优化前的大小
      const beforeSize = this.getDatabaseSize();
      
      // 执行 VACUUM
      db.exec('VACUUM');
      
      // 分析表以更新统计信息
      db.exec('ANALYZE');
      
      // 获取优化后的大小
      const afterSize = this.getDatabaseSize();
      const savedSpace = Math.max(0, beforeSize - afterSize);
      
      console.log(`✅ 数据库优化完成: 节省 ${this.formatBytes(savedSpace)}`);
      return {
        beforeSize,
        afterSize,
        savedSpace
      };
    } catch (error) {
      console.error('❌ 数据库优化失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库文件大小
   * @returns {number} 文件大小（字节）
   */
  static getDatabaseSize() {
    try {
      const db = getDatabase();
      const dbPath = db.name;
      const stats = fs.statSync(dbPath);
      return stats.size;
    } catch (error) {
      console.error('❌ 获取数据库大小失败:', error);
      return 0;
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 获取数据库统计信息
   * @returns {Object} 统计信息
   */
  static getStatistics() {
    try {
      const db = getDatabase();
      
      // 玩家统计
      const playersStmt = db.prepare('SELECT COUNT(*) as count FROM players');
      const totalPlayers = playersStmt.get().count;
      
      const activePlayersStmt = db.prepare('SELECT COUNT(*) as count FROM players WHERE total_games > 0');
      const activePlayers = activePlayersStmt.get().count;
      
      // 对局统计
      const gamesStmt = db.prepare('SELECT COUNT(*) as count FROM games');
      const totalGames = gamesStmt.get().count;
      
      // 最早和最新对局
      const dateRangeStmt = db.prepare(`
        SELECT 
          MIN(finished_at) as earliest,
          MAX(finished_at) as latest
        FROM games
      `);
      const dateRange = dateRangeStmt.get();
      
      // 数据库大小
      const dbSize = this.getDatabaseSize();
      
      return {
        totalPlayers,
        activePlayers,
        totalGames,
        earliestGame: dateRange.earliest,
        latestGame: dateRange.latest,
        databaseSize: dbSize,
        databaseSizeFormatted: this.formatBytes(dbSize)
      };
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 执行完整维护（备份 + 清理 + 优化）
   * @param {Object} options - 维护选项
   * @returns {Object} 维护结果
   */
  static performFullMaintenance(options = {}) {
    const {
      backup = true,
      cleanup = true,
      optimize = true,
      daysToKeep = 90
    } = options;
    
    console.log('=== 开始数据库维护 ===\n');
    
    const results = {};
    
    try {
      // 1. 备份
      if (backup) {
        console.log('1. 执行备份...');
        results.backupPath = this.backup();
        console.log();
      }
      
      // 2. 清理
      if (cleanup) {
        console.log('2. 清理过期数据...');
        results.cleanupStats = this.cleanupOldData(daysToKeep);
        console.log();
      }
      
      // 3. 优化
      if (optimize) {
        console.log('3. 优化数据库...');
        results.optimizeStats = this.optimize();
        console.log();
      }
      
      // 4. 统计信息
      console.log('4. 数据库统计:');
      results.statistics = this.getStatistics();
      console.log(`  总玩家数: ${results.statistics.totalPlayers}`);
      console.log(`  活跃玩家: ${results.statistics.activePlayers}`);
      console.log(`  总对局数: ${results.statistics.totalGames}`);
      console.log(`  数据库大小: ${results.statistics.databaseSizeFormatted}`);
      console.log();
      
      console.log('=== 数据库维护完成 ✅ ===');
      return results;
    } catch (error) {
      console.error('=== 数据库维护失败 ❌ ===');
      throw error;
    }
  }
}

module.exports = DatabaseMaintenance;
