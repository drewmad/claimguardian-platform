'use client'

import { useEffect, useRef } from 'react'

interface VideoBackgroundProps {
  src: string
  poster?: string
  className?: string
}

export function VideoBackground({ src, poster, className = '' }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      video.play().catch(console.error)
    }

    video.addEventListener('canplay', handleCanPlay)
    return () => video.removeEventListener('canplay', handleCanPlay)
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        className={`absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -z-20 transform -translate-x-1/2 -translate-y-1/2 object-cover ${className}`}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-slate-950/70 -z-10" />
    </>
  )
}