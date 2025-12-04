"use client";
// import React from 'react'
// import WaveformVisualizer from './waveform';
import Waveform from './waveform';
import Duration from './Duration';
import React, { useEffect, useState } from 'react'

export default function Transcript() {
  const [w, setW] = useState(800)
  useEffect(() => {
    const update = () => setW(Math.max(320, window.innerWidth - 32))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return (
    <div className='fixed bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-black/60 backdrop-blur p-4'>
      <Waveform width={w} height={140} />
      <div className='text-white px-4'>
        <Duration />
      </div>
    </div>
  )
}
