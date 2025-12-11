"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function AdminWebpushPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('/app-icon-192.png');
  const [sending, setSending] = useState(false);

  if (!user || user.role !== 'admin') {
    return <div className="p-6">You must be an admin to access this page.</div>;
  }

  const sendNow = async () => {
    setSending(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      // If user is not an admin (shouldn't happen on this page), require secret
      if (!user || user.role !== 'admin') {
        const secret = prompt('Enter WEBPUSH_SEND_SECRET to send:');
        if (!secret) {
          setSending(false);
          return;
        }
        headers['x-webpush-secret'] = secret;
      }

      const res = await fetch('/api/webpush/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ payload: { title, body, data: { url }, icon } }),
      });
      const json = await res.json();
      console.log('send result', json);
      alert('Send request submitted — check console for results');
    } catch (err) {
      console.error(err);
      alert('Send failed');
    } finally {
      setSending(false);
    }
  };

  // Scheduling feature removed — only immediate send is supported now.

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Admin — Web Push</h1>
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded p-2 bg-slate-900" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" className="w-full rounded p-2 bg-slate-900" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Click URL (optional)" className="w-full rounded p-2 bg-slate-900" />
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon path" className="w-full rounded p-2 bg-slate-900" />

        <div className="flex gap-3">
          <button onClick={sendNow} disabled={sending} className="rounded bg-orange-600 px-4 py-2">Send Now</button>
        </div>
      </div>
    </div>
  );
}
