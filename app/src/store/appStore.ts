import { create } from 'zustand';

type AppState = {
  inicializado: boolean;
  logado: boolean;
  userUuid: string | null;
  onboarded: boolean;
  setInicializado: (v: boolean) => void;
  setLogado: (userUuid: string | null) => void;
  setOnboarded: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  inicializado: false,
  logado: false,
  userUuid: null,
  onboarded: false,
  setInicializado: (v) => set({ inicializado: v }),
  setLogado: (uuid) => set({ logado: !!uuid, userUuid: uuid }),
  setOnboarded: (v) => set({ onboarded: v }),
}));
