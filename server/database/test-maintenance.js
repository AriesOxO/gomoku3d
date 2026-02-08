/**
 * 数据库维护功能测试
 */

const { initialize } = require('./db');
const DatabaseMaintenance = require('./maintenance');
const { logger } = require('../utils/logger');

async function testMaintenance() {
  console.log('=== 数据库维护功能测试 ===\n');

  try {
    // 初始化数据库
    initialize();
    logger.info('数据库初始化成功');
    console.log();

    // 测试 1: 获取数据库统计信息
    console.log('测试 1: 获取数据库统计信息');
    const stats = DatabaseMaintenance.getStatistics();
    console.log('✅ 统计信息:');
    console.log(`  总玩家数: ${stats.totalPlayers}`);
    console.log(`  活跃玩家: ${stats.activePlayers}`);
    console.log(`  总对局数: ${stats.totalGames}`);
    console.log(`  数据库大小: ${stats.databaseSizeFormatted}`);
    if (stats.earliestGame) {
      console.log(`  最早对局: ${stats.earliestGame}`);
      console.log(`  最新对局: ${stats.latestGame}`);
    }
    console.log();

    // 测试 2: 备份数据库
    console.log('测试 2: 备份数据库');
    const backupPath = DatabaseMaintenance.backup();
    console.log(`✅ 备份成功: ${backupPath}`);
    console.log();

    // 测试 3: 清理过期数据（测试模式，保留 365 天）
    console.log('测试 3: 清理过期数据');
    const cleanupStats = DatabaseMaintenance.cleanupOldData(365);
    console.log('✅ 清理统计:');
    console.log(`  删除对局: ${cleanupStats.gamesDeleted}`);
    console.log(`  删除玩家: ${cleanupStats.playersDeleted}`);
    console.log(`  截止日期: ${cleanupStats.cutoffDate}`);
    console.log();

    // 测试 4: 优化数据库
    console.log('测试 4: 优化数据库');
    const optimizeStats = DatabaseMaintenance.optimize();
    console.log('✅ 优化统计:');
    console.log(`  优化前: ${DatabaseMaintenance.formatBytes(optimizeStats.beforeSize)}`);
    console.log(`  优化后: ${DatabaseMaintenance.formatBytes(optimizeStats.afterSize)}`);
    console.log(`  节省空间: ${DatabaseMaintenance.formatBytes(optimizeStats.savedSpace)}`);
    console.log();

    // 测试 5: 执行完整维护
    console.log('测试 5: 执行完整维护');
    const maintenanceResults = DatabaseMaintenance.performFullMaintenance({
      backup: true,
      cleanup: false, // 跳过清理避免删除数据
      optimize: true,
      daysToKeep: 90
    });
    console.log('✅ 完整维护完成');
    console.log();

    console.log('=== 所有测试通过 ✅ ===');
    logger.info('数据库维护测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    logger.error('数据库维护测试失败', { error: error.message });
    process.exit(1);
  }
}

// 运行测试
testMaintenance();
