import { create } from 'zustand';

type AppState = {
  inicializado: boolean;
  onboarded: boolean;
  setInicializado: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  inicializado: false,
  onboarded: false,
  setInicializado: (v) => set({ inicializado: v }),
  setOnboarded: (v) => set({ onboarded: v }),
}));
