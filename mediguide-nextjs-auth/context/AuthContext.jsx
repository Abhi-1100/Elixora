"use client";
// context/AuthContext.jsx
// Wrap your app with this in app/layout.jsx so every page can access
// the logged-in user and token via useAuth().

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  function saveSession(accessToken, userData) {
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
