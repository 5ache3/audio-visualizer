import { create } from "zustand";

interface AudioState {
  file: File | null;
  setFile: (file: File) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
}));
