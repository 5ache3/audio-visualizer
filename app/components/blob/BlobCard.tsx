import React from 'react'
import ThreeAudioVisualizer from './3dball'
export default function BlobCard() {
  return (
    <div className='flex flex-col justify-center text-center '>
      <ThreeAudioVisualizer  width ={600} height={400} />
    </div>
  )
}
