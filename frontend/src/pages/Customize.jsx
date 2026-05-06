import React, { useContext, useRef, useState, useEffect, useCallback } from 'react'
import image1 from "../assets/image1.png"
import image2 from "../assets/image2.jpg"
import image3 from "../assets/authBg.png"
import image4 from "../assets/image4.png"
import image5 from "../assets/image5.png"
import image6 from "../assets/image6.jpeg"
import image7 from "../assets/image7.jpeg"
import { RiImageAddLine } from "react-icons/ri"
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { MdKeyboardBackspace } from "react-icons/md"

const PRESETS = [
  { img: image1, name: 'Aria',   tag: 'Calm & Focused',    color: '#a78bfa', emoji: '🌸' },
  { img: image2, name: 'Luna',   tag: 'Gentle & Creative',  color: '#60a5fa', emoji: '🌙' },
  { img: image3, name: 'Atlas',  tag: 'Bold & Confident',   color: '#34d399', emoji: '⚡' },
  { img: image4, name: 'Lyra',   tag: 'Cheerful & Warm',   color: '#f472b6', emoji: '🎵' },
  { img: image5, name: 'Nova',   tag: 'Smart & Curious',   color: '#818cf8', emoji: '🚀' },
  { img: image6, name: 'Zara',   tag: 'Elegant & Sharp',   color: '#fb923c', emoji: '💎' },
  { img: image7, name: 'Orion',  tag: 'Wise & Reliable',   color: '#38bdf8', emoji: '🌌' },
  { img: null,   name: 'Custom', tag: 'Upload your own',   color: '#94a3b8', emoji: '📁' },
]

// Spring easing
const SPRING = 'cubic-bezier(0.34, 1.28, 0.64, 1)'

