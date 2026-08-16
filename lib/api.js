// lib/api.js
// Small helper so every fetch call to the Flask backend is consistent.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, { method = "GET", body, token, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Backend sends { error: "message" } or { msg: "message" } on failure
      const errorText =
        data.error ||
        data.msg ||
        data.message ||
        (res.status === 401
          ? "Authentication required. Please log in to perform this action."
          : `Server returned error (${res.status}). Please try again.`);
      throw new Error(errorText);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error("Unable to connect to the backend server. Please ensure the Flask API is running on port 5000.");
    }
    throw err;
  }
}

export const signup = (payload) =>
  apiRequest("/auth/signup", { method: "POST", body: payload });

export const login = (payload) =>
  apiRequest("/auth/login", { method: "POST", body: payload });

export const getCurrentUser = (token) =>
  apiRequest("/auth/me", { method: "GET", token });

export const uploadReport = (formData, token) =>
  apiRequest("/reports/upload", { method: "POST", body: formData, token, isFormData: true });

export const getReport = (reportId, token) =>
  apiRequest(`/reports/${reportId}`, { method: "GET", token });

export const listReports = (token) =>
  apiRequest("/reports", { method: "GET", token });
