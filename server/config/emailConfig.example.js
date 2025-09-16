/**
 * Email Configuration Example
 * Copy these environment variables to your .env file or .env.local file
 * 
 * Gmail Configuration:
 * - EMAIL_USER: Your Gmail address
 * - EMAIL_PASS: Your Gmail app password (not your regular password)
 * - NOTIFICATION_EMAIL: Email address to receive stock notifications
 */

// Required Environment Variables:
/*
EMAIL_USER=deepann2004@gmail.com
EMAIL_PASS=fsub rmwi ulnm bnww
NOTIFICATION_EMAIL=deepann2004@gmail.com
*/

// Optional Environment Variables:
/*
STOCK_MONITOR_INTERVAL=60  // Minutes between stock checks (default: 60)
LOW_STOCK_THRESHOLD=10     // Stock level considered "low" (default: 10)
*/

module.exports = {
  // This file is for reference only
  // Actual configuration should be in environment variables
  requiredEnvVars: [
    'EMAIL_USER',
    'EMAIL_PASS', 
    'NOTIFICATION_EMAIL'
  ],
  optionalEnvVars: [
    'STOCK_MONITOR_INTERVAL',
    'LOW_STOCK_THRESHOLD'
  ]
};
