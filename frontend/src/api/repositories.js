import client from "./client";

export const cloneRepository = (githubUrl) =>
  client.post("/github/clone", { github_url: githubUrl });

export const cloneRepositoryFull = (repositoryUrl) =>
  client.post("/repositories/clone", { repository_url: repositoryUrl });

export const scanRepository = (repositoryName) =>
  client.post("/repositories/scan", { repository_name: repositoryName });

export const analyzeCode = (repositoryName) =>
  client.post("/repositories/code-analysis", { repository_name: repositoryName });

export const healthCheck = () => client.get("/health");
