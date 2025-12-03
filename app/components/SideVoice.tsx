import React from 'react'

export default function SideVoice({side}:{side:"left"|"right"}) {
  return (
    <div className='bg-green-500 w-70 h-110 flex flex-col justify-center text-center rounded-2xl'>
        <h1 className='text-[40px]'>{side}</h1>
    </div>
  )
}
