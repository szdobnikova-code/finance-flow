import type { ApiResponse } from "@/types/finance";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.ok) {
    throw new Error(json.ok ? res.statusText : json.error);
  }

  return json.data;
}

async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

async function post<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function patch<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function remove<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "DELETE",
  });
}

export const api = {
  get,
  post,
  patch,
  delete: remove,
};
