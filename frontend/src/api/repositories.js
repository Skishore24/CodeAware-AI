import client from "./client";

export const listRepositories = () => client.get("/repositories/list");

export const cloneRepository = (url) =>
  client.post("/repositories/clone", { repository_url: url });

export const cloneAndIngest = (url) =>
  client.post("/repositories/clone-and-ingest", { url });

export const deleteRepository = (repositoryName) =>
  client.delete(`/repositories/${encodeURIComponent(repositoryName)}`);

export const scanRepository = (repositoryPath) =>
  client.post("/repositories/scan", { repository_path: repositoryPath });

export const analyzeCode = (repositoryPath) =>
  client.post("/repositories/code-analysis", { repository_path: repositoryPath });

export const healthCheck = () => client.get("/health");

export const getSystemStatus = () => client.get("/system/status");

export const getFileContent = (repositoryName, filePath, startLine = null, endLine = null) =>
  client.post("/repositories/file-content", {
    repository_name: repositoryName,
    file_path: filePath,
    start_line: startLine,
    end_line: endLine,
  });

