const Product = require('../models/Product');
const { sendLowStockNotification, sendOutOfStockNotification } = require('./emailService');

// Track last notification times to avoid spam
const lastNotifications = {
  lowStock: new Map(),
  outOfStock: new Map()
};

// Minimum time between notifications for the same product (in milliseconds)
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

// Check if enough time has passed since last notification
const shouldSendNotification = (productId, type) => {
  const lastTime = lastNotifications[type].get(productId);
  if (!lastTime) return true;
  
  const timeSinceLastNotification = Date.now() - lastTime;
  return timeSinceLastNotification >= NOTIFICATION_COOLDOWN;
};

// Update last notification time
const updateLastNotificationTime = (productId, type) => {
  lastNotifications[type].set(productId, Date.now());
};

// Monitor stock levels and send notifications
const monitorStockLevels = async () => {
  try {
    console.log('🔍 Starting stock level monitoring...');
    
    // Get all active products
    const products = await Product.find({ isActive: true });
    
    const lowStockProducts = [];
    const outOfStockProducts = [];
    
    for (const product of products) {
      // Check for out of stock
      if (product.stock === 0) {
        outOfStockProducts.push(product);
        console.log(`🚨 Out of Stock: ${product.name} (Code: ${product.code})`);
      }
      // Check for low stock (less than 10 but not zero)
      else if (product.stock < 10) {
        lowStockProducts.push(product);
        console.log(`⚠️ Low Stock: ${product.name} (Code: ${product.code}) - Stock: ${product.stock}`);
      }
    }
    
    // Send notifications for out of stock products
    if (outOfStockProducts.length > 0) {
      const productsToNotify = outOfStockProducts.filter(product => 
        shouldSendNotification(product._id.toString(), 'outOfStock')
      );
      
      if (productsToNotify.length > 0) {
        console.log(`📧 Sending out of stock notification for ${productsToNotify.length} products...`);
        await sendOutOfStockNotification(productsToNotify);
        
        // Update notification times
        productsToNotify.forEach(product => {
          updateLastNotificationTime(product._id.toString(), 'outOfStock');
        });
      } else {
        console.log(`📧 Out of stock notifications already sent recently for ${outOfStockProducts.length} products`);
      }
    }
    
    // Send notifications for low stock products
    if (lowStockProducts.length > 0) {
      const productsToNotify = lowStockProducts.filter(product => 
        shouldSendNotification(product._id.toString(), 'lowStock')
      );
      
      if (productsToNotify.length > 0) {
        console.log(`📧 Sending low stock notification for ${productsToNotify.length} products...`);
        await sendLowStockNotification(productsToNotify);
        
        // Update notification times
        productsToNotify.forEach(product => {
          updateLastNotificationTime(product._id.toString(), 'lowStock');
        });
      } else {
        console.log(`📧 Low stock notifications already sent recently for ${lowStockProducts.length} products`);
      }
    }
    
    if (outOfStockProducts.length === 0 && lowStockProducts.length === 0) {
      console.log('✅ All products have sufficient stock levels');
    }
    
    return {
      outOfStock: outOfStockProducts.length,
      lowStock: lowStockProducts.length,
      totalProducts: products.length
    };
    
  } catch (error) {
    console.error('❌ Error monitoring stock levels:', error);
    throw error;
  }
};

// Check stock for a specific product (useful after stock updates)
const checkProductStock = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return null;
    }
    
    if (product.stock === 0) {
      if (shouldSendNotification(productId, 'outOfStock')) {
        console.log(`🚨 Product out of stock: ${product.name} (Code: ${product.code})`);
        await sendOutOfStockNotification([product]);
        updateLastNotificationTime(productId, 'outOfStock');
        return { status: 'outOfStock', notified: true };
      }
      return { status: 'outOfStock', notified: false };
    }
    
    if (product.stock < 10) {
      if (shouldSendNotification(productId, 'lowStock')) {
        console.log(`⚠️ Product low stock: ${product.name} (Code: ${product.code}) - Stock: ${product.stock}`);
        await sendLowStockNotification([product]);
        updateLastNotificationTime(productId, 'lowStock');
        return { status: 'lowStock', notified: true };
      }
      return { status: 'lowStock', notified: false };
    }
    
    return { status: 'sufficient', notified: false };
    
  } catch (error) {
    console.error('❌ Error checking product stock:', error);
    throw error;
  }
};

// Get stock status summary
const getStockStatusSummary = async () => {
  try {
    const products = await Product.find({ isActive: true });
    
    const summary = {
      totalProducts: products.length,
      outOfStock: 0,
      lowStock: 0,
      sufficientStock: 0,
      outOfStockProducts: [],
      lowStockProducts: []
    };
    
    products.forEach(product => {
      if (product.stock === 0) {
        summary.outOfStock++;
        summary.outOfStockProducts.push({
          name: product.name,
          code: product.code,
          stock: product.stock
        });
      } else if (product.stock < 10) {
        summary.lowStock++;
        summary.lowStockProducts.push({
          name: product.name,
          code: product.code,
          stock: product.stock
        });
      } else {
        summary.sufficientStock++;
      }
    });
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error getting stock status summary:', error);
    throw error;
  }
};

module.exports = {
  monitorStockLevels,
  checkProductStock,
  getStockStatusSummary
};
