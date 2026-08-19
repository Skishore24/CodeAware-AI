import client from "./client";

export const listRepositories = () => client.get("/repositories/list");

export const cloneRepository = (url) =>
  client.post("/repositories/clone", { repository_url: url });

export const cloneAndIngest = (url) =>
  client.post("/repositories/clone-and-ingest", { url });

export const scanRepository = (repositoryPath) =>
  client.post("/repositories/scan", { repository_path: repositoryPath });

export const analyzeCode = (repositoryPath) =>
  client.post("/repositories/code-analysis", { repository_path: repositoryPath });

export const healthCheck = () => client.get("/health");

export const getSystemStatus = () => client.get("/system/status");
