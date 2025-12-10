/**
 * Script to add DevForge hackathon to events collection
 * Run with: node scripts/add-devforge-event.js
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables with proper private key handling
if (!admin.apps.length) {
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not found');
        }

        const parsed = JSON.parse(serviceAccountJson);

        // CRITICAL: Properly handle private key newlines
        let privateKey = parsed.private_key;
        if (typeof privateKey === 'string') {
            // Replace literal \n strings with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const serviceAccount = {
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: privateKey,
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

// DevForge Hackathon Event
const devforgeEvent = {
    title: "DevForge - 12 Hour Hackathon",
    date: "2025-12-20", // December 20, 2025
    time: "7:00 AM - 7:00 PM IST",
    type: "Hackathon",
    summary: "12 hours of intense creation. Build innovative projects, compete for prizes, and win a mystery Gemini swag kit! Limited to 20 selected participants.",
    location: "NST Campus",
    attendees: 0, // Will be updated as registrations come in
    capacity: 20,
    status: "open",
    // Additional hackathon-specific fields
    registrationUrl: "https://hackathon.code4o4.xyz/register",
    detailsUrl: "https://hackathon.code4o4.xyz",
    prizes: "Mystery Gemini swag kit and exclusive stickers for winners",
    tracks: ["AI/ML", "Web3", "Social Good", "Best Beginner Hack"],
    schedule: [
        { time: "07:00 AM", title: "Check-In", description: "Get your team no." },
        { time: "08:00 AM", title: "Opening Ceremony", description: "Event kickoff and rules." },
        { time: "09:00 AM", title: "Coding Begins", description: "Start your engines." },
        { time: "01:00 PM", title: "Lunch Break", description: "Refuel and network." },
        { time: "02:00 PM", title: "Mid-Evaluation & Mentorship", description: "Check-in with mentors." },
        { time: "06:00 PM", title: "Final Submission", description: "Upload to Devpost." },
        { time: "06:30 PM", title: "Demos & Judging", description: "Present your solution." },
        { time: "07:00 PM", title: "Closing Ceremony & Prize Distribution", description: "Winners announced." }
    ]
};

async function addDevForgeEvent() {
    try {
        console.log('🔄 Adding DevForge hackathon event...');

        // Check if event already exists
        const existingEvents = await db.collection('events')
            .where('title', '==', devforgeEvent.title)
            .where('date', '==', devforgeEvent.date)
            .get();

        if (!existingEvents.empty) {
            console.log('⚠️  DevForge event already exists. Updating instead...');
            const docId = existingEvents.docs[0].id;
            await db.collection('events').doc(docId).update({
                ...devforgeEvent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ Updated DevForge event (ID: ${docId})`);
        } else {
            const docRef = await db.collection('events').add({
                ...devforgeEvent,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ Added DevForge event (ID: ${docRef.id})`);
        }

        console.log('✅ DevForge hackathon added to events successfully!');
        console.log('📅 Event Date: December 20, 2025');
        console.log('⏰ Time: 7:00 AM - 7:00 PM IST');
        console.log('👥 Capacity: 20 participants');
        console.log('🔗 Registration: https://hackathon.code4o4.xyz/register');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding DevForge event:', error);
        process.exit(1);
    }
}

addDevForgeEvent();
