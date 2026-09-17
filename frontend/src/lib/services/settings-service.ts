import { useSettingsStore, type StoreSettings } from "@/store/settings-store";

export function useSettings(): StoreSettings {
  return useSettingsStore((state) => state.settings);
}

export function updateSettings(input: Partial<StoreSettings>) {
  useSettingsStore.getState().updateSettings(input);
}
