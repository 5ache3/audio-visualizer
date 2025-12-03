"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAudioStore } from "./store/audio";

export default function Home() {

  const [isDragActive, setIsDragActive] = useState(false);
  const setFile = useAudioStore((state) => state.setFile);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleFile = (file: File | null) => {
  if (!file) return;

  const audioState = useAudioStore.getState();

  if (audioState.audioContext && audioState.audioContext.state !== "closed") {
    audioState.audioContext.close();
  }

  audioState.setAudioContext(null);
  audioState.setAnalyser(null);
  audioState.setSource(null);
  audioState.setIsPlaying(false);

  setFile(file);
  router.push("/visualization");
};

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <div className="flex flex-col justify-center text-center h-150 w-150 rounded-2xl bg-black shadow-[0_0_20px_5px_rgba(255,255,255,0.3)]">
        <div className="m-auto w-full p-3">
          <div className="max-w-xl">
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex justify-center w-full h-32 px-4 transition bg-blue-500 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none ${
                isDragActive ? "border-blue-500 bg-gray-100" : "border-gray-300"
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <span className="font-medium text-gray-600">
                  Drop MP3 files to attach, or{" "}
                  <span className="text-blue-600 underline">browse</span>
                </span>
              </span>

              <input
              type="file"
              accept=".mp3,audio/mp3"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}
