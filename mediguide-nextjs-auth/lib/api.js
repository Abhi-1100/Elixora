// lib/api.js
// Small helper so every fetch call to the Flask backend is consistent.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Backend sends { error: "message" } on failure - surface that message
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
}

export const signup = (payload) =>
  apiRequest("/auth/signup", { method: "POST", body: payload });

export const login = (payload) =>
  apiRequest("/auth/login", { method: "POST", body: payload });

export const getCurrentUser = (token) =>
  apiRequest("/auth/me", { method: "GET", token });
