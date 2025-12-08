import { api } from "./api";

export async function login(email, password) {
  return api("/auth/login", "POST", { email, password });
}

export async function register(data) {
  return api("/auth/register", "POST", data);
}
