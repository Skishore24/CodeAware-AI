import client from "./client";

export const searchRAG = (repositoryName, query, topK = 8) =>
  client.post("/rag/search", {
    repository_name: repositoryName,
    query,
    top_k: topK,
  });
