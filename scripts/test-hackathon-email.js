#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');

async function testHackathonEmail() {
    console.log('\n🧪 Testing Hackathon Registration Email\n');
    console.log('📧 SMTP Settings:');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${process.env.SMTP_PORT}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
    console.log('');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Error: SMTP credentials not set in .env.local');
        console.log('\nPlease add these to your .env.local file:');
        console.log('SMTP_HOST=smtp.purelymail.com');
        console.log('SMTP_PORT=465');
        console.log('SMTP_USER=your-email@domain.com');
        console.log('SMTP_PASS=your-password');
        process.exit(1);
    }

    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Test both individual and team registration emails
    const testCases = [
        {
            type: 'individual',
            name: 'Test User',
            email: 'goyalgeetansh@gmail.com',
            memberCount: 1,
        },
        {
            type: 'team',
            name: 'Team Leader',
            email: 'goyalgeetansh@gmail.com',
            teamName: 'Code Warriors',
            memberCount: 3,
        },
    ];

    for (const testCase of testCases) {
        console.log(`\n📤 Sending ${testCase.type} registration test email...\n`);

        const registrationDetails = testCase.type === 'team'
            ? `<strong>Team Name:</strong> ${testCase.teamName}<br><strong>Team Size:</strong> ${testCase.memberCount} members`
            : `<strong>Registration Type:</strong> Individual`;

        try {
            const info = await transporter.sendMail({
                from: `"DevForge Hackathon" <${process.env.SMTP_USER}>`,
                to: testCase.email,
                subject: `🧪 TEST - DevForge Hackathon - ${testCase.type.charAt(0).toUpperCase() + testCase.type.slice(1)} Registration`,
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
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
              }
              .content {
                padding: 30px;
              }
              .info-box {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .info-box strong {
                color: #92400e;
              }
              .details-box {
                background: #f3f4f6;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .details-box p {
                margin: 10px 0;
              }
              .warning-box {
                background: #fee2e2;
                border-left: 4px solid #ef4444;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .warning-box strong {
                color: #991b1b;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                padding: 20px 30px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
              }
              .emoji {
                font-size: 24px;
                margin-bottom: 10px;
              }
              .test-banner {
                background: #3b82f6;
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="test-banner">🧪 THIS IS A TEST EMAIL</div>
              <div class="header">
                <div class="emoji">🎉</div>
                <h1>Registration Received!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${testCase.name}</strong>,</p>
                
                <p>Thank you for registering for <strong>DevForge</strong> - our 12-hour hackathon happening on <strong>December 20, 2025</strong>!</p>
                
                <div class="details-box">
                  <h3 style="margin-top: 0; color: #f97316;">📋 Your Registration Details</h3>
                  <p>${registrationDetails}</p>
                  <p><strong>Registered Email:</strong> ${testCase.email}</p>
                </div>

                <div class="info-box">
                  <p style="margin: 0;"><strong>⚡ Important Information:</strong></p>
                  <p style="margin: 10px 0 0 0;">Only <strong>50 spots</strong> are available for this hackathon. Registrations are being processed on a <strong>selection basis</strong>.</p>
                </div>

                <div class="warning-box">
                  <p style="margin: 0;"><strong>⏳ Next Steps - Please Read Carefully:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li><strong>This is NOT your final confirmation</strong></li>
                    <li>Our team will review all registrations</li>
                    <li>Selected participants will receive a <strong>confirmation email from MLH (Major League Hacking)</strong></li>
                    <li>Please wait for the MLH email before making any travel arrangements</li>
                  </ul>
                </div>

                <p>We'll be reviewing all applications and will notify selected participants soon. Keep an eye on your inbox (and spam folder) for updates!</p>

                <p>If you have any questions, feel free to reach out to our team.</p>

                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>DevForge Hackathon Team</strong><br>
                  Newton School of Technology × S-VYASA
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated confirmation email.</p>
                <p>&copy; ${new Date().getFullYear()} DevForge. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
                text: `
🧪 THIS IS A TEST EMAIL

DevForge Hackathon - Registration Received!

Hi ${testCase.name},

Thank you for registering for DevForge - our 12-hour hackathon happening on December 20, 2025!

Your Registration Details:
${testCase.type === 'team' ? `Team Name: ${testCase.teamName}\nTeam Size: ${testCase.memberCount} members` : `Registration Type: Individual`}
Registered Email: ${testCase.email}

⚡ IMPORTANT INFORMATION:
Only 50 spots are available for this hackathon. Registrations are being processed on a selection basis.

⏳ NEXT STEPS - PLEASE READ CAREFULLY:
- This is NOT your final confirmation
- Our team will review all registrations
- Selected participants will receive a confirmation email from MLH (Major League Hacking)
- Please wait for the MLH email before making any travel arrangements

We'll be reviewing all applications and will notify selected participants soon. Keep an eye on your inbox (and spam folder) for updates!

Best regards,
DevForge Hackathon Team
Newton School of Technology × S-VYASA

---
This is an automated confirmation email.
© ${new Date().getFullYear()} DevForge. All rights reserved.
        `,
            });

            console.log(`✅ Success! ${testCase.type} registration email sent!`);
            console.log(`   Message ID: ${info.messageId}`);
        } catch (error) {
            console.error(`❌ Failed to send ${testCase.type} email:\n`);
            console.error(error);
            console.log('\n💡 Troubleshooting tips:');
            console.log('   1. Verify SMTP credentials are correct in .env.local');
            console.log('   2. Check that your email provider allows SMTP access');
            console.log('   3. Ensure port 465 is not blocked by firewall');
            console.log('   4. Try using port 587 with STARTTLS instead');
            process.exit(1);
        }
    }

    console.log('\n📬 Check goyalgeetansh@gmail.com inbox (and spam folder)');
    console.log('✅ All test emails sent successfully!\n');
}

testHackathonEmail();
