const envApiBase = import.meta.env.VITE_API_BASE?.trim().replace(/\/+$/, "");
const API_BASE = envApiBase || (import.meta.env.DEV ? "http://localhost:5000" : "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE}/api/auth/google`;
}

export const api = {
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  getSummaries: (category) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    return request(`/api/summaries${params}`);
  },
  syncEmails: () =>
    request("/api/emails/sync", {
      method: "POST",
      body: JSON.stringify({ maxResults: 10 })
    }),
  sendDigest: () => request("/api/digest/send", { method: "POST" })
};
