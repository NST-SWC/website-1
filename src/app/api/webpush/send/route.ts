import { NextResponse } from 'next/server';
import {
  listAllSubscriptions,
  sendNotificationToSubscription,
  removeSubscriptionByEndpoint,
} from '../../../../lib/server/webpush-server';

function isAdminFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  try {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const userCookie = cookies.find(c => c.startsWith('code404-user='));
    if (!userCookie) return false;
    const raw = userCookie.split('=')[1];
    if (!raw) return false;
    const decoded = decodeURIComponent(raw);
    const user = JSON.parse(decoded);
    return user && user.role === 'admin';
  } catch (err) {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-webpush-secret') || '';
  const cookieHeader = req.headers.get('cookie');
  const isAdmin = isAdminFromCookie(cookieHeader);

  if (!isAdmin && (!process.env.WEBPUSH_SEND_SECRET || secret !== process.env.WEBPUSH_SEND_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const raw = body.payload || { title: 'Test', body: 'This is a test notification' };

    // Normalize/enrich payload so notifications are visually richer by default.
    // Admin can override any of these fields by supplying them in the request payload.
    const payload = {
      title: raw.title || 'CODE 4O4',
      body: raw.body || '',
      icon: raw.icon || '/app-icon-192.png',
      badge: raw.badge || '/app-icon-72.png',
      image: raw.image || undefined,
      // Vibrate pattern (ms) - many Android devices will follow this when allowed in system settings
      vibrate: raw.vibrate || [200, 100, 200],
      // tag helps control whether notifications are replaced (same tag) or stacked (unique tag)
      tag: raw.tag || raw.type || undefined,
      renotify: raw.renotify !== undefined ? raw.renotify : false,
      requireInteraction: raw.requireInteraction || false,
      actions: raw.actions || [],
      data: raw.data || {},
    } as any;

    const subs = await listAllSubscriptions();
    const results: any[] = [];
    for (const wrapped of subs) {
      const sub = wrapped.subscription || wrapped;
      const r = await sendNotificationToSubscription(sub, payload);
      results.push({ endpoint: sub.endpoint, success: r.success });
      if (!r.success) {
        const status = r.error && r.error.statusCode;
        if (status === 410 || status === 404) {
          // remove gone subscription
          try {
            await removeSubscriptionByEndpoint(sub.endpoint);
          } catch (err) {
            console.warn('Failed to remove subscription after 410:', err);
          }
        }
      }
    }
    return NextResponse.json({ results });
  } catch (err) {
    console.error('send POST error', err);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
