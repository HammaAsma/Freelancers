import api from "./client";

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const register = (email, password, first_name, last_name) =>
  api.post("/auth/register", { email, password, first_name, last_name });
