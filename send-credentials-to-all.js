#!/usr/bin/env node

/**
 * Script to send credentials to all existing members
 * Usage: node send-credentials-to-all.js
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// We'll use fetch to call the API endpoint instead of direct Firebase access
const VERCEL_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://website-drab-ten-27.vercel.app';

// Main script

// Create email transporter
function createTransporter() {
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = port === 465;
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.purelymail.com',
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send credentials email
async function sendCredentialsEmail({ to, name, username, password }) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"CODE 4O4 Dev Club" <${process.env.SMTP_USER}>`,
    to,
    subject: '🎉 CODE 4O4 Dev Club - Your Login Credentials',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .credentials-box {
            background: white;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 15px 0;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
          }
          .credential-label {
            font-weight: bold;
            color: #667eea;
            display: block;
            margin-bottom: 5px;
          }
          .credential-value {
            font-size: 18px;
            font-family: 'Courier New', monospace;
            color: #333;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 CODE 4O4 Dev Club</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>Here are your login credentials for the CODE 4O4 Dev Club portal:</p>
          
          <div class="credentials-box">
            <h2 style="margin-top: 0; color: #667eea;">Your Login Credentials</h2>
            
            <div class="credential-item">
              <span class="credential-label">Username:</span>
              <span class="credential-value">${username}</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://website-drab-ten-27.vercel.app'}" class="button">
              Login to Dashboard →
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Note:</strong> Please keep your credentials secure. We recommend changing your password after logging in.
          </div>
          
          <h3>What's Available:</h3>
          <ul>
            <li>Explore active projects and join teams</li>
            <li>RSVP to upcoming events and workshops</li>
            <li>Connect with fellow members</li>
            <li>Start building amazing things!</li>
          </ul>
          
          <p>If you have any questions, feel free to reach out to our admin team.</p>
          
          <p>Happy coding! 🚀</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>CODE 4O4 Dev Club Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} CODE 4O4 Dev Club. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
CODE 4O4 Dev Club - Your Login Credentials

Hi ${name},

Here are your login credentials for the CODE 4O4 Dev Club portal:

Username: ${username}
Password: ${password}

Login at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://website-drab-ten-27.vercel.app'}

⚠️ Security Note: Please keep your credentials secure. We recommend changing your password after logging in.

Best regards,
CODE 4O4 Dev Club Team
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info.messageId;
}

// Main script
async function sendCredentialsToAll() {
  console.log('\n🚀 Starting credential email send to all existing members...\n');
  
  // Check environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Error: SMTP credentials not configured in .env.local');
    console.log('\nRequired variables:');
    console.log('  SMTP_HOST=smtp.purelymail.com');
    console.log('  SMTP_PORT=465');
    console.log('  SMTP_USER=your-email@domain.com');
    console.log('  SMTP_PASS=your-password');
    process.exit(1);
  }
  
  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log('');
  
  try {
    // Call the API endpoint to send existing credentials (without regenerating)
    console.log('🔄 Calling send existing credentials API...');
    console.log(`   URL: ${VERCEL_URL}/api/admin/send-existing-credentials`);
    console.log('');
    
    const response = await fetch(`${VERCEL_URL}/api/admin/send-existing-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'code404-user=' + encodeURIComponent(JSON.stringify({
          id: 'admin',
          role: 'admin',
          name: 'Admin',
        })),
      },
      body: JSON.stringify({ sendToAll: true }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Success!');
      console.log(`   Total updated: ${result.data.totalUpdated}`);
      console.log(`   Emails sent: ${result.data.emailsSent}`);
      console.log(`   Emails failed: ${result.data.emailsFailed}`);
      console.log('');
      
      if (result.data.members && result.data.members.length > 0) {
        console.log('📋 Members list:');
        result.data.members.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.name} (${m.email})`);
          console.log(`      Username: ${m.username}`);
          console.log(`      Password: ${m.password}`);
        });
      }
    } else {
      console.error('❌ API Error:', result.message);
      console.error('   Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('   Make sure your local dev server is running: npm run dev');
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
sendCredentialsToAll();
