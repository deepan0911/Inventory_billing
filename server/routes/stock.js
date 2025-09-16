const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { monitorStockLevels, getStockStatusSummary } = require('../services/stockMonitor');
const { testEmailConfiguration } = require('../services/emailService');

const router = express.Router();

// Get stock status summary
router.get('/status', auth, async (req, res) => {
  try {
    const summary = await getStockStatusSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting stock status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manually trigger stock monitoring (Admin only)
router.post('/monitor', auth, adminAuth, async (req, res) => {
  try {
    const result = await monitorStockLevels();
    res.json({ 
      message: 'Stock monitoring completed successfully',
      result 
    });
  } catch (error) {
    console.error('Error monitoring stock levels:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test email configuration (Admin only)
router.post('/test-email', auth, adminAuth, async (req, res) => {
  try {
    const result = await testEmailConfiguration();
    res.json({ 
      message: 'Test email sent successfully',
      result 
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({ 
      message: 'Failed to send test email', 
      error: error.message 
    });
  }
});

module.exports = router;
