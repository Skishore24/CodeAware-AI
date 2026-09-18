import client from "./client";

export const scanBugs = (data) => client.post("/api/bugs/scan", data);
export const listBugs = (params) => client.get("/api/bugs/list", { params });
