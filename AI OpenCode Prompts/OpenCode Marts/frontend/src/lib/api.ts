const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "API Error");
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }
}

export const api = new ApiClient();
