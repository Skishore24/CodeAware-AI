import client from "./client";

export const runCodeReview = (repositoryName, filePath = null) =>
  client.post("/review/code", {
    repository_name: repositoryName,
    file_path: filePath,
  });
