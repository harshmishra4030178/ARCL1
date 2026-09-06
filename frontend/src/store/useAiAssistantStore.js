import { create } from "zustand";

export const useAiAssistantStore = create((set) => ({
  isOpen: false,
  openAssistant: () => set({ isOpen: true }),
  closeAssistant: () => set({ isOpen: false }),
  toggleAssistant: () => set((state) => ({ isOpen: !state.isOpen })),
}));
