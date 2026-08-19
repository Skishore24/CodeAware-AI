import client from "./client";

export const runSecurityScan = (repositoryName, filePath = null) =>
  client.post("/security/scan", {
    repository_name: repositoryName,
    file_path: filePath,
  });
