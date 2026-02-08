/**
 * 数据库定时任务调度器
 * 使用 node-cron 实现定时备份和维护
 */

const cron = require('node-cron');
const DatabaseMaintenance = require('./maintenance');

class DatabaseScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * 启动所有定时任务
   */
  start() {
    console.log('📅 启动数据库定时任务...');

    // 每天凌晨 3 点执行完整维护
    const dailyMaintenanceTask = cron.schedule('0 3 * * *', () => {
      console.log('\n⏰ 执行每日数据库维护...');
      try {
        DatabaseMaintenance.performFullMaintenance({
          backup: true,
          cleanup: true,
          optimize: true,
          daysToKeep: 90
        });
      } catch (error) {
        console.error('每日维护失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    // 每周日凌晨 2 点执行深度优化
    const weeklyOptimizeTask = cron.schedule('0 2 * * 0', () => {
      console.log('\n⏰ 执行每周数据库优化...');
      try {
        DatabaseMaintenance.optimize();
      } catch (error) {
        console.error('每周优化失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    // 每小时执行一次备份（可选，根据需要启用）
    const hourlyBackupTask = cron.schedule('0 * * * *', () => {
      console.log('\n⏰ 执行每小时备份...');
      try {
        DatabaseMaintenance.backup();
      } catch (error) {
        console.error('每小时备份失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    // 保存任务引用
    this.tasks.push({
      name: '每日维护',
      schedule: '每天 03:00',
      task: dailyMaintenanceTask,
      enabled: true
    });

    this.tasks.push({
      name: '每周优化',
      schedule: '每周日 02:00',
      task: weeklyOptimizeTask,
      enabled: true
    });

    this.tasks.push({
      name: '每小时备份',
      schedule: '每小时整点',
      task: hourlyBackupTask,
      enabled: false // 默认禁用，根据需要启用
    });

    // 启动已启用的任务
    this.tasks.forEach(({ name, schedule, task, enabled }) => {
      if (enabled) {
        task.start();
        console.log(`  ✅ ${name} (${schedule})`);
      } else {
        console.log(`  ⏸️  ${name} (${schedule}) - 已禁用`);
      }
    });

    console.log('📅 定时任务启动完成\n');
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    console.log('⏹️  停止数据库定时任务...');
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`  ✅ ${name} 已停止`);
    });
    console.log('⏹️  定时任务已全部停止\n');
  }

  /**
   * 启用指定任务
   * @param {string} taskName - 任务名称
   */
  enableTask(taskName) {
    const taskInfo = this.tasks.find(t => t.name === taskName);
    if (taskInfo) {
      taskInfo.task.start();
      taskInfo.enabled = true;
      console.log(`✅ 已启用任务: ${taskName}`);
    } else {
      console.error(`❌ 任务不存在: ${taskName}`);
    }
  }

  /**
   * 禁用指定任务
   * @param {string} taskName - 任务名称
   */
  disableTask(taskName) {
    const taskInfo = this.tasks.find(t => t.name === taskName);
    if (taskInfo) {
      taskInfo.task.stop();
      taskInfo.enabled = false;
      console.log(`⏸️  已禁用任务: ${taskName}`);
    } else {
      console.error(`❌ 任务不存在: ${taskName}`);
    }
  }

  /**
   * 获取所有任务状态
   * @returns {Array} 任务列表
   */
  getTasksStatus() {
    return this.tasks.map(({ name, schedule, enabled }) => ({
      name,
      schedule,
      enabled
    }));
  }
}

// 导出单例
const scheduler = new DatabaseScheduler();
module.exports = scheduler;
