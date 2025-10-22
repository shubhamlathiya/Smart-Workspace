const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

// Log format
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  return JSON.stringify(logEntry);
};

// Write to log file
const writeToFile = (level, message, meta = {}) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const logEntry = formatLog(level, message, meta) + '\n';
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

// Logger class
class Logger {
  static error(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, meta);
      writeToFile('ERROR', message, meta);
    }
  }

  static warn(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, meta);
      writeToFile('WARN', message, meta);
    }
  }

  static info(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, meta);
      writeToFile('INFO', message, meta);
    }
  }

  static debug(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta);
      writeToFile('DEBUG', message, meta);
    }
  }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  Logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    Logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  Logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });

  next(err);
};

// Database operation logger
const dbLogger = {
  logQuery: (operation, collection, query = {}, duration = 0) => {
    Logger.debug('Database query', {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: `${duration}ms`
    });
  },

  logError: (operation, collection, error) => {
    Logger.error('Database error', {
      operation,
      collection,
      error: error.message
    });
  }
};

// Socket.io event logger
const socketLogger = {
  logConnection: (socketId, userId, userName) => {
    Logger.info('Socket connection', {
      socketId,
      userId,
      userName
    });
  },

  logDisconnection: (socketId, userId, userName) => {
    Logger.info('Socket disconnection', {
      socketId,
      userId,
      userName
    });
  },

  logEvent: (event, socketId, userId, data = {}) => {
    Logger.debug('Socket event', {
      event,
      socketId,
      userId,
      data: JSON.stringify(data)
    });
  }
};

// Performance monitoring
const performanceLogger = {
  logSlowRequest: (req, duration) => {
    if (duration > 1000) { // Log requests slower than 1 second
      Logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user?.id
      });
    }
  },

  logMemoryUsage: () => {
    const usage = process.memoryUsage();
    Logger.info('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  }
};

// Log rotation (simple implementation)
const rotateLogs = () => {
  const files = ['error.log', 'warn.log', 'info.log', 'debug.log'];
  
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Rotate if file is larger than 10MB
      if (fileSizeInMB > 10) {
        const timestamp = new Date().toISOString().split('T')[0];
        const rotatedFile = path.join(logsDir, `${file}.${timestamp}`);
        fs.renameSync(filePath, rotatedFile);
        Logger.info(`Log file rotated: ${file}`);
      }
    }
  });
};

// Schedule log rotation every day
setInterval(rotateLogs, 24 * 60 * 60 * 1000);

module.exports = {
  Logger,
  requestLogger,
  errorLogger,
  dbLogger,
  socketLogger,
  performanceLogger,
  rotateLogs
};
