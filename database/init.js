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
          shop_id INTEGER,
          customer_id TEXT,
          session_id TEXT,
          prompt TEXT NOT NULL,
          model_used TEXT,
          response_time INTEGER,
          success BOOLEAN DEFAULT 1,
          error_message TEXT,
          image_size TEXT,
          quality TEXT,
          style TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          FOREIGN KEY (shop_id) REFERENCES shopify_stores (id)
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
      `);

      // Shopify Stores Table
      db.run(`
        CREATE TABLE IF NOT EXISTS shopify_stores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_domain TEXT UNIQUE NOT NULL,
          shop_name TEXT,
          shop_owner_email TEXT,
          access_token TEXT,
          plan_name TEXT DEFAULT 'basic',
          installation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
          settings TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Customer Designs Table (for each store's customers)
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_designs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_id INTEGER NOT NULL,
          customer_id TEXT,
          customer_email TEXT,
          product_id TEXT,
          product_title TEXT,
          design_data TEXT NOT NULL,
          ai_prompt TEXT,
          design_preview_url TEXT,
          status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'saved', 'ordered', 'printed')),
          session_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shop_id) REFERENCES shopify_stores (id)
        )
      `);

      // Customer Orders Table (design orders)
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_id INTEGER NOT NULL,
          shopify_order_id TEXT,
          customer_id TEXT,
          customer_email TEXT,
          design_id INTEGER,
          product_id TEXT,
          product_title TEXT,
          product_variant_id TEXT,
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(10,2),
          total_price DECIMAL(10,2),
          order_status TEXT DEFAULT 'pending' CHECK(order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
          design_data TEXT,
          print_ready_url TEXT,
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          shipped_date DATETIME,
          tracking_number TEXT,
          notes TEXT,
          FOREIGN KEY (shop_id) REFERENCES shopify_stores (id),
          FOREIGN KEY (design_id) REFERENCES customer_designs (id)
        )
      `);

      // Store Analytics Table
      db.run(`
        CREATE TABLE IF NOT EXISTS store_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_id INTEGER NOT NULL,
          date DATE NOT NULL,
          total_designs INTEGER DEFAULT 0,
          total_orders INTEGER DEFAULT 0,
          total_revenue DECIMAL(10,2) DEFAULT 0,
          unique_customers INTEGER DEFAULT 0,
          ai_generations INTEGER DEFAULT 0,
          popular_products TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shop_id) REFERENCES shopify_stores (id),
          UNIQUE(shop_id, date)
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
      const { shopId, customerId, sessionId, prompt, modelUsed, responseTime, success, errorMessage, imageSize, quality, style, ipAddress } = data;
      
      db.run(
        `INSERT INTO ai_generations 
         (shop_id, customer_id, session_id, prompt, model_used, response_time, success, error_message, image_size, quality, style, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shopId, customerId, sessionId, prompt, modelUsed, responseTime, success, errorMessage, imageSize, quality, style, ipAddress],
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
  },

  // === SHOPIFY STORE MANAGEMENT ===

  // Register a new Shopify store
  registerStore: (storeData) => {
    return new Promise((resolve, reject) => {
      const { shopDomain, shopName, shopOwnerEmail, accessToken, planName = 'basic' } = storeData;
      
      db.run(
        `INSERT OR REPLACE INTO shopify_stores 
         (shop_domain, shop_name, shop_owner_email, access_token, plan_name, last_activity) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [shopDomain, shopName, shopOwnerEmail, accessToken, planName],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Get store by domain
  getStoreByDomain: (shopDomain) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM shopify_stores WHERE shop_domain = ?',
        [shopDomain],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Save customer design
  saveCustomerDesign: (designData) => {
    return new Promise((resolve, reject) => {
      const { 
        shopId, customerId, customerEmail, productId, productTitle, 
        designData: design, aiPrompt, designPreviewUrl, status = 'draft', sessionId 
      } = designData;
      
      db.run(
        `INSERT INTO customer_designs 
         (shop_id, customer_id, customer_email, product_id, product_title, design_data, 
          ai_prompt, design_preview_url, status, session_id, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [shopId, customerId, customerEmail, productId, productTitle, JSON.stringify(design), 
         aiPrompt, designPreviewUrl, status, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Create customer order
  createCustomerOrder: (orderData) => {
    return new Promise((resolve, reject) => {
      const {
        shopId, shopifyOrderId, customerId, customerEmail, designId, productId, 
        productTitle, productVariantId, quantity, unitPrice, totalPrice, designData
      } = orderData;
      
      db.run(
        `INSERT INTO customer_orders 
         (shop_id, shopify_order_id, customer_id, customer_email, design_id, product_id, 
          product_title, product_variant_id, quantity, unit_price, total_price, design_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shopId, shopifyOrderId, customerId, customerEmail, designId, productId, 
         productTitle, productVariantId, quantity, unitPrice, totalPrice, JSON.stringify(designData)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Get store dashboard data
  getStoreDashboard: (shopId, days = 7) => {
    return new Promise((resolve, reject) => {
      const queries = [
        // Recent designs
        `SELECT COUNT(*) as total_designs FROM customer_designs 
         WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')`,
        
        // Recent orders
        `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_revenue 
         FROM customer_orders 
         WHERE shop_id = ? AND order_date >= datetime('now', '-${days} days')`,
        
        // Unique customers
        `SELECT COUNT(DISTINCT customer_email) as unique_customers 
         FROM customer_designs 
         WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')`,
        
        // AI generations
        `SELECT COUNT(*) as ai_generations 
         FROM ai_generations 
         WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')`
      ];

      Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
          db.get(query, [shopId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      })).then(results => {
        resolve({
          designs: results[0].total_designs || 0,
          orders: results[1].total_orders || 0,
          revenue: results[1].total_revenue || 0,
          customers: results[2].unique_customers || 0,
          aiGenerations: results[3].ai_generations || 0
        });
      }).catch(reject);
    });
  },

  // Get recent store activities
  getStoreActivity: (shopId, limit = 20) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 'design' as type, id, customer_email, product_title, created_at, status
         FROM customer_designs WHERE shop_id = ?
         UNION ALL
         SELECT 'order' as type, id, customer_email, product_title, order_date as created_at, order_status as status
         FROM customer_orders WHERE shop_id = ?
         ORDER BY created_at DESC LIMIT ?`,
        [shopId, shopId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get store orders with filters
  getStoreOrders: (shopId, filters = {}) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT o.*, d.design_preview_url, d.ai_prompt 
                   FROM customer_orders o 
                   LEFT JOIN customer_designs d ON o.design_id = d.id 
                   WHERE o.shop_id = ?`;
      let params = [shopId];

      if (filters.status) {
        query += ' AND o.order_status = ?';
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        query += ' AND o.order_date >= ?';
        params.push(filters.dateFrom);
      }

      query += ' ORDER BY o.order_date DESC LIMIT ?';
      params.push(filters.limit || 50);

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Update order status
  updateOrderStatus: (orderId, status, trackingNumber = null, notes = null) => {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE customer_orders SET order_status = ?';
      let params = [status];

      if (status === 'shipped' && trackingNumber) {
        query += ', tracking_number = ?, shipped_date = CURRENT_TIMESTAMP';
        params.push(trackingNumber);
      }

      if (notes) {
        query += ', notes = ?';
        params.push(notes);
      }

      query += ' WHERE id = ?';
      params.push(orderId);

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
};

// Insert sample data for testing
const insertSampleData = () => {
  // Insert sample store
  db.run(`
    INSERT OR IGNORE INTO shopify_stores 
    (shop_domain, shop_name, shop_owner_email, access_token, plan_name, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'test-store.myshopify.com',
    'Test Store',
    'owner@teststore.com',
    'sample_token',
    'premium',
    'active'
  ], function(err) {
    if (err) {
      console.error('Sample store insert error:', err);
      return;
    }
    
    const storeId = this.lastID || 1;
    console.log(`✅ Sample store created with ID: ${storeId}`);
    
    // Insert sample customer designs
    const sampleDesigns = [
      {
        customer_email: 'customer1@example.com',
        product_title: 'Custom T-Shirt',
        ai_prompt: 'Blue dragon with fire breathing',
        status: 'saved'
      },
      {
        customer_email: 'customer2@example.com', 
        product_title: 'Custom Hoodie',
        ai_prompt: 'Minimalist mountain landscape',
        status: 'ordered'
      },
      {
        customer_email: 'customer1@example.com',
        product_title: 'Custom T-Shirt',
        ai_prompt: 'Abstract geometric pattern',
        status: 'draft'
      }
    ];
    
    sampleDesigns.forEach((design, index) => {
      db.run(`
        INSERT OR IGNORE INTO customer_designs 
        (shop_id, customer_id, customer_email, product_id, product_title, design_data, ai_prompt, status, session_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        storeId,
        `customer_${index + 1}`,
        design.customer_email,
        `product_${index + 1}`,
        design.product_title,
        JSON.stringify({color: '#FF0000', size: 'M'}),
        design.ai_prompt,
        design.status,
        `session_${index + 1}`
      ]);
    });
    
    // Insert sample orders
    const sampleOrders = [
      {
        customer_email: 'customer1@example.com',
        product_title: 'Custom T-Shirt',
        total_price: 29.99,
        status: 'processing'
      },
      {
        customer_email: 'customer2@example.com',
        product_title: 'Custom Hoodie', 
        total_price: 49.99,
        status: 'shipped'
      }
    ];
    
    sampleOrders.forEach((order, index) => {
      db.run(`
        INSERT OR IGNORE INTO customer_orders 
        (shop_id, shopify_order_id, customer_id, customer_email, design_id, product_id, product_title, quantity, unit_price, total_price, order_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        storeId,
        `order_${Date.now()}_${index}`,
        `customer_${index + 1}`,
        order.customer_email,
        index + 1,
        `product_${index + 1}`,
        order.product_title,
        1,
        order.total_price,
        order.total_price,
        order.status
      ]);
    });
    
    console.log('✅ Sample data inserted successfully');
  });
};

// Initialize database and insert defaults
export const initDB = async () => {
  try {
    await initDatabase();
    insertDefaultSettings();
    insertSampleData();
    console.log('🗄️ Admin database ready');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

export default db;