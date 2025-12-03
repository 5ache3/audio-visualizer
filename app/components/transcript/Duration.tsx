import React from 'react'
import { useAudioStore } from '../../store/audio';

export default function Duration() {
    const duration = useAudioStore((state) => state.duration);
    const time = useAudioStore((state) => state.currentTime);

    const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className='flex flex-col justify-center p-2 m-2'>
            {formatTime(time)} / {formatTime(duration)}
    </div>
  )
}
