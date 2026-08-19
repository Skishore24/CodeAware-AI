import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Response interceptor for consistent error extraction
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
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
