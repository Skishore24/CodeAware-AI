import client from "./client";

export const listChatSessions = (params) => client.get("/api/chat/sessions", { params });
export const createChatSession = (data) => client.post("/api/chat/sessions", data);
export const getChatHistory = (sessionId) => client.get(`/api/chat/history/${sessionId}`);
export const sendChatMessage = (data) => client.post("/api/chat/send", data);
