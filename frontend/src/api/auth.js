import client from "./client";

export const loginUser = (email, password) =>
  client.post("/auth/login", { email, password });

export const registerUser = (name, email, password, role = "Developer") =>
  client.post("/auth/register", { name, email, password, role });

export const getMe = () => client.get("/auth/me");

export const verifyToken = () => client.get("/auth/verify");

export const getTeam = () => client.get("/auth/team");

export const addTeamMemberApi = (name, email, role) =>
  client.post("/auth/team", { name, email, role });

export const removeTeamMemberApi = (memberId) =>
  client.delete(`/auth/team/${memberId}`);

