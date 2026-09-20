import { create } from "zustand";

interface UiState {
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
}

/** Small bits of shared screen state, such as letting any page open the account drawer. */
export const useUiStore = create<UiState>()((set) => ({
  accountOpen: false,
  setAccountOpen: (accountOpen) => set({ accountOpen }),
}));

export const openAccountDrawer = () => useUiStore.getState().setAccountOpen(true);
