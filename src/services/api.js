export const API_URL = "http://10.0.2.2:5000/api"; // Android emulator

export async function api(endpoint, method = "GET", body, token = null) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  return res.json();
}
