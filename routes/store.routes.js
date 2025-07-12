import express from 'express';
import { dbHelpers } from '../database/init.js';

const router = express.Router();

// Store owner authentication middleware
const requireStoreAuth = async (req, res, next) => {
  try {
    const shopDomain = req.headers['x-shop-domain'] || req.query.shop;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }

    // Get store from database
    const store = await dbHelpers.getStoreByDomain(shopDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (store.status !== 'active') {
      return res.status(403).json({ error: 'Store access suspended' });
    }

    req.store = store;
    next();
  } catch (error) {
    console.error('Store auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// === STORE REGISTRATION & SETUP ===

// Register/update store (Shopify app installation)
router.post('/register', async (req, res) => {
  try {
    const { shopDomain, shopName, shopOwnerEmail, accessToken, planName } = req.body;

    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'Shop domain and access token required' });
    }

    const storeId = await dbHelpers.registerStore({
      shopDomain,
      shopName,
      shopOwnerEmail,
      accessToken,
      planName
    });

    // Log store registration
    await dbHelpers.logSystem(
      'info',
      `Store registered: ${shopDomain}`,
      '/api/store/register',
      'POST',
      req.ip,
      req.get('User-Agent')
    );

    res.json({ 
      success: true, 
      storeId,
      message: 'Store registered successfully' 
    });

  } catch (error) {
    console.error('Store registration error:', error);
    res.status(500).json({ error: 'Store registration failed' });
  }
});

// === STORE DASHBOARD ===

