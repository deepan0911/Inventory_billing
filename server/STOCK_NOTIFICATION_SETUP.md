# Stock Notification System Setup

This system automatically monitors product stock levels and sends email notifications when products are low on stock or out of stock.

## Features

- **Low Stock Alerts**: Sends email when product stock drops below 10 units
- **Out of Stock Alerts**: Sends email when product stock reaches 0
- **Automatic Monitoring**: Checks stock levels every 60 minutes
- **Real-time Monitoring**: Checks stock immediately after each sale
- **Email Cooldown**: Prevents spam by limiting notifications to once per 24 hours per product

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install nodemailer
```

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file (in the project root):

```env
# Gmail Configuration
EMAIL_USER=deepann2004@gmail.com
EMAIL_PASS=fsub rmwi ulnm bnww
NOTIFICATION_EMAIL=deepann2004@gmail.com

# Optional Configuration
STOCK_MONITOR_INTERVAL=60  # Minutes between stock checks (default: 60)
LOW_STOCK_THRESHOLD=10     # Stock level considered "low" (default: 10)
```

### 3. Gmail App Password Setup

If you haven't already set up an app password for Gmail:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Enable 2-Step Verification if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail" on "Windows Computer"
5. Use this password in the `EMAIL_PASS` environment variable

## How It Works

### Automatic Monitoring

The system monitors stock levels in two ways:

1. **Scheduled Monitoring**: Every 60 minutes, the system checks all products and sends notifications for low/out of stock items
2. **Real-time Monitoring**: After each bill is created, the system checks the updated stock levels for the sold products

### Notification Triggers

- **Low Stock**: Stock < 10 units (but > 0)
- **Out of Stock**: Stock = 0 units

### Email Notifications

The system sends beautifully formatted HTML emails with:

- Clear subject lines with appropriate emojis (🔔 for low stock, 🚨 for out of stock)
- Product details including name, code, and current stock level
- Timestamp of the notification
- Professional styling with color-coded alerts

## API Endpoints

### Stock Status
```
GET /api/stock/status
```
Get current stock status summary including counts of out of stock, low stock, and sufficient stock products.

### Manual Stock Monitoring
```
POST /api/stock/monitor
```
Manually trigger stock monitoring (Admin only).

### Test Email Configuration
```
POST /api/stock/test-email
```
Send a test email to verify email configuration (Admin only).

## Email Templates

### Low Stock Email
- Subject: 🔔 Low Stock Alert - Supermarket Billing System
- Color: Orange warning theme
- Lists all products with stock < 10

### Out of Stock Email
- Subject: 🚨 Out of Stock Alert - Supermarket Billing System
- Color: Red alert theme
- Lists all products with stock = 0
- Includes urgent action required notice

### Test Email
- Subject: ✅ Email Configuration Test - Supermarket Billing System
- Color: Green success theme
- Confirms email configuration is working

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**: Ensure `EMAIL_USER`, `EMAIL_PASS`, and `NOTIFICATION_EMAIL` are correctly set
2. **Gmail App Password**: Make sure you're using an app password, not your regular Gmail password
3. **Gmail Security Settings**: Ensure "Less secure app access" is enabled or use app password
4. **Check Server Logs**: Look for error messages in the server console

### No Notifications Received

1. **Check Stock Levels**: Ensure products actually have low stock (< 10) or are out of stock (0)
2. **Notification Cooldown**: The system only sends one notification per product every 24 hours
3. **Active Products**: Only active products (`isActive: true`) are monitored

### Server Errors

1. **Check Dependencies**: Ensure `nodemailer` is installed
2. **Database Connection**: Verify MongoDB is running and accessible
3. **File Permissions**: Ensure all service files have correct permissions

## Customization

### Change Stock Threshold

Modify the `LOW_STOCK_THRESHOLD` environment variable to change when low stock notifications are sent.

### Change Monitoring Interval

Modify the `STOCK_MONITOR_INTERVAL` environment variable to change how often stock is checked (in minutes).

### Customize Email Templates

Edit the HTML templates in `server/services/emailService.js` to customize email appearance and content.

## Security Notes

- **Environment Variables**: Never commit `.env` files to version control
- **App Passwords**: Use Gmail app passwords instead of regular passwords
- **Email Access**: Only send notifications to authorized email addresses
- **Admin Access**: Stock monitoring endpoints require admin authentication

## Support

If you encounter any issues with the stock notification system:

1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Test email configuration using the `/api/stock/test-email` endpoint
4. Ensure all dependencies are properly installed
