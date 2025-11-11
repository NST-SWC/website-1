import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || "465");
  const secure = port === 465; // true for 465 (SSL), false for 587 (STARTTLS)
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.purelymail.com",
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendCredentialsEmail({
  to,
  name,
  username,
  password,
}: {
  to: string;
  name: string;
  username: string;
  password: string;
}) {
  try {
    console.log(`📧 [Email Service] Starting email send process...`);
    console.log(`   Environment check:`, {
      hasHost: !!process.env.SMTP_HOST,
      hasPort: !!process.env.SMTP_PORT,
      hasUser: !!process.env.SMTP_USER,
      hasPass: !!process.env.SMTP_PASS,
    });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const error = "SMTP credentials not configured. Check environment variables.";
      console.error(`❌ [Email Service] ${error}`);
      return { success: false, error };
    }

    const transporter = createTransporter();
    console.log(`✅ [Email Service] Transporter created`);

    const mailOptions = {
      from: `"CODE 4O4 Dev Club" <${process.env.SMTP_USER}>`,
      to,
      subject: "🎉 Welcome to CODE 4O4 Dev Club - Your Login Credentials",
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
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to CODE 4O4 Dev Club!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>Congratulations! Your membership has been approved. We're excited to have you join our community of developers, builders, and innovators.</p>
            
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://website-drab-ten-27.vercel.app"}" class="button">
                Login to Dashboard →
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> Please keep your credentials secure and don't share them with anyone. We recommend changing your password after your first login.
            </div>
            
            <h3>What's Next?</h3>
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
Welcome to CODE 4O4 Dev Club!

Hi ${name},

Congratulations! Your membership has been approved.

Your Login Credentials:
Username: ${username}
Password: ${password}

Login at: ${process.env.NEXT_PUBLIC_APP_URL || "https://website-drab-ten-27.vercel.app"}

Please keep your credentials secure and change your password after your first login.

Best regards,
CODE 4O4 Dev Club Team
      `,
    };

    console.log(`📤 [Email Service] Attempting to send email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Email Service] Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ [Email Service] Error sending email:", error);
    console.error("   Error code:", error?.code);
    console.error("   Error response:", error?.response);
    console.error("   Error command:", error?.command);
    return { success: false, error: String(error) };
  }
}

export async function sendBulkCredentialsEmails(
  members: Array<{
    email: string;
    name: string;
    username: string;
    password: string;
  }>
) {
  const results = [];
  
  for (const member of members) {
    const result = await sendCredentialsEmail({
      to: member.email,
      name: member.name,
      username: member.username,
      password: member.password,
    });
    results.push({
      email: member.email,
      name: member.name,
      ...result,
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
