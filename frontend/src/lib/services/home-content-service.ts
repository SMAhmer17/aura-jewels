import { useHomeContentStore } from "@/store/home-content-store";
import { defaultHomeContent } from "@/lib/mock-data/home";
import { api } from "@/lib/api/client";
import type { HomeContent } from "@/types/home-content";

export async function loadHomeContent(): Promise<void> {
  useHomeContentStore.getState().setContent(await api<HomeContent>("/home-content"));
}

export function useHomeContent(): HomeContent {
  return useHomeContentStore((state) => state.content);
}

export async function saveHomeContent(content: HomeContent) {
  const saved = await api<HomeContent>("/admin/home-content", { method: "PUT", as: "admin", body: { content } });
  useHomeContentStore.getState().setContent(saved);
}

/** Puts the original wording and layout back. */
export async function resetHomeContent() {
  await saveHomeContent(defaultHomeContent);
}
