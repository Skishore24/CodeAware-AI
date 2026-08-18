import client from "./client";

// =========================================================
// Repository API
// =========================================================

/** Clone only (legacy GitHub endpoint) */
export const cloneRepository = (githubUrl) =>
  client.post("/github/clone", { github_url: githubUrl });

/** Clone and full ingest (scan + graph + RAG index) */
export const cloneAndIngest = (url) =>
  client.post("/repositories/clone-and-ingest", { url });

/** Clone only without ingestion */
export const cloneRepositoryFull = (repositoryUrl) =>
  client.post("/repositories/clone", { repository_url: repositoryUrl });

/** Scan repository files */
export const scanRepository = (repositoryPath) =>
  client.post("/repositories/scan", { repository_path: repositoryPath });

/** Run AST code analysis */
export const analyzeCode = (repositoryPath) =>
  client.post("/repositories/code-analysis", { repository_path: repositoryPath });

/** List all cloned repositories in workspace */
export const listRepositories = () => client.get("/repositories/list");

/** Backend health check */
export const healthCheck = () => client.get("/health");

