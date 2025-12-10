import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import { calculateNotificationSchedule } from '@/lib/hackathon-notifications';

function isAdminOrSecret(req: Request) {
    const secret = req.headers.get('x-webpush-secret') || '';
    const cookieHeader = req.headers.get('cookie');

    // Check cookie for admin role
    if (cookieHeader) {
        try {
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const userCookie = cookies.find(c => c.startsWith('code404-user='));
            if (userCookie) {
                const raw = userCookie.split('=')[1];
                if (raw) {
                    const user = JSON.parse(decodeURIComponent(raw));
                    if (user && (user.role === 'admin' || user.role === 'mentor')) return true;
                }
            }
        } catch (e) {
            // ignore parse errors
        }
    }

    // Check secret header
    if (process.env.WEBPUSH_SEND_SECRET && secret === process.env.WEBPUSH_SEND_SECRET) return true;
    return false;
}

/**
 * POST: Schedule all hackathon notifications
 * Query params:
 *   - dryRun=true: Preview what would be scheduled without actually scheduling
 */
export async function POST(req: Request) {
    if (!isAdminOrSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const dryRun = url.searchParams.get('dryRun') === 'true';

        const schedule = calculateNotificationSchedule();
        const db = getDb();
        const now = new Date();

        // Filter out notifications that are in the past
        const futureNotifications = schedule.filter(item => item.sendAt > now);
        const pastNotifications = schedule.filter(item => item.sendAt <= now);

        if (dryRun) {
            return NextResponse.json({
                dryRun: true,
                message: 'Preview mode - no notifications scheduled',
                total: schedule.length,
                future: futureNotifications.length,
                past: pastNotifications.length,
                notifications: schedule.map(item => ({
                    type: item.meta.type,
                    description: item.meta.description,
                    sendAt: item.sendAt.toISOString(),
                    title: item.payload.title,
                    body: item.payload.body,
                    isPast: item.sendAt <= now
                }))
            });
        }

        // Actually schedule the notifications
        const results = [];
        const col = db.collection('webpush_schedules');

        for (const item of futureNotifications) {
            // Check if this notification type is already scheduled
            const existing = await col
                .where('meta.type', '==', item.meta.type)
                .where('status', '==', 'pending')
                .get();

            if (!existing.empty) {
                results.push({
                    type: item.meta.type,
                    status: 'skipped',
                    reason: 'Already scheduled',
                    existingId: existing.docs[0].id
                });
                continue;
            }

            const doc = await col.add({
                sendAt: item.sendAt,
                payload: item.payload,
                audience: 'subscribed',
                meta: item.meta,
                status: 'pending',
                createdAt: new Date(),
            });

            results.push({
                type: item.meta.type,
                status: 'scheduled',
                id: doc.id,
                sendAt: item.sendAt.toISOString()
            });
        }

        return NextResponse.json({
            ok: true,
            scheduled: results.filter(r => r.status === 'scheduled').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            pastNotifications: pastNotifications.length,
            results,
            pastNotificationsList: pastNotifications.map(item => ({
                type: item.meta.type,
                sendAt: item.sendAt.toISOString(),
                reason: 'In the past, not scheduled'
            }))
        });
    } catch (err) {
        console.error('schedule-hackathon-notifications error', err);
        return NextResponse.json(
            { error: 'Failed to schedule notifications', message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}

/**
 * GET: List all scheduled hackathon notifications
 */
export async function GET(req: Request) {
    if (!isAdminOrSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getDb();
        const snap = await db.collection('webpush_schedules')
            .where('meta.type', 'in', [
                'day-before-reminder',
                'checkin-reminder',
                'opening-ceremony',
                'coding-begins',
                'lunch-break',
                'mid-evaluation',
                'submission-warning',
                'submission-final',
                'demos-judging',
                'closing-ceremony'
            ])
            .orderBy('sendAt', 'asc')
            .get();

        const items = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ items });
    } catch (err) {
        console.error('GET schedule-hackathon-notifications error', err);
        return NextResponse.json(
            { error: 'Failed to list notifications', message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}

/**
 * DELETE: Clear all scheduled hackathon notifications
 */
export async function DELETE(req: Request) {
    if (!isAdminOrSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getDb();
        const snap = await db.collection('webpush_schedules')
            .where('status', '==', 'pending')
            .get();

        const batch = db.batch();
        snap.docs.forEach(doc => {
            // Only delete hackathon-related notifications
            const data = doc.data();
            if (data.meta?.type && data.meta.type.includes('hackathon') ||
                ['day-before-reminder', 'checkin-reminder', 'opening-ceremony', 'coding-begins',
                    'lunch-break', 'mid-evaluation', 'submission-warning', 'submission-final',
                    'demos-judging', 'closing-ceremony'].includes(data.meta?.type)) {
                batch.delete(doc.ref);
            }
        });

        await batch.commit();

        return NextResponse.json({
            ok: true,
            deleted: snap.size,
            message: 'All pending hackathon notifications cleared'
        });
    } catch (err) {
        console.error('DELETE schedule-hackathon-notifications error', err);
        return NextResponse.json(
            { error: 'Failed to clear notifications', message: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
