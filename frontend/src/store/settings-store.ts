import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoreSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  shippingFlatRate: number;
  freeShippingThreshold: number;
}

const defaultSettings: StoreSettings = {
  storeName: "Aura Jewels",
  tagline: "By ZAS",
  supportEmail: "contact@jewlsbyzas.com",
  supportPhone: "0311 8706843",
  shippingFlatRate: 250,
  freeShippingThreshold: 50000,
};

interface SettingsState {
  settings: StoreSettings;
  updateSettings: (input: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (input) => set((state) => ({ settings: { ...state.settings, ...input } })),
    }),
    { name: "aura-jewels-settings", skipHydration: true },
  ),
);
