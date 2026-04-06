export const API_URL = "http://localhost:4000";

function toUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string) {
  const res = await fetch(toUrl(path), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(toUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

export async function createCheckout(productId: string) {
  return apiPost("/api/checkout", { productId });
}