function Customize() {
  const { setBackendImage, setFrontendImage, frontendImage, selectedImage, setSelectedImage } = useContext(userDataContext)
  const navigate = useNavigate()
  const inputRef = useRef()

  // Which card is centered
  const [active, setActive] = useState(() => {
    // If selectedImage is an objectURL (custom upload) or 'input', go to last slot (Custom)
    if (!selectedImage || selectedImage.startsWith('blob:') || selectedImage === 'input') {
      return frontendImage ? PRESETS.length - 1 : 0
    }
    const idx = PRESETS.findIndex(p => p.img === selectedImage)
    return idx >= 0 ? idx : 0
  })

  // Entrance animation
  const [entered, setEntered] = useState(false)
  useEffect(() => { const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t) }, [])

  // Dragging state for visual feedback
  const dragX = useRef(null)
  const [dragDelta, setDragDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Select image whenever active changes
  useEffect(() => {
    const p = PRESETS[active]
    if (p.img) {
      setSelectedImage(p.img)
      setBackendImage(null)
      setFrontendImage(null)
    }
  }, [active])

  const goTo = useCallback((idx) => {
    setActive(Math.max(0, Math.min(PRESETS.length - 1, idx)))
    setDragDelta(0)
  }, [])

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft') goTo(active - 1)
      if (e.key === 'ArrowRight') goTo(active + 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, goTo])

  // Touch / mouse drag
  const startDrag = (clientX) => { dragX.current = clientX; setIsDragging(true) }
  const moveDrag = (clientX) => {
    if (dragX.current === null) return
    setDragDelta(clientX - dragX.current)
  }
  const endDrag = (clientX) => {
    if (dragX.current === null) return
    const dx = clientX - dragX.current
    if (dx < -60) goTo(active + 1)
    else if (dx > 60) goTo(active - 1)
    else setDragDelta(0)
    dragX.current = null
    setIsDragging(false)
    setDragDelta(0)
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setBackendImage(file)
    setFrontendImage(objectUrl)
    setSelectedImage(objectUrl) // store the preview URL, not a literal 'input'
  }

  const canContinue = (PRESETS[active].img && selectedImage) || (PRESETS[active].img === null && frontendImage && backendImage)
  const accent = PRESETS[active].color

  return (
    <div
      className="w-full min-h-[100vh] flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${hexToRgb(accent)},0.18) 0%, #020210 55%)`, transition: 'background 0.6s ease' }}
      onMouseMove={e => moveDrag(e.clientX)}
      onMouseUp={e => endDrag(e.clientX)}
      onMouseLeave={() => { setDragDelta(0); dragX.current = null; setIsDragging(false) }}
      onTouchMove={e => moveDrag(e.touches[0].clientX)}
      onTouchEnd={e => endDrag(e.changedTouches[0].clientX)}
    >
      {/* Animated background particles */}
      <Particles accent={accent} />

      {/* Large ambient glow that follows the active card color */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '600px', height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${hexToRgb(accent)},0.22) 0%, transparent 70%)`,
          filter: 'blur(30px)',
          transition: 'background 0.6s ease',
        }}
      />

      {/* Back button */}
      <button
        className="absolute top-[20px] left-[20px] z-30 flex items-center gap-2 text-gray-300 hover:text-white"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '8px 16px', backdropFilter: 'blur(12px)', transition: 'all 0.2s' }}
        onClick={() => navigate("/")}
      >
        <MdKeyboardBackspace className="w-[18px] h-[18px]" />
        <span className="text-[13px] font-medium">Back</span>
      </button>

      {/* Title */}
      <div className="text-center z-10 mb-[36px]" style={{ opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(-20px)', transition: 'all 0.6s ease' }}>
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 text-[12px] font-medium"
          style={{ background: `rgba(${hexToRgb(accent)},0.15)`, border: `1px solid rgba(${hexToRgb(accent)},0.3)`, color: accent, transition: 'all 0.5s ease' }}
        >
          ✨ Choose your companion
        </div>
        <h1 className="text-white text-[28px] font-bold leading-tight">
          Meet your{' '}
          <span style={{ background: `linear-gradient(90deg, ${accent}, #6366f1)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transition: 'all 0.5s' }}>
            Assistant
          </span>
        </h1>
        <p className="text-gray-500 text-[13px] mt-1.5">Drag, swipe or use ← → to browse</p>
      </div>

      {/* ── CAROUSEL ── */}
      <div
        className="relative z-10 flex items-center justify-center w-full"
        style={{ height: '320px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => startDrag(e.clientX)}
        onTouchStart={e => startDrag(e.touches[0].clientX)}
      >
        {PRESETS.map((preset, idx) => {
          const offset = idx - active
          const abs = Math.abs(offset)
          if (abs > 2) return null

          // Position math
          const xBase = offset * 185
          const x = xBase + (abs === 0 ? dragDelta * 0.2 : dragDelta * 0.04 * Math.sign(offset) * -1)
          const scale = abs === 0 ? 1 : abs === 1 ? 0.76 : 0.58
          const z = abs === 0 ? 0 : -(abs * 90)
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.6 : 0.32
          const blur = abs === 0 ? 0 : abs === 1 ? 2 : 5
          const zIndex = 10 - abs * 3
          const isCenter = abs === 0
          const rotateY = offset * -8 // slight Y rotation for 3D feel

          return (
            <div
              key={idx}
              className="absolute flex flex-col items-center"
              style={{
                transform: `translateX(${x}px) scale(${scale}) translateZ(${z}px) rotateY(${rotateY}deg)`,
                opacity,
                filter: blur ? `blur(${blur}px)` : 'none',
                zIndex,
                transition: isDragging ? 'none' : `all 0.5s ${SPRING}`,
                cursor: isCenter ? (preset.img ? 'pointer' : 'pointer') : 'pointer',
              }}
              onClick={() => abs !== 0 ? goTo(idx) : (preset.img === null && inputRef.current.click())}
            >
              {/* Card */}
              <div
                style={{
                  width: isCenter ? '165px' : '140px',
                  height: isCenter ? '255px' : '215px',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  border: isCenter ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: isCenter
                    ? `0 0 50px rgba(${hexToRgb(accent)},0.5), 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)`
                    : '0 8px 32px rgba(0,0,0,0.6)',
                  background: '#060620',
                  transition: `all 0.5s ${SPRING}`,
                  position: 'relative',
                }}
              >
                {/* Image or upload slot */}
                {preset.img ? (
                  <img src={preset.img} className="w-full h-full object-cover" alt={preset.name} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(160deg, rgba(15,15,50,0.95), rgba(2,2,25,0.98))' }}>
                    {frontendImage
                      ? <img src={frontendImage} className="w-full h-full object-cover absolute inset-0" alt="custom" />
                      : <>
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `rgba(${hexToRgb(accent)},0.15)`, border: `1px solid rgba(${hexToRgb(accent)},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RiImageAddLine style={{ color: accent, width: '26px', height: '26px' }} />
                          </div>
                          {isCenter && <span style={{ color: accent, fontSize: '11px', fontWeight: 600 }}>Tap to Upload</span>}
                        </>
                    }
                  </div>
                )}

                {/* Shimmer overlay on center */}
                {isCenter && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(140deg, rgba(${hexToRgb(accent)},0.12) 0%, transparent 45%, rgba(${hexToRgb(accent)},0.06) 100%)`,
                    transition: 'background 0.5s ease',
                  }} />
                )}

                {/* Check badge */}
                {isCenter && (
                  <div
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accent}, #6366f1)`,
                      boxShadow: `0 0 14px rgba(${hexToRgb(accent)},0.8)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name + tag — only for center card */}
              {isCenter && (
                <div
                  className="flex flex-col items-center gap-1.5 mt-3"
                  style={{ animation: 'fadeSlideUp 0.4s ease both' }}
                >
                  <p className="text-white font-bold text-[18px] tracking-tight">
                    {preset.emoji} {preset.name}
                  </p>
                  <span
                    className="text-[11px] font-medium px-3 py-1 rounded-full"
                    style={{
                      background: `rgba(${hexToRgb(accent)},0.15)`,
                      border: `1px solid rgba(${hexToRgb(accent)},0.35)`,
                      color: accent,
                      transition: 'all 0.4s ease',
                    }}
                  >
                    {preset.tag}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dot + pill indicators */}
      <div className="flex items-center gap-[7px] z-10 mt-2">
        {PRESETS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === active ? '28px' : '7px',
              height: '7px',
              borderRadius: '4px',
              background: i === active ? accent : 'rgba(255,255,255,0.18)',
              border: 'none',
              cursor: 'pointer',
              transition: `all 0.4s ${SPRING}`,
              boxShadow: i === active ? `0 0 10px rgba(${hexToRgb(accent)},0.6)` : 'none',
            }}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <div className="flex gap-4 z-10 mt-5">
        <ArrowBtn
          dir="left"
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
          accent={accent}
        />
        <ArrowBtn
          dir="right"
          disabled={active === PRESETS.length - 1}
          onClick={() => goTo(active + 1)}
          accent={accent}
        />
      </div>

      {/* Continue button */}
      <div style={{ marginTop: '24px', minHeight: '52px', zIndex: 10 }}>
        {canContinue && (
          <button
            className="flex items-center justify-center gap-2 font-semibold rounded-full text-[16px]"
            style={{
              minWidth: '200px', height: '52px', padding: '0 32px',
              background: `linear-gradient(135deg, ${accent}, #6366f1)`,
              color: 'white',
              border: 'none',
              boxShadow: `0 0 30px rgba(${hexToRgb(accent)},0.4), 0 8px 24px rgba(0,0,0,0.4)`,
              cursor: 'pointer',
              animation: 'fadeSlideUp 0.5s ease both',
              transition: `box-shadow 0.3s ease, transform 0.2s ease`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 0 40px rgba(${hexToRgb(accent)},0.6), 0 12px 32px rgba(0,0,0,0.5)` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 30px rgba(${hexToRgb(accent)},0.4), 0 8px 24px rgba(0,0,0,0.4)` }}
            onClick={() => navigate("/customize2")}
          >
            Continue with {PRESETS[active].name}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <input type="file" accept="image/*" ref={inputRef} hidden onChange={handleUpload} />

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          70% { transform: scale(1.15) rotate(5deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg) translateX(160px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(160px) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

// Arrow button component
function ArrowBtn({ dir, disabled, onClick, accent }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '46px', height: '46px', borderRadius: '50%',
        background: hovered && !disabled ? `rgba(${hexToRgb(accent)},0.25)` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${hovered && !disabled ? `rgba(${hexToRgb(accent)},0.5)` : 'rgba(255,255,255,0.1)'}`,
        backdropFilter: 'blur(12px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.25 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s ease',
        transform: hovered && !disabled ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hovered && !disabled ? `0 0 16px rgba(${hexToRgb(accent)},0.35)` : 'none',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={hovered && !disabled ? accent : '#94a3b8'}
        strokeWidth="2.5" strokeLinecap="round"
      >
        {dir === 'left'
          ? <path d="M15 18l-6-6 6-6" />
          : <path d="M9 18l6-6-6-6" />
        }
      </svg>
    </button>
  )
}

// Floating ambient particles that shift color with active card
function Particles({ accent }) {
  return (
    <>
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 5 + 2}px`,
            height: `${Math.random() * 5 + 2}px`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? accent : 'rgba(129,140,248,0.6)',
            animation: `particleFloat ${Math.random() * 10 + 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: 0,
            transition: 'background 0.5s ease',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

// Hex to rgb helper for rgba()
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const n = parseInt(hex, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

export default Customize
