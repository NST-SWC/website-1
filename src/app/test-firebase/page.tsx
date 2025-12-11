"use client";

import { useState } from "react";
import { getFirebaseApp } from "@/lib/firebase/client";
import { getStorage } from "firebase/storage";
import WebPushSubscribeButton from '@/components/webpush/subscribe-button';

export default function FirebaseTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebase = () => {
    setLogs([]);
    addLog("🔍 Testing Firebase configuration...");
    
    try {
      const app = getFirebaseApp();
      if (!app) {
        addLog("❌ Firebase app is null");
        addLog("⚠️  Check: NEXT_PUBLIC_FIREBASE_API_KEY and other env variables");
        addLog("💡 Solution: Restart dev server with 'npm run dev'");
        return;
      }
      addLog("✅ Firebase app initialized");
      addLog(`   App name: ${app.name}`);
      addLog(`   Project ID: ${app.options.projectId}`);
      
      try {
        const storage = getStorage(app);
        if (!storage) {
          addLog("❌ Firebase Storage is null");
          addLog("⚠️  This should not happen if app is initialized");
          return;
        }
        addLog("✅ Firebase Storage initialized");
        addLog(`   Storage bucket: ${storage.app.options.storageBucket || 'NOT SET'}`);
        
        if (!storage.app.options.storageBucket) {
          addLog("❌ Storage bucket is not configured!");
          addLog("💡 Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to .env.local");
          addLog("   Format: projectname.appspot.com");
        } else {
          addLog("✅ All Firebase Storage checks passed!");
          addLog("📝 Next: Go to Firebase Console → Storage");
          addLog("   1. Enable Firebase Storage if not already enabled");
          addLog("   2. Configure Storage Rules (see AVATAR_UPLOAD_GUIDE.md)");
        }
      } catch (storageError) {
        addLog(`❌ Storage Error: ${storageError instanceof Error ? storageError.message : String(storageError)}`);
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-3xl font-bold">Firebase Storage Test</h1>
        
        <button
          onClick={testFirebase}
          className="mb-6 rounded-lg bg-orange-600 px-6 py-3 font-medium text-black hover:bg-orange-500"
        >
          Test Firebase Connection
        </button>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-semibold">Test Results:</h2>
          {logs.length === 0 ? (
            <p className="text-white/60">Click the button above to run the test</p>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-white/80">{log}</div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-semibold">Web Push (dev-only)</h2>
          <p className="mb-4 text-sm text-white/70">Use the controls below to register, subscribe and send a test Web Push notification. Requires VAPID env vars and `WEBPUSH_SEND_SECRET` for sending.</p>
          <WebPushSubscribeButton />

          <div className="mt-4">
            <h3 className="mb-2 text-lg font-medium">Custom payload (JSON)</h3>
            <textarea id="webpush-payload" defaultValue={JSON.stringify({ title: 'Hello', body: 'Custom test' }, null, 2)} className="w-full rounded p-2 bg-slate-900 font-mono text-sm h-32" />
            <div className="flex gap-3 mt-2">
              <button onClick={async () => {
                const ta = document.getElementById('webpush-payload') as HTMLTextAreaElement | null;
                if (!ta) return;
                let payload;
                try { payload = JSON.parse(ta.value); } catch (err) { alert('Invalid JSON'); return; }
                const secret = prompt('Enter WEBPUSH_SEND_SECRET to send:');
                if (!secret) return;
                try {
                  const res = await fetch('/api/webpush/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-webpush-secret': secret },
                    body: JSON.stringify({ payload }),
                  });
                  const json = await res.json();
                  console.log('send result', json);
                  alert('Send requested — check console for results');
                } catch (err) {
                  console.error(err);
                  alert('Send failed');
                }
              }} className="rounded bg-violet-600 px-4 py-2 text-white">Send custom</button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-semibold">Environment Check:</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-white/60">API Key: </span>
              <span className={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "text-orange-500" : "text-red-400"}>
                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Not set"}
              </span>
            </div>
            <div>
              <span className="text-white/60">Project ID: </span>
              <span className={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "text-orange-500" : "text-red-400"}>
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Not set"}
              </span>
            </div>
            <div>
              <span className="text-white/60">Storage Bucket: </span>
              <span className={process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "text-orange-500" : "text-red-400"}>
                {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? `✅ ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}` : "❌ Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <h3 className="mb-2 font-semibold text-yellow-400">⚠️ Important Notes:</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-white/80">
            <li>Make sure Firebase Storage is enabled in your Firebase Console</li>
            <li>Storage rules must be configured (see AVATAR_UPLOAD_GUIDE.md)</li>
            <li>After changing .env.local, restart the dev server</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
