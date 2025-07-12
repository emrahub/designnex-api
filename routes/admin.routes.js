import express from 'express';
import { dbHelpers } from '../database/init.js';
import { requireAdmin, adminLogin, adminLogout } from '../middleware/admin-auth.js';

const router = express.Router();

// Admin login endpoint
router.post('/login', adminLogin);

// Admin logout endpoint  
router.post('/logout', adminLogout);

// Protected admin routes (require authentication)
router.use(requireAdmin);

// Dashboard data endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Orders overview endpoint
router.get('/orders-overview', async (req, res) => {
  try {
    // This is a simplified version - in production you'd aggregate from all stores
    const orders = await new Promise((resolve, reject) => {
      const { default: db } = require('../database/init.js');
      db.all(
        `SELECT COUNT(*) as total, COALESCE(SUM(total_price), 0) as revenue 
         FROM customer_orders`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0] || {total: 0, revenue: 0});
        }
      );
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Orders overview error:', error);
    res.json({total: 0, revenue: 0});
  }
});

// Designs overview endpoint
router.get('/designs-overview', async (req, res) => {
  try {
    const designs = await new Promise((resolve, reject) => {
      const { default: db } = require('../database/init.js');
      db.get(
        `SELECT COUNT(*) as total FROM customer_designs`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row || {total: 0});
        }
      );
    });
    res.json(designs);
  } catch (error) {
    console.error('❌ Designs overview error:', error);
    res.json({total: 0});
  }
});

// Stores overview endpoint
router.get('/stores-overview', async (req, res) => {
  try {
    const stores = await new Promise((resolve, reject) => {
      const { default: db } = require('../database/init.js');
      db.get(
        `SELECT COUNT(*) as total FROM shopify_stores WHERE status = 'active'`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row || {total: 0});
        }
      );
    });
    res.json(stores);
  } catch (error) {
    console.error('❌ Stores overview error:', error);
    res.json({total: 0});
  }
});

// AI Generation statistics
router.get('/ai-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await dbHelpers.getAIStats(days);
    
    // Process stats for better frontend consumption
    const processedStats = processAIStats(stats);
    
    res.json(processedStats);
  } catch (error) {
    console.error('❌ AI stats error:', error);
    res.status(500).json({ error: 'Failed to load AI statistics' });
  }
});

// System logs endpoint
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const level = req.query.level; // optional filter
    
    let logs;
    if (level) {
      logs = await getLogsByLevel(level, limit);
    } else {
      logs = await dbHelpers.getRecentLogs(limit);
    }
    
    res.json(logs);
  } catch (error) {
    console.error('❌ Logs error:', error);
    res.status(500).json({ error: 'Failed to load system logs' });
  }
});

// Settings management
router.get('/settings', async (req, res) => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('❌ Settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    await dbHelpers.updateSetting(key, value);
    
    // Log settings change
    await dbHelpers.logSystem(
      'info',
      `Setting updated: ${key} = ${value}`,
      '/admin/settings',
      'POST',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('❌ Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Recent AI generations
router.get('/recent-generations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const generations = await getRecentGenerations(limit);
    res.json(generations);
  } catch (error) {
    console.error('❌ Recent generations error:', error);
    res.status(500).json({ error: 'Failed to load recent generations' });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Helper functions
async function getDashboardStats() {
  try {
    const [aiStats, recentLogs, systemHealth] = await Promise.all([
      dbHelpers.getAIStats(1), // Today's stats
      dbHelpers.getRecentLogs(10),
      getSystemHealth()
    ]);

    const todayGenerations = aiStats.reduce((sum, stat) => sum + stat.total_generations, 0);
    const successRate = aiStats.length > 0 
      ? (aiStats.reduce((sum, stat) => sum + stat.successful, 0) / todayGenerations * 100).toFixed(1)
      : 100;

    return {
      summary: {
        todayGenerations,
        successRate: parseFloat(successRate),
        avgResponseTime: aiStats.length > 0 
          ? Math.round(aiStats.reduce((sum, stat) => sum + (stat.avg_response_time || 0), 0) / aiStats.length)
          : 0,
        systemStatus: systemHealth.status
      },
      recentActivity: recentLogs.slice(0, 5),
      quickStats: {
        totalRequests: todayGenerations,
        errorRate: (100 - parseFloat(successRate)).toFixed(1),
        uptime: systemHealth.uptime
      }
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
}

function processAIStats(stats) {
  const dailyStats = {};
  
  stats.forEach(stat => {
    if (!dailyStats[stat.date]) {
      dailyStats[stat.date] = {
        date: stat.date,
        total: 0,
        successful: 0,
        failed: 0,
        models: {}
      };
    }
    
    dailyStats[stat.date].total += stat.total_generations;
    dailyStats[stat.date].successful += stat.successful;
    dailyStats[stat.date].failed += stat.failed;
    dailyStats[stat.date].models[stat.model_used] = stat.total_generations;
  });
  
  return {
    daily: Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date)),
    models: getModelUsageStats(stats)
  };
}

function getModelUsageStats(stats) {
  const models = {};
  stats.forEach(stat => {
    if (!models[stat.model_used]) {
      models[stat.model_used] = 0;
    }
    models[stat.model_used] += stat.total_generations;
  });
  return models;
}

async function getLogsByLevel(level, limit) {
  return new Promise(async (resolve, reject) => {
    try {
      const { default: db } = await import('../database/init.js');
      db.all(
        'SELECT * FROM system_logs WHERE level = ? ORDER BY created_at DESC LIMIT ?',
        [level, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function getAllSettings() {
  return new Promise(async (resolve, reject) => {
    try {
      const { default: db } = await import('../database/init.js');
      db.all(
        'SELECT key, value, description, updated_at FROM admin_settings ORDER BY key',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function getRecentGenerations(limit) {
  return new Promise(async (resolve, reject) => {
    try {
      const { default: db } = await import('../database/init.js');
      db.all(
        `SELECT prompt, model_used, success, response_time, created_at, error_message 
         FROM ai_generations 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function getSystemHealth() {
  const startTime = process.hrtime();
  const memUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
    },
    timestamp: new Date().toISOString()
  };
}

export default router;