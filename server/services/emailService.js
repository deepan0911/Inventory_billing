const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send low stock notification
const sendLowStockNotification = async (products) => {
  try {
    const transporter = createTransporter();
    
    const productDetails = products.map(product => {
      const urgencyLevel = product.stock <= 3 ? 'Critical' : product.stock <= 6 ? 'High' : 'Medium';
      const urgencyColor = product.stock <= 3 ? '#dc3545' : product.stock <= 6 ? '#fd7e14' : '#ffc107';
      
      return `
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 12px; border-right: 1px solid #dee2e6; font-weight: 600;">${product.name}</td>
          <td style="padding: 12px; border-right: 1px solid #dee2e6; font-family: monospace; background-color: #f8f9fa;">${product.code}</td>
          <td style="padding: 12px; border-right: 1px solid #dee2e6; text-align: center;">
            <span style="background-color: ${urgencyColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${product.stock}</span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyLevel}</span>
          </td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `🔔 Low Stock Alert - ${products.length} Product${products.length > 1 ? 's' : ''} Require Reordering - Supermarket Billing System`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">Low Stock Alert</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Inventory Management System</p>
          </div>
          
          <!-- Alert Banner -->
          <div style="padding: 20px 24px; background-color: #fef3c7; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: flex-start;">
              <div style="font-size: 20px; margin-right: 12px; color: #d97706; margin-top: 2px;">⚠️</div>
              <div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #92400e;">Inventory Alert</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #78350f;">The following ${products.length} product${products.length > 1 ? 's' : ''} have low stock levels and require attention. Stock levels are below the minimum threshold.</p>
              </div>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div style="padding: 24px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
              <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="font-size: 20px; font-weight: 600; color: #1f2937;">${products.length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Total Products</div>
              </div>
              <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="font-size: 20px; font-weight: 600; color: #dc2626;">${products.filter(p => p.stock <= 3).length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Critical (≤3)</div>
              </div>
              <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="font-size: 20px; font-weight: 600; color: #ea580c;">${products.filter(p => p.stock > 3 && p.stock <= 6).length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">High (4-6)</div>
              </div>
              <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="font-size: 20px; font-weight: 600; color: #d97706;">${products.filter(p => p.stock > 6 && p.stock < 10).length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Medium (7-9)</div>
              </div>
            </div>
          </div>
          
          <!-- Product Details Table -->
          <div style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">Product Details</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <tr>
                    <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Product Name</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Product Code</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Stock</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  ${productDetails}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="font-size: 14px; font-weight: 500; color: #374151;">
              Supermarket Billing System
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
              Inventory Management
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Low stock notification sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending low stock notification:', error);
    throw error;
  }
};

// Send out of stock notification
const sendOutOfStockNotification = async (products) => {
  try {
    const transporter = createTransporter();
    
    const productDetails = products.map(product => {
      const daysSinceStockout = Math.floor((Date.now() - new Date(product.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      const urgencyLevel = daysSinceStockout >= 7 ? 'URGENT' : daysSinceStockout >= 3 ? 'HIGH' : 'MEDIUM';
      const urgencyColor = daysSinceStockout >= 7 ? '#721c24' : daysSinceStockout >= 3 ? '#dc3545' : '#fd7e14';
      
      return `
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 12px; border-right: 1px solid #dee2e6; font-weight: 600;">${product.name}</td>
          <td style="padding: 12px; border-right: 1px solid #dee2e6; font-family: monospace; background-color: #f8f9fa;">${product.code}</td>
          <td style="padding: 12px; border-right: 1px solid #dee2e6; text-align: center;">
            <span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">0</span>
          </td>
          <td style="padding: 12px; border-right: 1px solid #dee2e6; text-align: center; font-size: 12px;">
            ${daysSinceStockout > 0 ? `${daysSinceStockout}d` : 'Today'}
          </td>
          <td style="padding: 12px; text-align: center;">
            <span style="color: ${urgencyColor}; font-weight: bold; font-size: 12px;">${urgencyLevel}</span>
          </td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `🚨 CRITICAL: ${products.length} Product${products.length > 1 ? 's' : ''} Out of Stock - Immediate Action Required - Supermarket Billing System`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #fef2f2; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #991b1b;">Out of Stock Alert</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f1d1d;">Inventory Management System</p>
          </div>
          
          <!-- Alert Banner -->
          <div style="padding: 20px 24px; background-color: #fee2e2; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: flex-start;">
              <div style="font-size: 20px; margin-right: 12px; color: #dc2626; margin-top: 2px;">🚨</div>
              <div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #991b1b;">Inventory Alert</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #7f1d1d;">${products.length} product${products.length > 1 ? 's are' : ' is'} completely out of stock. These items are unavailable for purchase until stock is replenished.</p>
              </div>
            </div>
          </div>
          
          
          <!-- Product Details Table -->
          <div style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">Out of Stock Products</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <tr>
                    <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Product Name</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Product Code</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Stock</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Days Out</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  ${productDetails}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="font-size: 14px; font-weight: 500; color: #374151;">
              Supermarket Billing System
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
              Inventory Management
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Out of stock notification sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending out of stock notification:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: '✅ Email Configuration Test - Supermarket Billing System',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #f0fdf4; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 32px; margin-bottom: 12px;">✅</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #166534;">Email Configuration Test</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #15803d;">System Verification</p>
          </div>
          
          <!-- Success Message -->
          <div style="padding: 24px; text-align: center;">
            <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <div style="font-size: 20px; margin-bottom: 8px; color: #166534;">✓</div>
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #166534;">Configuration Successful</h3>
              <p style="margin: 0; font-size: 14px; color: #15803d; line-height: 1.5;">Email notification system is properly configured and ready to send stock alerts.</p>
            </div>
            
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
                <div>
                  <div style="font-size: 20px; margin-bottom: 8px; color: #374151;">📧</div>
                  <div style="font-size: 14px; font-weight: 600; color: #374151;">SMTP Server</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Connected</div>
                </div>
                <div>
                  <div style="font-size: 20px; margin-bottom: 8px; color: #374151;">🔔</div>
                  <div style="font-size: 14px; font-weight: 600; color: #374151;">Notifications</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Ready</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              Test completed on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="font-size: 14px; font-weight: 500; color: #374151;">
              Supermarket Billing System
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
              Email Notification System
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw error;
  }
};

module.exports = {
  sendLowStockNotification,
  sendOutOfStockNotification,
  testEmailConfiguration
};
