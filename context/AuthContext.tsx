"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser } from "@/lib/api";

export interface User {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  saveSession: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // On first load, check if a token was saved from a previous session
  useEffect(() => {
    const savedToken = localStorage.getItem("mg_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    getCurrentUser(savedToken)
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired or invalid - clear it
        localStorage.removeItem("mg_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function saveSession(accessToken: string, userData: User) {
    localStorage.setItem("mg_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("mg_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
