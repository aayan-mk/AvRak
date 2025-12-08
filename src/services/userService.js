import { api } from "./api";

export function getProfile(token) {
  return api("/user/profile", "GET", null, token);
}

export function updateProfile(data, token) {
  return api("/user/update", "POST", data, token);
}
