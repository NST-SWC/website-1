"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, ChevronRight, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  read: boolean;
  createdAt: string | null;
};

type NotificationBellProps = {
  buttonVariant?: "solid" | "ghost" | "icon";
  className?: string;
  buttonClassName?: string;
};

const STORAGE_KEY = "code404-local-notifications";
const MAX_NOTIFICATIONS = 40;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // fetch at most once every 5 minutes

const formatRelativeTime = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const readFromStorage = (key: string): NotificationItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const persistToStorage = (key: string, items: NotificationItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
};

export default function NotificationBell({
  buttonVariant = "solid",
  className,
  buttonClassName,
}: NotificationBellProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [serverSyncing, setServerSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [marking, setMarking] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const storageKey = useMemo(
    () => (user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY),
    [user?.id],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const reloadFromStorage = useCallback(() => {
    setSyncing(true);
    setTimeout(() => {
      setNotifications(readFromStorage(storageKey));
      setSyncing(false);
    }, 150);
  }, [storageKey]);

  const persistNotifications = useCallback(
    (items: NotificationItem[]) => {
      setNotifications(items);
      persistToStorage(storageKey, items);
    },
    [storageKey],
  );

  const lastServerSyncKey = useMemo(() => `${storageKey}:last-sync`, [storageKey]);

  const syncFromServer = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      if (typeof window === "undefined") return;
      const now = Date.now();
      const lastSync = Number(window.localStorage.getItem(lastServerSyncKey) || 0);
      if (!force && now - lastSync < SYNC_INTERVAL_MS) {
        return;
      }
      setServerSyncing(true);
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}&limit=20`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Unable to sync notifications");
        }
        persistNotifications(data.data || []);
        window.localStorage.setItem(lastServerSyncKey, String(now));
      } catch (err) {
        console.warn("Notification sync failed", err);
      } finally {
        setServerSyncing(false);
      }
    },
    [user?.id, persistNotifications, lastServerSyncKey],
  );

  const addIncomingNotification = useCallback(
    (incoming: Partial<NotificationItem>) => {
      setNotifications((prev) => {
        const nextItem: NotificationItem = {
          id:
            incoming.id ||
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}`),
          title: incoming.title || "Notification",
          body: incoming.body || "",
          url: incoming.url || "/",
          icon: incoming.icon || "/android-chrome-192x192.png",
          createdAt: incoming.createdAt || new Date().toISOString(),
          read: false,
        };
        const next = [nextItem, ...prev].slice(0, MAX_NOTIFICATIONS);
        persistToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotifications(readFromStorage(storageKey));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setNotifications(readFromStorage(storageKey));
      }
    };
    window.addEventListener("storage", handleStorage);

    const swListener = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NOTIFICATION") {
        addIncomingNotification(event.data.notification || {});
      }
    };
    navigator.serviceWorker?.addEventListener("message", swListener as any);

    return () => {
      window.removeEventListener("storage", handleStorage);
      navigator.serviceWorker?.removeEventListener("message", swListener as any);
    };
  }, [storageKey, addIncomingNotification]);

  useEffect(() => {
    if (!user?.id) return;
    syncFromServer(true);
  }, [user?.id, syncFromServer]);

  useEffect(() => {
    if (open && user?.id) {
      syncFromServer();
    }
  }, [open, syncFromServer, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    const handler = () => update();
    if (query.addEventListener) {
      query.addEventListener("change", handler);
    } else {
      query.addListener(handler);
    }
    return () => {
      if (query.removeEventListener) {
        query.removeEventListener("change", handler);
      } else {
        query.removeListener(handler);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const patchServerReadState = useCallback(
    async (payload: { markAllAsRead?: boolean; notificationIds?: string[] }) => {
      if (!user?.id) return true;
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Unable to update notifications");
        }
        window.localStorage.setItem(lastServerSyncKey, String(Date.now()));
        return true;
      } catch (err) {
        console.warn("Failed to update notification read state", err);
        return false;
      }
    },
    [user?.id, lastServerSyncKey],
  );

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarking(true);
    const nextItems = notifications.map((item) => ({ ...item, read: true }));
    persistNotifications(nextItems);
    const success = await patchServerReadState({ markAllAsRead: true });
    if (!success) {
      // reload previous state from storage if server update fails
      setNotifications(readFromStorage(storageKey));
    }
    setMarking(false);
  };

  const markNotificationRead = async (notification: NotificationItem) => {
    if (notification.read) return;
    const next = notifications.map((item) =>
      item.id === notification.id ? { ...item, read: true } : item,
    );
    persistNotifications(next);
    const success = await patchServerReadState({ notificationIds: [notification.id] });
    if (!success) {
      setNotifications(readFromStorage(storageKey));
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markNotificationRead(notification);
    setOpen(false);
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const baseButtonClasses =
    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const variantClasses =
    buttonVariant === "icon"
      ? "h-11 w-11 justify-center rounded-full border border-white/15 bg-white/10 text-white hover:border-orange-400/40"
      : buttonVariant === "ghost"
        ? "border border-white/15 bg-white/5 text-white hover:border-orange-400/40"
        : "bg-gradient-to-r from-orange-400 via-orange-600 to-red-600 text-black shadow-lg shadow-orange-500/30 hover:shadow-orange-400/40";

  const buttonClasses = cn(
    baseButtonClasses,
    variantClasses,
    buttonVariant === "icon" ? "px-0" : "",
    buttonClassName,
  );

  const wrapperClasses = cn("relative", className);

  return (
    <div className={wrapperClasses}>
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
        className={buttonClasses}
      >
        <Bell className="h-4 w-4" />
        {buttonVariant !== "icon" && (
          <span>{unreadCount > 0 ? `${unreadCount} new` : "Notifications"}</span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-5 min-w-[1.25rem] rounded-full bg-white px-1 text-center text-[0.65rem] font-semibold text-black shadow-lg shadow-orange-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notification-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            ref={panelRef}
            className={cn(
              "z-50 w-[360px] rounded-3xl border border-white/15 bg-[#050507]/95 p-4 text-white shadow-2xl shadow-orange-500/10 backdrop-blur-xl",
              isMobile
                ? "fixed left-4 right-4 top-20 w-auto"
                : "absolute right-0 mt-3",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-white/50">
                  Inbox
                </p>
                <p className="text-lg font-semibold text-white">Notifications</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={reloadFromStorage}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
                    aria-label="Reload from device cache"
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => syncFromServer(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
                      aria-label="Sync from server"
                    >
                      {serverSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-semibold">↺</span>
                      )}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0 || marking}
                  className={cn(
                    "flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-orange-400/60 hover:text-white",
                    (unreadCount === 0 || marking) && "opacity-40",
                  )}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all
                </button>
              </div>
            </div>

            {!user && (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                Notifications stay on this device. Log in to sync across sessions.
              </p>
            )}

            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/60">
                  <Inbox className="h-10 w-10 text-white/30" />
                  <p className="mt-3 text-base font-medium text-white">
                    You're all caught up
                  </p>
                  <p className="text-sm text-white/60">
                    New alerts on this device will appear here automatically.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                      notification.read
                        ? "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        : "border-orange-400/40 bg-gradient-to-r from-orange-500/15 to-transparent text-white shadow-lg shadow-orange-500/20 hover:border-orange-300/60",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        notification.read ? "bg-white/30" : "bg-orange-300",
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">
                          {notification.title}
                        </p>
                        <span className="text-xs text-white/50">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">
                        {notification.body}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 transition group-hover:text-white/70" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
