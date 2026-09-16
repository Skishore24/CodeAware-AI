import client from "./client";

export const getOllamaStatus = () => client.get("/ollama/status");

export const getOllamaModels = () => client.get("/ollama/models");

export const updateOllamaConfig = (baseUrl, model) =>
  client.post("/ollama/config", { base_url: baseUrl, model });

export const testOllamaGenerate = (prompt, model = null) =>
  client.post("/ollama/generate", { prompt, model });
