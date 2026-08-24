import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Request interceptor to attach JWT Bearer token
client.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("codeaware_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage access issues
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction and token expiry handling
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem("codeaware_token");
        localStorage.removeItem("codeaware_user");
        // Dispatch custom event if app needs to respond to auth logout
        window.dispatchEvent(new Event("codeaware_auth_unauthorized"));
      } catch {}
    }

    let message = "An unexpected server error occurred.";
    if (error.response?.data) {
      if (typeof error.response.data.detail === "string") {
        message = error.response.data.detail;
      } else if (error.response.data.error?.message) {
        message = error.response.data.error.message;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export default client;

