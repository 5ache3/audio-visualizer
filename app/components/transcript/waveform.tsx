"use client";
import React, { useRef, useEffect, useState } from "react";
import { useAudioStore } from "../../store/audio";

interface WaveformProps {
  width?: number;
  height?: number;
  points?: number;
}

const getWaveformData = async (
  file: File,
  points = 1000
): Promise<Float32Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0);

  const blockSize = Math.floor(rawData.length / points);
  const waveform = new Float32Array(points);

  for (let i = 0; i < points; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j]);
    }
    waveform[i] = sum / blockSize;
  }

  return waveform;
};

const Waveform: React.FC<WaveformProps> = ({
  width = 800,
  height = 200,
  points = 1000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const file = useAudioStore((state) => state.file);
  
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);

  const [waveform, setWaveform] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (!file) return;
    getWaveformData(file, points).then(setWaveform);
  }, [file, points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const middle = height / 2;
      const sliceWidth = width / waveform.length;

      // Draw full waveform
      ctx.fillStyle = "#4ade80";
      waveform.forEach((value, i) => {
        const x = i * sliceWidth;
        const y = value * middle;
        ctx.fillRect(x, middle - y, sliceWidth, y * 2);
      });

      // Draw played portion (red)
      if (duration > 0) {
        const progressPx = (currentTime / duration) * width;
        ctx.fillStyle = "#f87171";
        waveform.forEach((value, i) => {
          const x = i * sliceWidth;
          if (x > progressPx) return;
          const y = value * middle;
          ctx.fillRect(x, middle - y, sliceWidth, y * 2);
        });
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [waveform, currentTime, duration, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default Waveform;
