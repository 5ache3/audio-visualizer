// store/audio.ts
import { create } from 'zustand';

interface AudioState {
  file: File | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: MediaElementAudioSourceNode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: Uint8Array;
  setFile: (file: File | null) => void;
  setAudioContext: (context: AudioContext | null) => void;
  setAnalyser: (analyser: AnalyserNode | null) => void;
  setSource: (source: MediaElementAudioSourceNode | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setWaveformData: (data: Uint8Array) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  file: null,
  audioContext: null,
  analyser: null,
  source: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  waveformData: new Uint8Array(),
  setFile: (file) => set({ file }),
  setAudioContext: (audioContext) => set({ audioContext }),
  setAnalyser: (analyser) => set({ analyser }),
  setSource: (source) => set({ source }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setWaveformData: (waveformData) => set({ waveformData }),
}));