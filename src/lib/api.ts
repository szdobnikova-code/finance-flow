import type { ApiResponse } from "@/types/finance";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export const api = { get };
