const { monitorStockLevels } = require('./stockMonitor');

let stockMonitorInterval;

// Start stock monitoring scheduler
const startStockMonitoring = (intervalMinutes = 60) => {
  if (stockMonitorInterval) {
    console.log('⏰ Stock monitoring scheduler is already running');
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`🕐 Starting stock monitoring scheduler (runs every ${intervalMinutes} minutes)`);
  
  // Run immediately on start
  monitorStockLevels().catch(error => {
    console.error('❌ Error in initial stock monitoring:', error);
  });
  
  // Set up periodic monitoring
  stockMonitorInterval = setInterval(async () => {
    try {
      await monitorStockLevels();
    } catch (error) {
      console.error('❌ Error in scheduled stock monitoring:', error);
    }
  }, intervalMs);
};

// Stop stock monitoring scheduler
const stopStockMonitoring = () => {
  if (stockMonitorInterval) {
    clearInterval(stockMonitorInterval);
    stockMonitorInterval = null;
    console.log('⏹️ Stock monitoring scheduler stopped');
  } else {
    console.log('⏹️ Stock monitoring scheduler is not running');
  }
};

// Get scheduler status
const getSchedulerStatus = () => {
  return {
    isRunning: !!stockMonitorInterval,
    interval: stockMonitorInterval ? '60 minutes' : null
  };
};

module.exports = {
  startStockMonitoring,
  stopStockMonitoring,
  getSchedulerStatus
};
