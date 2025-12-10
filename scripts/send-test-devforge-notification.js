/**
 * Script to send a test DevForge notification immediately
 * Run with: node scripts/send-test-devforge-notification.js
 */

require('dotenv').config({ path: '.env.local' });

const secret = process.env.WEBPUSH_SEND_SECRET;

if (!secret) {
    console.error('❌ WEBPUSH_SEND_SECRET not found in environment variables');
    process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const url = `${baseUrl}/api/webpush/send`;

const testPayload = {
    title: "DevForge Hackathon Alert! 🚀",
    body: "This is a test notification for DevForge - 12 Hour Hackathon on Dec 20, 2025. Get ready to build something amazing!",
    icon: "/app-icon-192.png",
    badge: "/app-icon-72.png",
    tag: "devforge-test",
    vibrate: [200, 100, 200, 100, 200],
    data: {
        url: "/hackathon",
        type: "test"
    }
};

async function sendTestNotification() {
    try {
        console.log('🔔 Sending test DevForge notification...');
        console.log(`📡 Calling: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-webpush-secret': secret,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload: testPayload })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API error: ${error.error || error.message || 'Unknown error'}`);
        }

        const result = await response.json();

        console.log('\n✅ Test notification sent!');
        console.log(`📊 Results:`);

        if (result.results && result.results.length > 0) {
            const successful = result.results.filter(r => r.success).length;
            const failed = result.results.filter(r => !r.success).length;

            console.log(`  ✅ Successful: ${successful}`);
            console.log(`  ❌ Failed: ${failed}`);

            if (successful === 0) {
                console.log('\n⚠️  No subscriptions found. Make sure users have subscribed to push notifications.');
            }
        } else {
            console.log('  No results returned');
        }

        console.log('\n💡 Check your browser/device for the notification!');
        console.log('📱 Notification details:');
        console.log(`   Title: ${testPayload.title}`);
        console.log(`   Body: ${testPayload.body}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

sendTestNotification();
