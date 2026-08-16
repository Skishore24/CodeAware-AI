import client from "./client";

export const buildGraph = (repositoryName) =>
  client.post("/graph/build", { repository_name: repositoryName });

export const getGraphSummary = (repositoryName) =>
  client.post("/graph/summary", { repository_name: repositoryName });

export const getImpact = (repositoryName, symbolName) =>
  client.post("/graph/impact", {
    repository_name: repositoryName,
    symbol_name: symbolName,
  });
