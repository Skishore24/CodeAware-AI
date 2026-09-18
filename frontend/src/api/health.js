import client from "./client";

export const getHealthSummary = () => client.get("/api/health");
export const getDatabaseHealth = () => client.get("/api/health/db");
export const getOllamaHealth = () => client.get("/api/health/ollama");
