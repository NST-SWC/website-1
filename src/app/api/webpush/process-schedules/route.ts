import { NextResponse } from 'next/server';
import { getDb, serverTimestamp } from '../../../../lib/firebase/admin';
import { listAllSubscriptions, sendNotificationToSubscription } from '../../../../lib/server/webpush-server';

// Protected by x-webpush-secret header (same as /send)
export async function POST(req: Request) {
  const secret = req.headers.get('x-webpush-secret') || '';
  if (!process.env.WEBPUSH_SEND_SECRET || secret !== process.env.WEBPUSH_SEND_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();
    // Firestore composite indexes are required for multiple where() clauses
    // To avoid requiring a composite index in development, query by status
    // then filter by sendAt in-memory. This is acceptable for small datasets
    // and avoids forcing a console index creation step.
    let snap;
    try {
      snap = await db.collection('webpush_schedules')
        .where('status', '==', 'pending')
        .where('sendAt', '<=', now)
        .get();
    } catch (err: any) {
      // If Firestore complains about missing composite index, fallback to single-field query
      if (err && err.code === 9 && String(err.message).includes('requires an index')) {
        console.warn('Composite index required for sendAt<=now query; falling back to in-memory filter');
        const allPending = await db.collection('webpush_schedules').where('status', '==', 'pending').get();
        // Build a fake snapshot-like object with docs array for downstream code
        const docs = allPending.docs.filter(d => {
          const data = d.data();
          const sendAt = data.sendAt?.toDate ? data.sendAt.toDate() : new Date(data.sendAt);
          return sendAt <= now;
        });
        snap = { docs } as any;
      } else {
        throw err;
      }
    }

    const results: any[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      try {
        // For now, only support audience: 'subscribed' or 'all'
        const payload = data.payload || {};
        const audience = data.audience || 'subscribed';

        let subs: any[] = [];
        if (audience === 'subscribed' || audience === 'all') {
          subs = await listAllSubscriptions();
        }

        const perScheduleResults: any[] = [];
        const userIds = new Set<string>();
        for (const wrapped of subs) {
          // listAllSubscriptions returns { subscription, userId } or raw subscription
          const subscription = wrapped && wrapped.subscription ? wrapped.subscription : wrapped;
          const endpoint = subscription && subscription.endpoint ? subscription.endpoint : null;
          if (wrapped.userId) {
            userIds.add(wrapped.userId);
          }

          const r = await sendNotificationToSubscription(subscription, payload);

          // Only include endpoint when available to avoid undefined Firestore values
          perScheduleResults.push({ endpoint: endpoint || null, success: r.success });

          if (!r.success) {
            const statusCode = r.error && r.error.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              try {
                if (endpoint) {
                  await db.collection('webpush_subscriptions').doc(encodeURIComponent(endpoint)).delete();
                }
              } catch (e) { /* ignore */ }
            }
          }
        }

        // Clean undefined values (Firestore rejects undefined) by converting them to null
        const cleanedResults = perScheduleResults.map((item: any) => {
          const c: any = { ...item };
          Object.keys(c).forEach((k) => {
            if (c[k] === undefined) c[k] = null;
          });
          return c;
        });

        if (userIds.size > 0) {
          const writes = Array.from(userIds).map((userId) =>
            db.collection('notifications').add({
              userId,
              title: payload.title || 'CODE 4O4',
              body: payload.body || '',
              icon: payload.icon || '/icon-192x192.png',
              url: payload.data?.url || payload.url || '/',
              tag: payload.tag || null,
              source: payload.tag || payload.type || 'webpush-schedule',
              read: false,
              createdAt: serverTimestamp(),
            }),
          );
          await Promise.all(writes);
        }

        await doc.ref.update({ status: 'sent', sentAt: new Date(), results: cleanedResults });
        results.push({ id: doc.id, ok: true, count: cleanedResults.length });
      } catch (err) {
        console.error('Failed processing schedule', doc.id, err);
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error && process.env.NODE_ENV !== 'production' ? err.stack : undefined;
        await doc.ref.update({ status: 'failed', error: message, triedAt: new Date(), errorStack: stack });
        results.push({ id: doc.id, ok: false, error: message, stack });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('process-schedules error', err);
    // In dev return the error message to aid debugging. In production avoid leaking internals.
    const isDev = process.env.NODE_ENV !== 'production';
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error && isDev ? err.stack : undefined;
    return NextResponse.json({ error: 'Failed to process schedules', message, stack }, { status: 500 });
  }
}
