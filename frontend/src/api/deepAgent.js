import client from "./client";

export const runDeepAgent = (data) => client.post("/api/deep-agent/run", data);
export const getDeepAgentStatus = (runId) => client.get(`/api/deep-agent/status/${runId}`);
