import client from "./client";

export const getFileContent = (data) => client.post("/api/files/content", data);
export const getFileTree = (data) => client.post("/api/files/tree", data);
