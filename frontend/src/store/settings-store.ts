import { create } from "zustand";

export interface StoreSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  giftBoxPrice: number;
  lowStockThreshold: number;
}

/** Shown until the real settings arrive from the API, so the first paint is never blank. */
export const defaultSettings: StoreSettings = {
  storeName: "Aura Jewels",
  tagline: "By ZAS",
  supportEmail: "contact@jewlsbyzas.com",
  supportPhone: "0311 8706843",
  shippingFlatRate: 250,
  freeShippingThreshold: 50000,
  giftBoxPrice: 300,
  lowStockThreshold: 5,
};

interface SettingsState {
  settings: StoreSettings;
  setSettings: (settings: StoreSettings) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: defaultSettings,
  setSettings: (settings) => set({ settings: { ...defaultSettings, ...settings } }),
}));
