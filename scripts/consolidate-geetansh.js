#!/usr/bin/env node

/**
 * Consolidate Geetansh accounts:
 * - Keep admin account geetansh-1 with primary email.
 * - Delete duplicate student account user-1762843395221.
 * - Mark admin record with club leader designation.
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");

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

const PRIMARY_ID = "geetansh-1";
const PRIMARY_DATA = {
  name: "Geetansh Goyal",
  username: "geetansh",
  email: "goyalgeetansh@gmail.com",
  role: "admin",
  designation: "Club Leader",
};

const DUPLICATE_IDS = ["user-1762843395221"];

async function main() {
  console.log("🔧 Consolidating Geetansh accounts...");

  // Upsert primary
  const primaryRef = db.collection("members").doc(PRIMARY_ID);
  const primarySnap = await primaryRef.get();
  if (!primarySnap.exists) {
    console.log("ℹ️ Primary record missing; creating it.");
    await primaryRef.set({
      ...PRIMARY_DATA,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log("ℹ️ Updating primary record.");
    await primaryRef.update({
      ...PRIMARY_DATA,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Remove duplicates
  for (const id of DUPLICATE_IDS) {
    const dupRef = db.collection("members").doc(id);
    const dupSnap = await dupRef.get();
    if (!dupSnap.exists) {
      console.log(`✅ Duplicate ${id} already removed.`);
      continue;
    }
    await dupRef.delete();
    console.log(`🗑️  Deleted duplicate member ${id}`);
  }

  console.log("✅ Consolidation complete.");
}

main().catch((err) => {
  console.error("❌ Failed to consolidate:", err);
  process.exit(1);
});
