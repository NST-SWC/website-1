"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export function NotificationDebugPanel() {
  const [show, setShow] = useState(false);
  const [checks, setChecks] = useState({
    browserSupport: false,
    permission: "",
    serviceWorker: false,
    fcmSupport: false,
  });

  useEffect(() => {
    const runChecks = () => {
      const results = {
        browserSupport: "Notification" in window,
        permission: "Notification" in window ? Notification.permission : "unsupported",
        serviceWorker: "serviceWorker" in navigator,
        fcmSupport: "PushManager" in window,
      };
      setChecks(results);
    };

    runChecks();
  }, []);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed top-4 right-4 z-[60] bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg transition-all"
      >
        Debug Notifications
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[60] bg-gray-900 border border-red-500/50 rounded-lg p-4 w-80 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">Notification Debug</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {checks.browserSupport ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-gray-300">Browser Support</span>
        </div>

        <div className="flex items-center gap-2">
          {checks.permission === "granted" ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : checks.permission === "denied" ? (
            <XCircle className="w-4 h-4 text-red-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-gray-300">
            Permission: {checks.permission}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {checks.serviceWorker ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-gray-300">Service Worker Support</span>
        </div>

        <div className="flex items-center gap-2">
          {checks.fcmSupport ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-gray-300">Push Messaging Support</span>
        </div>
      </div>

      {checks.permission === "denied" && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
          <strong>⚠️ Notifications Blocked!</strong>
          <br />
          To enable:
          <br />
          1. Click lock icon in address bar
          <br />
          2. Find "Notifications"
          <br />
          3. Change to "Allow"
        </div>
      )}

      {!checks.browserSupport && (
        <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
          <strong>⚠️ Not Supported!</strong>
          <br />
          Your browser doesn't support notifications. Try Chrome, Firefox, or Edge.
        </div>
      )}

      {checks.browserSupport && checks.permission === "default" && (
        <div className="mt-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">
          <strong>💡 Permission Needed</strong>
          <br />
          Click the button below to enable notifications.
          <button
            onClick={async () => {
              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                new Notification("🎉 Notifications Enabled!", {
                  body: "You'll now receive updates from CODE 404 Dev Club",
                  icon: "/icon-192x192.png",
                });
                // Refresh checks
                window.location.reload();
              }
            }}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded font-medium transition-colors"
          >
            Enable Notifications Now
          </button>
        </div>
      )}
    </div>
  );
}
