/**
 * 统一日志记录模块
 * 提供分级日志记录功能
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 日志级别名称
const LogLevelNames = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

// 日志级别颜色（终端）
const LogLevelColors = {
  0: '\x1b[36m', // 青色
  1: '\x1b[32m', // 绿色
  2: '\x1b[33m', // 黄色
  3: '\x1b[31m'  // 红色
};

const ResetColor = '\x1b[0m';

class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    
    // 确保日志目录存在
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 格式化时间戳
   * @returns {string} 格式化的时间戳
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * 获取日志文件路径
   * @param {string} type - 日志类型（info, error）
   * @returns {string} 日志文件路径
   */
  getLogFilePath(type = 'info') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  /**
   * 写入日志到文件
   * @param {string} message - 日志消息
   * @param {number} level - 日志级别
   */
  writeToFile(message, level) {
    if (!this.enableFile) return;

    try {
      const type = level >= LogLevel.ERROR ? 'error' : 'info';
      const logFile = this.getLogFilePath(type);
      
      // 检查文件大小，如果超过限制则轮转
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxFileSize) {
          const timestamp = Date.now();
          const archiveFile = logFile.replace('.log', `-${timestamp}.log`);
          fs.renameSync(logFile, archiveFile);
        }
      }
      
      fs.appendFileSync(logFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加信息
   */
  log(level, message, meta = {}) {
    if (level < this.level) return;

    const timestamp = this.getTimestamp();
    const levelName = LogLevelNames[level];
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    // 格式化日志消息
    const logMessage = `[${timestamp}] [${levelName}] ${message}${metaStr}`;
    
    // 输出到控制台
    if (this.enableConsole) {
      const color = LogLevelColors[level];
      console.log(`${color}${logMessage}${ResetColor}`);
    }
    
    // 写入文件
    this.writeToFile(logMessage, level);
  }

  /**
   * DEBUG 级别日志
   */
  debug(message, meta) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * INFO 级别日志
   */
  info(message, meta) {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * WARN 级别日志
   */
  warn(message, meta) {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * ERROR 级别日志
   */
  error(message, meta) {
    this.log(LogLevel.ERROR, message, meta);
  }

  /**
   * 清理旧日志文件
   * @param {number} daysToKeep - 保留天数
   */
  cleanupOldLogs(daysToKeep = 7) {
    if (!this.enableFile) return;

    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        this.info(`清理了 ${deletedCount} 个旧日志文件`);
      }
    } catch (error) {
      this.error('清理日志文件失败', { error: error.message });
    }
  }
}

// 创建默认日志实例
const logger = new Logger({
  level: process.env.LOG_LEVEL || LogLevel.INFO,
  enableConsole: true,
  enableFile: true
});

// 导出日志级别和实例
module.exports = {
  Logger,
  LogLevel,
  logger
};
