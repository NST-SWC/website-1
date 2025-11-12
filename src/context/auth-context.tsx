"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ActionResult, ClubUser } from "@/types";

type AuthContextValue = {
  user: ClubUser | null;
  login: (credentials: LoginCredentials) => Promise<ActionResult>;
  logout: () => void;
  updateUser: (updates: Partial<ClubUser>) => void;
  isAuthenticated: boolean;
};

type LoginCredentials = {
  username: string;
  password: string;
};

const STORAGE_KEY = "code404-devclub-user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ClubUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      return cached ? (JSON.parse(cached) as ClubUser) : null;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // We intentionally hydrate client-only state after mount to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const login = useCallback(async ({
    username,
    password,
  }: LoginCredentials): Promise<ActionResult> => {
    try {
      // Authenticate via Firebase
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim().toLowerCase(), 
          password 
        }),
      });

      const result = await response.json();

      if (result.ok && result.user) {
        setUser(result.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
          // Set cookie for middleware authentication check
          // Use Secure flag in production (HTTPS)
          const isSecure = window.location.protocol === 'https:';
          const cookieOptions = [
            `code404-user=${encodeURIComponent(JSON.stringify(result.user))}`,
            'path=/',
            'max-age=2592000',
            'SameSite=Lax',
          ];
          if (isSecure) {
            cookieOptions.push('Secure');
          }
          document.cookie = cookieOptions.join('; ');
        }
        return {
          ok: true,
          message: result.message,
          user: result.user,
        };
      }

      // Return error from API
      return { 
        ok: false, 
        message: result.message || "Login failed. Please check your credentials." 
      };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, message: "Network error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      // Remove cookie
      document.cookie = "code404-user=; path=/; max-age=0";
      // Redirect to home page
      window.location.href = "/";
    }
  }, []);

  const updateUser = useCallback((updates: Partial<ClubUser>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      
      // Update localStorage and cookie
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        // Use Secure flag in production (HTTPS)
        const isSecure = window.location.protocol === 'https:';
        const cookieOptions = [
          `code404-user=${encodeURIComponent(JSON.stringify(updatedUser))}`,
          'path=/',
          'max-age=2592000',
          'SameSite=Lax',
        ];
        if (isSecure) {
          cookieOptions.push('Secure');
        }
        document.cookie = cookieOptions.join('; ');
      }
      
      return updatedUser;
    });
  }, []);

  const sessionUser = hydrated ? user : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionUser,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(sessionUser),
    }),
    [login, logout, updateUser, sessionUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
};
