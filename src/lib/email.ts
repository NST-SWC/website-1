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
      from: `"DevForge" <${process.env.SMTP_USER}>`,
      to,
      subject: "🎉 Welcome to DevForge - Your Login Credentials",
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
            <h1>🎉 Welcome to DevForge!</h1>
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
              <strong>DevForge Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} DevForge. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to DevForge Dev Club!

Hi ${name},

Congratulations! Your membership has been approved.

Your Login Credentials:
Username: ${username}
Password: ${password}

Login at: ${process.env.NEXT_PUBLIC_APP_URL || "https://website-drab-ten-27.vercel.app"}

Please keep your credentials secure and change your password after your first login.

Best regards,
DevForge Team
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

export async function sendHackathonRegistrationEmail({
  to,
  name,
  type,
  teamName,
  memberCount,
}: {
  to: string;
  name: string;
  type: "individual" | "team";
  teamName?: string;
  memberCount: number;
}) {
  try {
    console.log(`📧 [Email Service] Sending hackathon registration confirmation...`);
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

    const registrationDetails = type === "team"
      ? `<strong>Team Name:</strong> ${teamName}<br><strong>Team Size:</strong> ${memberCount} members`
      : `<strong>Registration Type:</strong> Individual`;

    const mailOptions = {
      from: `"DevForge Hackathon" <${process.env.SMTP_USER}>`,
      to,
      subject: "🎉 DevForge Hackathon - Registration Received!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #e5e7eb;
              background-color: #000000;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
            }
            .container {
              background: #0a0a0a;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid rgba(249, 115, 22, 0.2);
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 40px -10px rgba(249, 115, 22, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
              color: white;
              padding: 48px 32px;
              text-align: center;
              position: relative;
              border-bottom: 2px solid rgba(249, 115, 22, 0.3);
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: 
                linear-gradient(to right, rgba(249, 115, 22, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(249, 115, 22, 0.1) 1px, transparent 1px);
              background-size: 4rem 4rem;
              opacity: 0.3;
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 16px;
              display: block;
              animation: bounce 2s infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 800;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header p {
              margin-top: 8px;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 32px;
              background: #0a0a0a;
            }
            .greeting {
              font-size: 18px;
              color: #f3f4f6;
              margin-bottom: 20px;
            }
            .intro-text {
              font-size: 16px;
              color: #9ca3af;
              margin-bottom: 28px;
              line-height: 1.7;
            }
            .spots-banner {
              background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
              border: 3px solid #f97316;
              border-radius: 12px;
              padding: 20px;
              margin: 28px 0;
              text-align: center;
              box-shadow: 0 0 20px rgba(249, 115, 22, 0.2);
            }
            .spots-banner p {
              margin: 0;
              font-size: 17px;
              font-weight: 700;
              color: #fbbf24;
              line-height: 1.5;
            }
            .spots-number {
              font-size: 28px;
              color: #f97316;
              font-weight: 900;
              display: inline-block;
              padding: 0 8px;
              text-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
            }
            .details-box {
              background: linear-gradient(135deg, rgba(31, 41, 55, 0.5) 0%, rgba(17, 24, 39, 0.5) 100%);
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              border: 1px solid rgba(249, 115, 22, 0.3);
              border-left: 4px solid #f97316;
            }
            .details-box h3 {
              margin: 0 0 16px 0;
              color: #f97316;
              font-size: 18px;
              font-weight: 700;
            }
            .details-box p {
              margin: 8px 0;
              color: #d1d5db;
              font-size: 15px;
            }
            .details-box strong {
              color: #f3f4f6;
              font-weight: 600;
            }
            .warning-box {
              background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%);
              border: 3px solid #ef4444;
              border-radius: 12px;
              padding: 24px;
              margin: 28px 0;
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
            }
            .warning-box p {
              margin: 0 0 12px 0;
              color: #fca5a5;
              font-size: 16px;
              font-weight: 700;
            }
            .warning-box ul {
              margin: 12px 0 0 0;
              padding-left: 24px;
              color: #fecaca;
            }
            .warning-box li {
              margin: 8px 0;
              font-size: 15px;
              line-height: 1.6;
            }
            .warning-box strong {
              color: #fca5a5;
              font-weight: 700;
            }
            .info-text {
              font-size: 15px;
              color: #9ca3af;
              margin: 20px 0;
              line-height: 1.7;
            }
            .signature {
              margin-top: 36px;
              padding-top: 24px;
              border-top: 2px solid rgba(249, 115, 22, 0.2);
              color: #9ca3af;
              font-size: 15px;
            }
            .signature strong {
              color: #f3f4f6;
              font-weight: 700;
            }
            .footer {
              background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
              color: #6b7280;
              text-align: center;
              padding: 28px 32px;
              font-size: 13px;
              border-top: 1px solid rgba(249, 115, 22, 0.2);
            }
            .footer p {
              margin: 6px 0;
            }
            @media only screen and (max-width: 600px) {
              .header {
                padding: 32px 20px;
              }
              .header h1 {
                font-size: 26px;
              }
              .content {
                padding: 28px 20px;
              }
              .spots-number {
                font-size: 24px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <div class="header-content">
                  <span class="emoji">🎉</span>
                  <h1>Registration Received!</h1>
                  <p>DevForge Hackathon 2025</p>
                </div>
              </div>
              
              <div class="content">
                <p class="greeting">Hi <strong>${name}</strong>,</p>
                
                <p class="intro-text">Thank you for registering for <strong>DevForge</strong> - our 12-hour hackathon happening on <strong>Saturday, December 20, 2025</strong>! We're excited to have you join us.</p>
                
                <div class="spots-banner">
                  <p>
                    ⚡ Only <span class="spots-number">50 SPOTS</span> Available<br>
                    <span style="font-size: 15px; color: #fbbf24;">Selection-based registration • Register ASAP!</span>
                  </p>
                </div>
                
                <div class="details-box">
                  <h3>📋 Your Registration Details</h3>
                  <p>${registrationDetails}</p>
                  <p><strong>Registered Email:</strong> ${to}</p>
                  <p><strong>Event Date:</strong> Saturday, December 20, 2025</p>
                  <p><strong>Duration:</strong> 12 Hours</p>
                </div>

                <div class="warning-box">
                  <p>⏳ Next Steps - Please Read Carefully:</p>
                  <ul>
                    <li><strong>This is NOT your final confirmation</strong></li>
                    <li>Our team will review all registrations carefully</li>
                    <li>Selected participants will receive a <strong>confirmation email from MLH (Major League Hacking)</strong></li>
                    <li>Please wait for the MLH email before making any travel arrangements</li>
                    <li>Keep an eye on your inbox and spam folder for updates</li>
                  </ul>
                </div>

                <p class="info-text">We'll be reviewing all applications and will notify selected participants soon. If you have any questions, feel free to reach out to our team.</p>

                <div class="signature">
                  <p>Best regards,<br>
                  <strong>DevForge Hackathon Team</strong><br>
                  Newton School of Technology × S-VYASA</p>
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated confirmation email.</p>
                <p>&copy; ${new Date().getFullYear()} DevForge. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
DevForge Hackathon - Registration Received!

Hi ${name},

Thank you for registering for DevForge - our 12-hour hackathon happening on December 20, 2025!

Your Registration Details:
${type === "team" ? `Team Name: ${teamName}\nTeam Size: ${memberCount} members` : `Registration Type: Individual`}
Registered Email: ${to}

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
    };

    console.log(`📤 [Email Service] Attempting to send hackathon confirmation email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Email Service] Hackathon confirmation email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ [Email Service] Error sending hackathon confirmation email:", error);
    console.error("   Error code:", error?.code);
    console.error("   Error response:", error?.response);
    console.error("   Error command:", error?.command);
    return { success: false, error: String(error) };
  }
}

