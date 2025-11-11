"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, LogIn, LogOut, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export const LoginModal = ({ open, onClose }: ModalProps) => {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const [formState, setFormState] = useState({ username: "", password: "" });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await login(formState);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
    setSubmitting(false);
    if (result.ok) {
      setFormState({ username: "", password: "" });
      onClose();
      // Show a small transient success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2400);

      // If the login returned the profile, redirect to the dynamic dashboard route.
      // Use `replace` to avoid polluting history with the login step.
      const userId = result.user?.id ?? null;
      if (userId) {
        router.replace(`/dashboard/${userId}`);
      } else {
        router.replace("/dashboard");
      }
    }
  };

  useEffect(() => {
    // Autofocus username input when the modal opens and the user is not signed in.
    if (open && !user) {
      usernameRef.current?.focus();
    }
  }, [open, user]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="glass-panel relative w-full max-w-xl border border-white/10 p-8 text-left"
          >
            <h3 className="text-3xl font-semibold">
              {user ? "You are signed in" : "Club Portal Login"}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              {user
                ? "Access your dashboard, join squads, and keep building."
                : "Use the credentials shared with your cohort leads to unlock the portal."}
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Shield className="h-4 w-4 text-emerald-300" />
                Username + password stored securely in the club vault.
              </div>
            </div>

            {user ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-lg font-semibold text-black">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold">{user.name}</p>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                  <div className="ml-auto text-right text-xs text-emerald-300">
                    <p>{user.points} pts</p>
                    <p>{user.badges} badges</p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Username
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus-within:border-[#00f5c4]">
                    <UserRound className="h-4 w-4 text-white/60" />
                    <input
                      value={formState.username}
                      ref={usernameRef}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
                      }
                      placeholder="admin / mentor / member"
                      className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Password
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus-within:border-[#00f5c4]">
                    <input
                      value={formState.password}
                      type="password"
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" glow disabled={submitting}>
                  {submitting ? (
                    "Authenticating..."
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Login
                    </>
                  )}
                </Button>

                {message && (
                  <p
                    className={`text-sm ${
                      status === "success" ? "text-emerald-300" : "text-red-400"
                    }`}
                  >
                    {message}
                  </p>
                )}
                {/* Small top-right toast for success to improve UX */}
                {showToast && status === "success" && (
                  <div className="fixed right-6 top-6 z-50 rounded-full bg-emerald-900/80 px-4 py-2 text-sm text-emerald-200">
                    {message}
                  </div>
                )}
              </form>
            )}

            {user ? (
              <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Session is stored locally. Use logout when you are done.
              </p>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Password-only preview – replace with your backend when ready.
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button onClick={logout} variant="secondary" className="w-full">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              ) : null}
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
