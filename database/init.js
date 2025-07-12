import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const dbPath = join(__dirname, 'admin.db');
const db = new sqlite3.Database(dbPath);

// Database schema
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // AI Generations Log Table
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_generations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prompt TEXT NOT NULL,
          model_used TEXT,
          response_time INTEGER,
          success BOOLEAN DEFAULT 1,
          error_message TEXT,
          image_size TEXT,
          quality TEXT,
          style TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT
        )
      `);

      // System Logs Table
      db.run(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
          message TEXT NOT NULL,
          endpoint TEXT,
          method TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Admin Settings Table
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Admin Users Table (simple auth)
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // API Usage Stats Table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          status_code INTEGER,
          response_time INTEGER,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Database initialization error:', err);
          reject(err);
        } else {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Insert default admin settings
const insertDefaultSettings = () => {
  const defaultSettings = [
    {
      key: 'allowed_origins',
      value: JSON.stringify([
        'https://designnex-studio.vercel.app',
        'https://canvas-project-9vrmkghwx-emrahs-projects-cc1a353c.vercel.app',
        'https://admin.shopify.com'
      ]),
      description: 'CORS allowed origins'
    },
    {
      key: 'rate_limit_window',
      value: '900000',
      description: 'Rate limit window in milliseconds (15 minutes)'
    },
    {
      key: 'rate_limit_max',
      value: '100',
      description: 'Maximum requests per window'
    },
    {
      key: 'ai_generation_enabled',
      value: 'true',
      description: 'Enable/disable AI generation'
    }
  ];

  defaultSettings.forEach(setting => {
    db.run(
      'INSERT OR IGNORE INTO admin_settings (key, value, description) VALUES (?, ?, ?)',
      [setting.key, setting.value, setting.description],
      (err) => {
        if (err) {
          console.error(`❌ Error inserting setting ${setting.key}:`, err);
        }
      }
    );
  });
};

// Database helper functions
export const dbHelpers = {
  // Log AI generation
  logAIGeneration: (data) => {
    return new Promise((resolve, reject) => {
      const { prompt, modelUsed, responseTime, success, errorMessage, imageSize, quality, style, ipAddress } = data;
      
      db.run(
        `INSERT INTO ai_generations 
         (prompt, model_used, response_time, success, error_message, image_size, quality, style, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prompt, modelUsed, responseTime, success, errorMessage, imageSize, quality, style, ipAddress],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Log system events
  logSystem: (level, message, endpoint = null, method = null, ipAddress = null, userAgent = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO system_logs (level, message, endpoint, method, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [level, message, endpoint, method, ipAddress, userAgent],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Log API usage
  logAPIUsage: (endpoint, method, statusCode, responseTime, ipAddress) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO api_usage (endpoint, method, status_code, response_time, ip_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [endpoint, method, statusCode, responseTime, ipAddress],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Get AI generation stats
  getAIStats: (days = 7) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as total_generations,
           COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
           COUNT(CASE WHEN success = 0 THEN 1 END) as failed,
           AVG(response_time) as avg_response_time,
           model_used
         FROM ai_generations 
         WHERE created_at >= datetime('now', '-${days} days')
         GROUP BY DATE(created_at), model_used
         ORDER BY date DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get recent logs
  getRecentLogs: (limit = 50) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM system_logs 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get settings
  getSetting: (key) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM admin_settings WHERE key = ?',
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.value : null);
        }
      );
    });
  },

  // Update setting
  updateSetting: (key, value) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE admin_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, key],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
};

// Initialize database and insert defaults
export const initDB = async () => {
  try {
    await initDatabase();
    insertDefaultSettings();
    console.log('🗄️ Admin database ready');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

export default db;