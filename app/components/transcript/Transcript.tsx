import React from 'react'
import { useAudioStore } from '../../store/audio';
// import WaveformVisualizer from './waveform';
import Waveform from './waveform';
import Duration from './Duration';

export default function Transcript() {
    const file=useAudioStore((state) => state.file);
  return (
    <div className='bg-blue-950 h-30 w-full flex justify-between text-center rounded-2xl p-2'>
        <Waveform width={1000} height={200} />
        <Duration/>
    </div>
  )
}
