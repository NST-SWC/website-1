/**
 * Script to schedule all DevForge hackathon notifications
 * Run with: node scripts/schedule-hackathon-notifications.js
 * 
 * Options:
 *   --dry-run: Preview what would be scheduled without actually scheduling
 */

require('dotenv').config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');
const secret = process.env.WEBPUSH_SEND_SECRET;

if (!secret) {
    console.error('❌ WEBPUSH_SEND_SECRET not found in environment variables');
    process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const url = `${baseUrl}/api/hackathon/schedule-notifications${dryRun ? '?dryRun=true' : ''}`;

async function scheduleNotifications() {
    try {
        console.log(dryRun ? '🔍 DRY RUN MODE - Previewing notifications...' : '🔄 Scheduling hackathon notifications...');
        console.log(`📡 Calling: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-webpush-secret': secret,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API error: ${error.error || error.message || 'Unknown error'}`);
        }

        const result = await response.json();

        if (dryRun) {
            console.log('\n📋 PREVIEW - Notifications that would be scheduled:');
            console.log(`Total: ${result.total}`);
            console.log(`Future: ${result.future} (will be scheduled)`);
            console.log(`Past: ${result.past} (will be skipped)\n`);

            result.notifications.forEach((notif, index) => {
                const status = notif.isPast ? '⏭️  SKIP' : '✅ SCHEDULE';
                console.log(`${index + 1}. [${status}] ${notif.type}`);
                console.log(`   📅 ${new Date(notif.sendAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
                console.log(`   📝 ${notif.title}`);
                console.log(`   💬 ${notif.body}`);
                console.log(`   ℹ️  ${notif.description}\n`);
            });

            console.log('\n💡 To actually schedule these notifications, run without --dry-run flag');
        } else {
            console.log('\n✅ Notifications scheduled successfully!');
            console.log(`📊 Scheduled: ${result.scheduled}`);
            console.log(`⏭️  Skipped: ${result.skipped}`);
            console.log(`⏮️  Past: ${result.pastNotifications}\n`);

            if (result.results && result.results.length > 0) {
                console.log('📋 Details:');
                result.results.forEach(item => {
                    if (item.status === 'scheduled') {
                        console.log(`  ✅ ${item.type} - Scheduled for ${new Date(item.sendAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
                    } else if (item.status === 'skipped') {
                        console.log(`  ⏭️  ${item.type} - ${item.reason}`);
                    }
                });
            }

            if (result.pastNotificationsList && result.pastNotificationsList.length > 0) {
                console.log('\n⏮️  Past notifications (not scheduled):');
                result.pastNotificationsList.forEach(item => {
                    console.log(`  ⏮️  ${item.type} - ${item.reason}`);
                });
            }
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

scheduleNotifications();