// Store dashboard data
router.get('/dashboard', requireStoreAuth, async (req, res) => {
  try {
    const shopId = req.store.id;
    const days = parseInt(req.query.days) || 7;

    const [dashboardData, recentActivity] = await Promise.all([
      dbHelpers.getStoreDashboard(shopId, days),
      dbHelpers.getStoreActivity(shopId, 10)
    ]);

    // Calculate growth rates (simple version)
    const prevDashboardData = await dbHelpers.getStoreDashboard(shopId, days * 2);
    const growth = {
      designs: calculateGrowth(dashboardData.designs, prevDashboardData.designs - dashboardData.designs),
      orders: calculateGrowth(dashboardData.orders, prevDashboardData.orders - dashboardData.orders),
      revenue: calculateGrowth(dashboardData.revenue, prevDashboardData.revenue - dashboardData.revenue),
      customers: calculateGrowth(dashboardData.customers, prevDashboardData.customers - dashboardData.customers)
    };

    res.json({
      store: {
        name: req.store.shop_name,
        domain: req.store.shop_domain,
        plan: req.store.plan_name,
        status: req.store.status
      },
      stats: dashboardData,
      growth,
      recentActivity,
      period: `Last ${days} days`
    });

  } catch (error) {
    console.error('Store dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// === CUSTOMER DESIGNS MANAGEMENT ===

// Save customer design
router.post('/designs', requireStoreAuth, async (req, res) => {
  try {
    const {
      customer_id,
      customer_email,
      product_id,
      product_title,
      design_data,
      ai_prompt,
      design_preview_url,
      status = 'draft',
      session_id
    } = req.body;

    if (!design_data) {
      return res.status(400).json({ error: 'Design data is required' });
    }

    const designId = await dbHelpers.saveCustomerDesign({
      shopId: req.store.id,
      customerId: customer_id,
      customerEmail: customer_email,
      productId: product_id,
      productTitle: product_title,
      designData: design_data,
      aiPrompt: ai_prompt,
      designPreviewUrl: design_preview_url,
      status,
      sessionId: session_id
    });

    // Log design creation
    await dbHelpers.logSystem(
      'info',
      `Customer design created: ${product_title} for ${customer_email}`,
      '/api/store/designs',
      'POST',
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      designId,
      message: 'Design saved successfully'
    });

  } catch (error) {
    console.error('Save design error:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
});

// Get customer designs
router.get('/designs', requireStoreAuth, async (req, res) => {
  try {
    const shopId = req.store.id;
    const { status, limit = 50, customer_email } = req.query;

    let query = 'SELECT * FROM customer_designs WHERE shop_id = ?';
    let params = [shopId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (customer_email) {
      query += ' AND customer_email = ?';
      params.push(customer_email);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const designs = await new Promise((resolve, reject) => {
      const { default: db } = require('../database/init.js');
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Parse design data
    const processedDesigns = designs.map(design => ({
      ...design,
      design_data: JSON.parse(design.design_data || '{}')
    }));

    res.json(processedDesigns);

  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Failed to load designs' });
  }
});

// === ORDER MANAGEMENT ===

// Get store orders
router.get('/orders', requireStoreAuth, async (req, res) => {
  try {
    const shopId = req.store.id;
    const { status, date_from, limit = 50 } = req.query;

    const filters = { status, dateFrom: date_from, limit: parseInt(limit) };
    const orders = await dbHelpers.getStoreOrders(shopId, filters);

    // Process orders data
    const processedOrders = orders.map(order => ({
      ...order,
      design_data: order.design_data ? JSON.parse(order.design_data) : null
    }));

    res.json(processedOrders);

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// Update order status
router.put('/orders/:orderId/status', requireStoreAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, tracking_number, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const changes = await dbHelpers.updateOrderStatus(orderId, status, tracking_number, notes);

    if (changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log order status update
    await dbHelpers.logSystem(
      'info',
      `Order ${orderId} status updated to ${status}`,
      `/api/store/orders/${orderId}/status`,
      'PUT',
      req.ip,
      req.get('User-Agent')
    );

    res.json({ 
      success: true, 
      message: 'Order status updated successfully' 
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// === ANALYTICS ===

// Store analytics
router.get('/analytics', requireStoreAuth, async (req, res) => {
  try {
    const shopId = req.store.id;
    const { period = '7d' } = req.query;

    // Convert period to days
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;

    // Get analytics data
    const [stats, topProducts, customerStats] = await Promise.all([
      dbHelpers.getStoreDashboard(shopId, days),
      getTopProducts(shopId, days),
      getCustomerStats(shopId, days)
    ]);

    // Get daily breakdown
    const dailyStats = await getDailyStats(shopId, days);

    res.json({
      summary: stats,
      dailyBreakdown: dailyStats,
      topProducts,
      customerInsights: customerStats,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// === WEBHOOKS (for Shopify integration) ===

// Handle Shopify order creation
router.post('/webhooks/orders/create', async (req, res) => {
  try {
    const order = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'];

    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }

    const store = await dbHelpers.getStoreByDomain(shopDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Process order if it contains custom designs
    if (order.line_items) {
      for (const item of order.line_items) {
        // Check if line item has custom design data
        if (item.properties && item.properties.some(prop => prop.name === 'custom_design_id')) {
          const designId = item.properties.find(prop => prop.name === 'custom_design_id')?.value;
          
          if (designId) {
            await dbHelpers.createCustomerOrder({
              shopId: store.id,
              shopifyOrderId: order.id.toString(),
              customerId: order.customer?.id?.toString(),
              customerEmail: order.customer?.email,
              designId: parseInt(designId),
              productId: item.product_id.toString(),
              productTitle: item.title,
              productVariantId: item.variant_id.toString(),
              quantity: item.quantity,
              unitPrice: parseFloat(item.price),
              totalPrice: parseFloat(item.price) * item.quantity,
              designData: item.properties.find(prop => prop.name === 'design_data')?.value
            });
          }
        }
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// === HELPER FUNCTIONS ===

function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function getTopProducts(shopId, days) {
  return new Promise((resolve, reject) => {
    const { default: db } = require('../database/init.js');
    db.all(
      `SELECT product_title, COUNT(*) as design_count, COUNT(DISTINCT customer_email) as unique_customers
       FROM customer_designs 
       WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')
       GROUP BY product_title 
       ORDER BY design_count DESC 
       LIMIT 5`,
      [shopId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

async function getCustomerStats(shopId, days) {
  return new Promise((resolve, reject) => {
    const { default: db } = require('../database/init.js');
    db.all(
      `SELECT customer_email, COUNT(*) as design_count, MAX(created_at) as last_activity
       FROM customer_designs 
       WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')
       GROUP BY customer_email 
       ORDER BY design_count DESC 
       LIMIT 10`,
      [shopId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

async function getDailyStats(shopId, days) {
  return new Promise((resolve, reject) => {
    const { default: db } = require('../database/init.js');
    db.all(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as designs,
         COUNT(DISTINCT customer_email) as customers
       FROM customer_designs 
       WHERE shop_id = ? AND created_at >= datetime('now', '-${days} days')
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      [shopId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

export default router;