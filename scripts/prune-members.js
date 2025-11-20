#!/usr/bin/env node

/**
 * Remove all members not in the approved whitelist and send a removal email.
 * Uses Firebase Admin + SMTP credentials from .env / .env.local.
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing Firebase credentials");
  process.exit(1);
}

const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: formattedPrivateKey,
  }),
  projectId,
});

const db = admin.firestore();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error("❌ Missing SMTP credentials (SMTP_HOST / SMTP_USER / SMTP_PASS)");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const whitelistTokens = [
  "abhijit",
  "anant",
  "aryan",
  "atul",
  "bhavesh",
  "bhibhukesh",
  "dhiraj",
  "geetansh",
  "jaidev",
  "sristi",
  "shristi",
  "lay",
  "luvya",
  "prateek",
  "sahitya",
  "shubham",
  "sagar",
];

const normalize = (value = "") => value.toLowerCase().trim();

const isWhitelisted = (member) => {
  const name = normalize(member.name);
  const username = normalize(member.username);
  const email = normalize(member.email);

  return whitelistTokens.some((token) => {
    if (!token) return false;
    const matchToken = token.toLowerCase();
    return (
      name.includes(matchToken) ||
      username.includes(matchToken) ||
      email.includes(matchToken)
    );
  });
};

const buildEmail = (member) => ({
  from: `"CODE 4O4" <${smtpUser}>`,
  to: member.email,
  subject: "Update from CODE 4O4 Dev Club",
  html: `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { margin:0; padding:0; background:#05070d; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#e9f4ff; }
        .shell { max-width:640px; margin:0 auto; padding:32px 20px 48px; }
        .header { background:linear-gradient(135deg, #0ef7c3, #00c2ff); border-radius:18px; padding:20px 22px; color:#032228; }
        .header h1 { margin:0; font-size:20px; letter-spacing:0.3px; }
        .card { margin-top:-12px; background:#0e1421; border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:24px; box-shadow:0 24px 60px rgba(0,0,0,0.35); }
        .section { margin:0 0 14px; line-height:1.7; color:#cdd7e5; font-size:15px; }
        .title { font-weight:700; color:#f6fbff; font-size:16px; margin:0 0 6px; }
        .note { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px; color:#b7c4d9; font-size:13px; }
        .pill { display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(14,247,195,0.12); color:#7efee2; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; }
        .cta { display:inline-block; margin-top:14px; padding:12px 18px; border-radius:999px; background:linear-gradient(90deg, #0ef7c3, #00c2ff); color:#031421; font-weight:700; font-size:14px; text-decoration:none; }
        .footer { margin-top:28px; color:#7e8aa8; font-size:12px; text-align:center; line-height:1.6; }
        a { color:#7efee2; }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="header">
          <span class="pill">dev club update</span>
          <h1>Account status changed</h1>
        </div>
        <div class="card">
          <p class="title">Hi ${member.name || "there"},</p>
          <p class="section">
            We’re pausing your access to the CODE 4O4 Dev Club for now because we haven’t seen recent activity.
            To keep the squad focused, inactive members are cycled out.
          </p>
          <p class="section">
            Still want in? Show your interest when the next recruitment window opens and we’ll be excited to see you back.
          </p>
          <div class="note">
            If you believe this was an error, reply to this email and we’ll review it quickly.
          </div>
          <a class="cta" href="https://code404.dev">Visit CODE 4O4</a>
        </div>
        <div class="footer">
          CODE 4O4 · Bengaluru<br />
          Building together, one release at a time.
        </div>
      </div>
    </body>
  </html>
  `,
});

async function main() {
  console.log("🔎 Fetching members...");
  const snapshot = await db.collection("members").get();

  if (snapshot.empty) {
    console.log("No members found.");
    return;
  }

  const members = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const toRemove = members.filter((member) => !isWhitelisted(member));

  console.log(`Found ${members.length} members. Removing ${toRemove.length} not in whitelist.\n`);

  for (const member of toRemove) {
    const label = `${member.name || "Unknown"} (${member.email || "no-email"}) [${member.id}]`;
    try {
      if (member.email) {
        const email = buildEmail(member);
        await transporter.sendMail(email);
        console.log(`📧 Sent removal email to ${label}`);
      } else {
        console.log(`⚠️ No email for ${label}; skipping email`);
      }

      await db.collection("members").doc(member.id).delete();
      console.log(`🗑️  Removed member ${label}`);
    } catch (error) {
      console.error(`❌ Failed for ${label}:`, error);
    }
  }

  console.log("\n✅ Cleanup complete.");
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
