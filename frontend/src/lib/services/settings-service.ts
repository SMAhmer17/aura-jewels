import { useSettingsStore, type StoreSettings } from "@/store/settings-store";
import { api } from "@/lib/api/client";

export async function loadSettings(): Promise<void> {
  useSettingsStore.getState().setSettings(await api<StoreSettings>("/settings"));
}

export function useSettings(): StoreSettings {
  return useSettingsStore((state) => state.settings);
}

export async function updateSettings(input: Partial<StoreSettings>) {
  const current = useSettingsStore.getState().settings;
  const saved = await api<StoreSettings>("/admin/settings", { method: "PUT", as: "admin", body: { ...current, ...input } });
  useSettingsStore.getState().setSettings(saved);
}
