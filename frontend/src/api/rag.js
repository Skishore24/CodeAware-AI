import client from "./client";

export const searchCode = (repositoryName, query, filters = {}) =>
  client.post("/code-search/search", {
    repository_name: repositoryName,
    query,
    ...filters,
  });

export const askRAG = (repositoryName, question) =>
  client.post("/rag/ask", {
    repository_name: repositoryName,
    question,
  });
