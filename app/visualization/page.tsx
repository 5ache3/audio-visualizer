"use client";

import { useEffect, useRef, useCallback } from "react";
import BlobCard from "../components/blob/BlobCard";
import { useAudioStore } from "../store/audio";
import Transcript from "../components/transcript/Transcript";

export default function Page() {
  const file = useAudioStore((state) => state.file);

  const setFile = useAudioStore((state) => state.setFile);
  const setAudioContext = useAudioStore((state) => state.setAudioContext);
  const setAnalyser = useAudioStore((state) => state.setAnalyser);
  const setSource = useAudioStore((state) => state.setSource);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime);
  const setDuration = useAudioStore((state) => state.setDuration);
  const setDisplaying = useAudioStore((state) => state.setDisplaying);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  
  const initAudioAnalysis = useCallback((audioElement: HTMLAudioElement) => {

    const AudioContextCtor = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    setAudioContext(audioContext);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    setAnalyser(analyser);

    const source = audioContext.createMediaElementSource(audioElement);
    setSource(source);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioElement.addEventListener("play", () => { setIsPlaying(true); setDisplaying(true); });
    audioElement.addEventListener("pause", () => { setIsPlaying(false); setDisplaying(false); });
    audioElement.addEventListener("ended", () => { setIsPlaying(false); setDisplaying(false); });
    audioElement.addEventListener("timeupdate", () => setCurrentTime(audioElement.currentTime));
    audioElement.addEventListener("loadedmetadata", () => setDuration(audioElement.duration));
  }, [setAudioContext, setAnalyser, setSource, setIsPlaying, setCurrentTime, setDuration, setDisplaying]);

  // Load a test file if none exists
  useEffect(() => {
    if (!file) {
      const loadTestFile = async () => {
        try {
          const response = await fetch("/audio/test-audio.mp3");
          const blob = await response.blob();
          const testFile = new File([blob], "test-audio.mp3", { type: "audio/mpeg" });
          setFile(testFile);
        } catch (error) {
          console.error("Failed to load test audio:", error);
        }
      };
      loadTestFile();
    }
  }, [file, setFile]);

  useEffect(() => {
    if (!file) return;

    const audio = new Audio(URL.createObjectURL(file));
    audio.volume = 0.4;
    audioRef.current = audio;

    initAudioAnalysis(audio);

    return () => {
      audio.pause();
      URL.revokeObjectURL(audio.src);

      // Close the AudioContext cleanly
      const audioContext = useAudioStore.getState().audioContext;
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }

      setAudioContext(null);
      setAnalyser(null);
      setSource(null);
      setIsPlaying(false);
    };
  }, [file, initAudioAnalysis, setAudioContext, setAnalyser, setSource, setIsPlaying]);

  // Toggle play/pause on click anywhere
  const handlePageClick = async () => {

    const audio = audioRef.current;
    if (!audio) return;

    const audioState = useAudioStore.getState();
    const audioContext = audioState.audioContext;
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (audio.paused) {
      await audio.play();
      audioState.setIsPlaying(true);
      audioState.setDisplaying(true);
    } else {
      audio.pause();
      audioState.setIsPlaying(false);
      audioState.setDisplaying(false);
    }
  };

  return (
    <div className="relative min-h-screen" onClick={handlePageClick}>
      <BlobCard />
      <Transcript/>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
