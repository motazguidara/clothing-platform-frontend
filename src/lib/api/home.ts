import { clientConfig } from "@/lib/client-env";
import type { HomePayload } from "@/types/home";

export async function fetchHome(): Promise<HomePayload> {
  const url = `${clientConfig.apiUrl.replace(/\/$/, "")}/home/`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to load home payload: ${res.status}`);
  return res.json();
}
