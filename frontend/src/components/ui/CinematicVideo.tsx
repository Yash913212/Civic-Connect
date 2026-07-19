"use client";
import React, { useEffect, useRef, useImperativeHandle } from 'react'
import Hls from 'hls.js'

const VIDEO_SRC = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8'

interface CinematicVideoProps {
  className?: string
  overlayOpacity?: number
  mirror?: boolean
  blur?: number
  zoom?: boolean
  id?: string
}

const CinematicVideo = React.forwardRef<HTMLVideoElement, CinematicVideoProps>(({
  className = '',
  overlayOpacity = 0.4,
  mirror = false,
  blur = 0,
  zoom = false,
  id,
}, ref) => {
  const innerVideoRef = useRef<HTMLVideoElement>(null)
  
  // Forward the inner ref to the parent
  useImperativeHandle(ref, () => innerVideoRef.current as HTMLVideoElement)

  useEffect(() => {
    const video = innerVideoRef.current
    if (!video) return

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hls.loadSource(VIDEO_SRC)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {})
      })
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [])

  return (
    <div id={id} className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={innerVideoRef}
        className="cinematic-video h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        style={{
          transform: `${mirror ? 'scaleY(-1)' : ''} ${zoom ? 'scale(1.1)' : ''}`.trim(),
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(5, 8, 22, ${overlayOpacity})`, zIndex: 1 }}
      />
      {/* Gradient fade */}
      <div className="video-overlay-gradient" />
      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay" style={{ zIndex: 3 }} />
    </div>
  )
})

export default CinematicVideo
