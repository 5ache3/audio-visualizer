"use client";

import { useEffect, useRef } from 'react';
import BlobCard from '../components/BlobCard';
import SideVoice from '../components/SideVoice';
import Transcript from '../components/Transcript';
import { useAudioStore } from '../store/audio';
export default function Page() {
  const file = useAudioStore((state) => state.file);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (file) {
        
      const audio = new Audio(URL.createObjectURL(file));
      audio.loop = false;  
      audio.volume = 0.4;     
      audio.play().catch(() => {
        console.warn("Autoplay failed.");
      });

      audioRef.current = audio;

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [file]);

  if (!file) {
    return <div className='flex flex-col justify-center text-center font-semibold h-dvh'>No file selected. Go back and upload an MP3.</div>;
  }

  return (
    <div className='flex flex-col p-10 gap-2'>
        <div className='flex justify-between'>
            <SideVoice side="left"/>

            <BlobCard/>
            <SideVoice side="right"/>
        </div>
        <Transcript/>
    </div>
  )
}
