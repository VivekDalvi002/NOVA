import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import { ToastContainer, useToast } from '../components/Toast'
import { playClick, playChime, playWhoosh, playSuccess, playError } from '../utils/sounds'

// ─── Motivational quotes for Morning Briefing ───────────────────────────────
const QUOTES = [
  "The only way to do great work is to love what you do. – Steve Jobs",
  "Innovation distinguishes between a leader and a follower. – Steve Jobs",
  "Stay hungry, stay foolish. – Steve Jobs",
  "Code is like humor. When you have to explain it, it's bad. – Cory House",
  "First, solve the problem. Then, write the code. – John Johnson",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your limitation—it's only your imagination.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "Don't watch the clock; do what it does. Keep going. – Sam Levenson",
  "Everything you've ever wanted is on the other side of fear. – George Addair",
  "Believe you can and you're halfway there. – Theodore Roosevelt",
  "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt",
  "It does not matter how slowly you go as long as you do not stop. – Confucius",
  "Hardships often prepare ordinary people for an extraordinary destiny. – C.S. Lewis",
]

// ─── Time-based helpers ────────────────────────────────────────────────────
const getHour = () => new Date().getHours()

const getSmartGreeting = (name) => {
  const h = getHour()
  if (h >= 5 && h < 12) return `Good morning, ${name}! ☀️ Ready to start the day?`
  if (h >= 12 && h < 17) return `Good afternoon, ${name}! How can I help?`
  if (h >= 17 && h < 21) return `Good evening, ${name}! 🌆 What do you need?`
  return `Still up, ${name}? 🌙 I'm here if you need me.`
}

const getGreetingEmoji = () => {
  const h = getHour()
  if (h >= 5 && h < 12) return '🌅'
  if (h >= 12 && h < 17) return '☀️'
  if (h >= 17 && h < 21) return '🌆'
  return '🌙'
}

// ─── Feature 7: Mood Theme by time of day ──────────────────────────────────
const getMoodTheme = () => {
  const h = getHour()
  if (h >= 5 && h < 12) return {
    bg: 'radial-gradient(ellipse at 60% 40%, #1a0a2e 0%, #2d1b4e 30%, #0d0d3a 70%)',
    nodeColor: 'rgba(251,191,36,0.5)',   // warm amber
    nodeGlow: '#f59e0b',
  }
  if (h >= 12 && h < 17) return {
    bg: 'radial-gradient(ellipse at 60% 40%, #0c1445 0%, #1e1b4b 30%, #020215 70%)',
    nodeColor: 'rgba(56,189,248,0.5)',   // sky blue
    nodeGlow: '#38bdf8',
  }
  if (h >= 17 && h < 21) return {
    bg: 'radial-gradient(ellipse at 60% 40%, #1e0533 0%, #2e1065 30%, #0f0520 70%)',
    nodeColor: 'rgba(192,132,252,0.5)',  // purple
    nodeGlow: '#c084fc',
  }
  return {
    bg: 'radial-gradient(ellipse at 60% 40%, #0d0d3a 0%, #020210 70%)',
    nodeColor: 'rgba(129,140,248,0.6)',  // default indigo
    nodeGlow: '#6366f1',
  }
}

// ─── Animated canvas: neural-network floating nodes ───────────────────────────
const AnimatedBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    const theme = getMoodTheme()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = 55
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
    }))

    const MAX_DIST = 160

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / MAX_DIST) * 0.35})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = theme.nodeColor
        ctx.shadowBlur = 8
        ctx.shadowColor = theme.nodeGlow
        ctx.fill()
        ctx.shadowBlur = 0
      })
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
}

// ─── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(interval); setDone(true) }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, done }
}

// ─── Mic volume visualizer ─────────────────────────────────────────────────────
function MicVisualizer({ active }) {
  const [levels, setLevels] = useState([4, 4, 4, 4, 4, 4, 4])
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setLevels([4, 4, 4, 4, 4, 4, 4])
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      return
    }

    let ctx, analyser, source
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream
      ctx = new AudioContext()
      analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const bars = Array.from({ length: 7 }, (_, i) => {
          const val = data[Math.floor(i * data.length / 7)]
          return Math.max(4, Math.min(48, val * 0.5))
        })
        setLevels(bars)
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => {
      const tick = () => {
        setLevels(prev => prev.map(() => 4 + Math.random() * 28))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    })

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [active])

  return (
    <div className="flex items-end justify-center gap-[4px] h-[52px]">
      {levels.map((h, i) => (
        <div
          key={i}
          className="mic-bar"
          style={{
            height: `${h}px`,
            opacity: active ? 1 : 0.3,
            background: `linear-gradient(to top, #6366f1, ${i % 2 === 0 ? '#818cf8' : '#a5b4fc'})`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Language Picker ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी', flag: '🟠' },
  { code: 'en-IN', label: 'Hinglish', flag: '🔀' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
]

function LanguagePicker({ current, onChange }) {
  return (
    <div className='w-full flex flex-col gap-[6px]'>
      <p className='text-gray-400 text-[11px] uppercase tracking-widest mb-1'>🌐 Language</p>
      <div className='flex flex-wrap gap-[6px]'>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => onChange(l.code)}
            className='flex items-center gap-[5px] px-[10px] py-[5px] rounded-full text-[12px] font-medium transition-all'
            style={{
              background: current === l.code ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${current === l.code ? '#818cf8' : 'rgba(99,102,241,0.2)'}`,
              color: current === l.code ? 'white' : '#94a3b8',
              transform: current === l.code ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Default + Pinned Shortcut Chips (with 3-second countdown) ───────────────
const DEFAULT_CHIPS = [
  { label: '🕐 Time', cmd: 'what is the time', pinned: false },
  { label: '📅 Date', cmd: "what is today's date", pinned: false },
  { label: '🌤 Weather', cmd: 'show me the weather', pinned: false },
  { label: '🎵 Play music', cmd: 'play music on YouTube', pinned: false },
  { label: '🔍 Google', cmd: 'search on Google', pinned: false },
  { label: '🧮 Calculator', cmd: 'open calculator', pinned: false },
]

const COUNTDOWN_SEC = 3

function ShortcutChips({ onChipClick, pinnedChips, onAddPin, onRemovePin }) {
  const [counting, setCounting] = useState(null)
  const [count, setCount] = useState(COUNTDOWN_SEC)
  const timerRef = useRef(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newCmd, setNewCmd] = useState('')

  const allChips = [...DEFAULT_CHIPS, ...(pinnedChips || []).map(c => ({ ...c, pinned: true }))]

  const startCountdown = (idx, cmd) => {
    if (counting === idx) { cancelCountdown(); return }
    cancelCountdown()
    setCounting(idx)
    setCount(COUNTDOWN_SEC)

    let remaining = COUNTDOWN_SEC
    timerRef.current = setInterval(() => {
      remaining -= 1
      setCount(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setCounting(null)
        onChipClick(cmd)
      }
    }, 1000)
  }

  const cancelCountdown = () => {
    clearInterval(timerRef.current)
    setCounting(null)
    setCount(COUNTDOWN_SEC)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const handleAddChip = () => {
    if (!newLabel.trim() || !newCmd.trim()) return
    onAddPin({ label: `📌 ${newLabel.trim()}`, cmd: newCmd.trim() })
    setNewLabel(''); setNewCmd(''); setShowAddModal(false)
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-[8px] max-w-[520px] px-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        {allChips.map((c, i) => {
          const isCounting = counting === i
          return (
            <button
              key={i}
              className={`chip ${isCounting ? 'chip-counting' : ''}`}
              onClick={() => startCountdown(i, c.cmd)}
              style={{ minWidth: isCounting ? '110px' : undefined }}
            >
              {isCounting && (
                <span
                  className="chip-countdown-bar"
                  style={{ animationDuration: `${COUNTDOWN_SEC}s` }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {isCounting ? `${c.label.split(' ')[0]} ${count}s…` : c.label}
              </span>
              {isCounting && (
                <span
                  className="chip-cancel"
                  style={{ position: 'relative', zIndex: 1 }}
                  onClick={e => { e.stopPropagation(); cancelCountdown() }}
                >✕</span>
              )}
              {c.pinned && !isCounting && (
                <span
                  className="chip-unpin"
                  onClick={e => { e.stopPropagation(); onRemovePin(i - DEFAULT_CHIPS.length) }}
                >✕</span>
              )}
            </button>
          )
        })}
        {/* Add custom chip button */}
        <button className="chip-pin-add" onClick={() => setShowAddModal(true)} title="Add custom shortcut">+</button>
      </div>

      {/* Add Chip Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-[16px] font-semibold mb-4">📌 Add Custom Shortcut</h3>
            <div className="flex flex-col gap-3">
              <input
                className="text-input-bar"
                placeholder="Label (e.g. WhatsApp)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <input
                className="text-input-bar"
                placeholder="Command (e.g. open WhatsApp)"
                value={newCmd}
                onChange={e => setNewCmd(e.target.value)}
                maxLength={100}
                onKeyDown={e => e.key === 'Enter' && handleAddChip()}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="shimmer-btn flex-1 h-[40px] text-[#1e1b4b] font-semibold rounded-xl text-[14px]"
                  onClick={handleAddChip}
                >Add</button>
                <button
                  className="flex-1 h-[40px] rounded-xl text-[14px] font-medium text-gray-400"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                  onClick={() => setShowAddModal(false)}
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// Animated waveform bars shown when AI is speaking
const WaveForm = () => (
  <div className="flex items-end justify-center gap-[5px] h-[55px]">
    {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
      <div
        key={i}
        className="wave-bar"
        style={{ animationDelay: `${delay}s` }}
      />
    ))}
  </div>
)

// Pulsing orb shown when listening
const ListeningOrb = () => (
  <div className="relative flex items-center justify-center w-[80px] h-[80px]">
    {[1, 1.4, 1.8].map((scale, i) => (
      <div
        key={i}
        className="pulse-ring"
        style={{
          width: 70,
          height: 70,
          background: 'rgba(99,102,241,0.25)',
          animationDelay: `${i * 0.5}s`,
        }}
      />
    ))}
    <div
      className="w-[55px] h-[55px] rounded-full z-10 flex items-center justify-center animate-orb-pulse"
      style={{
        background: 'radial-gradient(circle at 35% 35%, #818cf8, #3730a3)',
        boxShadow: '0 0 25px rgba(99,102,241,0.7)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </div>
  </div>
)

// ─── Feature 10: Morning Briefing ─────────────────────────────────────────────
function MorningBriefing({ name, onDismiss }) {
  const [visible, setVisible] = useState(true)
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDismiss() }, 12000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto" onClick={() => { setVisible(false); onDismiss() }}>
      <div className="briefing-card px-8 py-7 max-w-[420px] w-[90vw] text-center cursor-pointer" onClick={e => e.stopPropagation()}>
        <div className="text-[40px] mb-2">{getGreetingEmoji()}</div>
        <h2 className="animated-gradient-text text-[22px] font-bold mb-1">{getSmartGreeting(name)}</h2>
        <p className="text-indigo-300 text-[14px] mb-4">{dayName}, {dateStr}</p>
        <div
          className="px-4 py-3 rounded-xl mb-4 text-[13px] text-gray-300 italic leading-relaxed"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          💡 "{quote}"
        </div>
        <button
          className="shimmer-btn px-6 py-2 rounded-full text-[13px] font-semibold text-[#1e1b4b]"
          onClick={() => { setVisible(false); onDismiss() }}
        >
          Let's Go! →
        </button>
      </div>
    </div>
  )
}

// ─── Feature 9: Now Playing Widget ────────────────────────────────────────────
function NowPlayingWidget({ query, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 15000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="now-playing-card fixed bottom-[90px] left-1/2 -translate-x-1/2 z-30 px-5 py-3 flex items-center gap-3 max-w-[380px]">
      <div className="text-[24px] animate-float" style={{ animationDuration: '2s' }}>🎵</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-indigo-400 font-medium uppercase tracking-wider">Now Playing</p>
        <p className="text-white text-[14px] font-medium truncate">{query}</p>
      </div>
      <button
        className="text-gray-400 hover:text-white transition-colors text-[16px]"
        onClick={onDismiss}
      >✕</button>
    </div>
  )
}

// ─── Tier 3: Timer Widget ──────────────────────────────────────────────────────
function TimerWidget({ totalSeconds, onDismiss }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!paused && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [paused, remaining === 0])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const pct = remaining / totalSeconds
  const circumference = 283 // 2π × 45
  const strokeOffset = circumference * (1 - pct)
  const isDone = remaining === 0

  return (
    <div className="timer-card fixed top-[80px] right-[20px] z-30 p-4 flex flex-col items-center gap-3 w-[160px]">
      <p className="text-[11px] text-indigo-400 uppercase tracking-wider font-medium">
        {isDone ? '✅ Done!' : '⏱️ Timer'}
      </p>
      <div className="relative w-[90px] h-[90px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={isDone ? '#22c55e' : '#818cf8'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isDone ? circumference : strokeOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white text-[18px] font-bold">
          {mins}:{secs}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="text-[12px] px-3 py-1 rounded-full text-indigo-300 hover:text-white transition-colors"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          onClick={() => setPaused(p => !p)}
        >{paused ? '▶' : '⏸'}</button>
        <button
          className="text-[12px] px-2 py-1 rounded-full text-red-400 hover:text-red-300 transition-colors"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          onClick={onDismiss}
        >✕</button>
      </div>
    </div>
  )
}

// ─── Tier 3: Todo Panel ────────────────────────────────────────────────────────
const TODO_KEY = 'nova_todos'

function TodoPanel({ onDismiss }) {
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TODO_KEY) || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')

  const save = (list) => { setTodos(list); localStorage.setItem(TODO_KEY, JSON.stringify(list)) }
  const addItem = (text) => { if (!text?.trim()) return; save([...todos, { text: text.trim(), done: false }]) }
  const toggle = (i) => { const t = [...todos]; t[i].done = !t[i].done; save(t) }
  const remove = (i) => { save(todos.filter((_, idx) => idx !== i)) }
  const clearAll = () => save([])

  return (
    <div className="todo-panel fixed top-[80px] left-[16px] z-30 p-4 w-[260px] flex flex-col gap-3 max-h-[70vh]">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-[14px]">📋 My Tasks</p>
        <div className="flex gap-2">
          {todos.length > 0 && (
            <button className="text-[11px] text-red-400 hover:text-red-300" onClick={clearAll}>Clear all</button>
          )}
          <button className="text-gray-400 hover:text-white text-[14px]" onClick={onDismiss}>✕</button>
        </div>
      </div>
      {/* Add task manually */}
      <form onSubmit={e => { e.preventDefault(); addItem(input); setInput('') }} className="flex gap-2">
        <input
          className="text-input-bar flex-1 text-[12px]"
          style={{ padding: '6px 12px', borderRadius: '10px' }}
          placeholder="Add task..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[16px]"
          style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)', color: 'white' }}
        >+</button>
      </form>
      {/* Task list */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {todos.length === 0 && (
          <p className="text-gray-500 text-[12px] text-center mt-2">No tasks yet.<br />Say "Add buy milk to my list"</p>
        )}
        {todos.map((t, i) => (
          <div key={i} className={`todo-item ${t.done ? 'done' : ''}`}>
            <button
              className={`w-[18px] h-[18px] rounded-full border flex-shrink-0 flex items-center justify-center text-[10px] transition-all`}
              style={{
                border: `1px solid ${t.done ? '#22c55e' : 'rgba(99,102,241,0.5)'}`,
                background: t.done ? 'rgba(34,197,94,0.2)' : 'transparent',
                color: '#22c55e'
              }}
              onClick={() => toggle(i)}
            >{t.done ? '✓' : ''}</button>
            <span className="text-[12px] text-gray-200 flex-1 leading-relaxed">{t.text}</span>
            <button className="text-[11px] text-gray-500 hover:text-red-400 transition-colors" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-indigo-400 text-center">
        {todos.filter(t => t.done).length}/{todos.length} done
      </p>
    </div>
  )
}

// Helper: add todo to localStorage (called from handleCommand)
const addTodoToStorage = (text) => {
  try {
    const list = JSON.parse(localStorage.getItem(TODO_KEY) || '[]')
    list.push({ text: text.trim(), done: false })
    localStorage.setItem(TODO_KEY, JSON.stringify(list))
  } catch { }
}
const clearTodosFromStorage = () => { try { localStorage.setItem(TODO_KEY, '[]') } catch { } }

// ─── Command Palette ────────────────────────────────────────────────────────────
const CMD_ACTIONS = [
  { id: 'timer',     icon: '⏱️', label: 'Set Timer',          hint: '"Set timer for 5 minutes"',     color: 'rgba(250,204,21,0.15)',  cmd: 'set timer for 5 minutes' },
  { id: 'todo',      icon: '📋', label: 'My Tasks',            hint: 'Show your to-do list',           color: 'rgba(99,102,241,0.15)',  action: 'todo' },
  { id: 'weather',   icon: '🌤️', label: 'Live Weather',        hint: 'Show real-time weather card',    color: 'rgba(56,189,248,0.15)',  cmd: 'show weather' },
  { id: 'exam',      icon: '📅', label: 'Exam Countdown',      hint: 'Days till next AECC exam',       color: 'rgba(34,197,94,0.15)',   action: 'exam' },
  { id: 'translate', icon: '🌐', label: 'Translate',           hint: '"Translate hello to Hindi"',     color: 'rgba(34,197,94,0.15)',   cmd: 'translate hello to Hindi' },
  { id: 'joke',      icon: '😂', label: 'Tell Me a Joke',      hint: 'Get a random joke',              color: 'rgba(251,146,60,0.15)',  cmd: 'tell me a joke' },
  { id: 'youtube',   icon: '▶️', label: 'Play on YouTube',     hint: '"Play lo-fi music"',             color: 'rgba(239,68,68,0.15)',   cmd: 'play lo-fi music on youtube' },
  { id: 'voice',     icon: '🎙️', label: 'Change Voice',        hint: 'Switch male/female voice',       color: 'rgba(168,85,247,0.15)',  cmd: 'switch to female voice' },
  { id: 'note',      icon: '💾', label: 'Save a Note',         hint: '"Remember WiFi password is X"',  color: 'rgba(129,140,248,0.15)', cmd: 'remember my wifi password is nova123' },
  { id: 'google',    icon: '🔍', label: 'Google Search',       hint: 'Search anything on Google',      color: 'rgba(96,165,250,0.15)',  cmd: 'search latest tech news' },
  { id: 'calc',      icon: '🧮', label: 'Calculator',          hint: 'Open calculator',                color: 'rgba(52,211,153,0.15)', cmd: 'open calculator' },
  { id: 'clear',     icon: '🗑️', label: 'Clear History',       hint: 'Erase conversation history',     color: 'rgba(239,68,68,0.12)',   action: 'clear' },
  { id: 'open',      icon: '🌍', label: 'Open Website',        hint: '"Open Netflix" / "Open Spotify"',color: 'rgba(250,204,21,0.12)', cmd: 'open netflix' },
]

function CommandPalette({ onClose, onRunCommand, onAction }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)

  // Focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Filter commands by query
  const filtered = CMD_ACTIONS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.hint.toLowerCase().includes(query.toLowerCase())
  )

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[activeIdx]) { selectItem(filtered[activeIdx]) }
  }

  const selectItem = (item) => {
    playClick()
    if (item.action === 'todo') { onAction('todo'); onClose() }
    else if (item.action === 'clear') { onAction('clear'); onClose() }
    else if (item.cmd) {
      // Let user type a custom version or use default
      const finalCmd = query && !CMD_ACTIONS.find(c => c.label.toLowerCase() === query.toLowerCase()) ? query : item.cmd
      onRunCommand(finalCmd)
      onClose()
    }
  }

  // Reset active when filter changes
  useEffect(() => { setActiveIdx(0) }, [query])

  return (
    <div
      className="cmd-palette-backdrop fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="cmd-palette-modal w-[92vw] max-w-[520px] p-5 flex flex-col gap-3" onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className="relative">
          <input
            ref={inputRef}
            className="cmd-palette-input pl-[44px]"
            placeholder="Search commands… or type anything"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[16px] opacity-50">⚡</span>
          <span className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[11px] text-gray-500 font-mono">ESC</span>
        </div>

        {/* Command list */}
        <div className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`cmd-item ${i === activeIdx ? 'active' : ''}`}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <div className="cmd-icon" style={{ background: item.color }}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="cmd-label">{item.label}</div>
                <div className="cmd-hint">{item.hint}</div>
              </div>
              {i === activeIdx && (
                <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">↵</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-500 text-[13px] text-center py-4">No commands found — press Enter to send as message</p>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-2 pt-1 border-t" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
          <span className="text-[10px] text-gray-600">↑↓ navigate • ↵ select • ESC close</span>
          <span className="text-[10px] text-indigo-500 font-mono">Ctrl+P</span>
        </div>
      </div>
    </div>
  )
}

// ─── Feature A: Battery Status Hook ─────────────────────────────────────────
function useBattery() {
  const [battery, setBattery] = useState(null) // { level, charging }
  useEffect(() => {
    if (!navigator.getBattery) return
    let bat = null
    const update = (b) => setBattery({ level: Math.round(b.level * 100), charging: b.charging })
    navigator.getBattery().then(b => {
      bat = b
      update(b)
      b.addEventListener('levelchange', () => update(b))
      b.addEventListener('chargingchange', () => update(b))
    }).catch(() => {})
    return () => {
      if (bat) {
        bat.removeEventListener('levelchange', update)
        bat.removeEventListener('chargingchange', update)
      }
    }
  }, [])
  return battery
}

// ─── Feature B: Live Weather Card ────────────────────────────────────────────
const WMO_CODES = {
  0: {label:'Clear Sky',emoji:'☀️'}, 1:{label:'Mainly Clear',emoji:'🌤️'},
  2: {label:'Partly Cloudy',emoji:'⛅'}, 3:{label:'Overcast',emoji:'☁️'},
  45:{label:'Foggy',emoji:'🌫️'}, 48:{label:'Freezing Fog',emoji:'🌫️'},
  51:{label:'Light Drizzle',emoji:'🌦️'}, 53:{label:'Drizzle',emoji:'🌦️'}, 55:{label:'Heavy Drizzle',emoji:'🌧️'},
  61:{label:'Light Rain',emoji:'🌧️'}, 63:{label:'Rain',emoji:'🌧️'}, 65:{label:'Heavy Rain',emoji:'🌧️'},
  71:{label:'Light Snow',emoji:'🌨️'}, 73:{label:'Snow',emoji:'❄️'}, 75:{label:'Heavy Snow',emoji:'❄️'},
  80:{label:'Rain Showers',emoji:'🌦️'}, 81:{label:'Showers',emoji:'🌦️'}, 82:{label:'Heavy Showers',emoji:'⛈️'},
  95:{label:'Thunderstorm',emoji:'⛈️'}, 96:{label:'Thunderstorm+Hail',emoji:'⛈️'}, 99:{label:'Severe Thunderstorm',emoji:'🌩️'},
}

function WeatherCard({ onDismiss }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [city, setCity] = useState('')

  useEffect(() => {
    const timer = setTimeout(onDismiss, 30000)
    if (!navigator.geolocation) { setError('Location not supported'); setLoading(false); clearTimeout(timer); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords
          // Reverse geocode city name (free)
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const geoData = await geoRes.json()
          const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location'
          setCity(cityName)
          // Weather from Open-Meteo (completely free, no API key)
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`)
          const wData = await wRes.json()
          const cw = wData.current_weather
          const humidity = wData.hourly?.relative_humidity_2m?.[0] ?? '—'
          setWeather({ temp: Math.round(cw.temperature), wind: Math.round(cw.windspeed), code: cw.weathercode, humidity })
        } catch {
          setError('Weather fetch failed')
        } finally {
          setLoading(false)
        }
      },
      () => { setError('Location denied — enable GPS'); setLoading(false) }
    )
    return () => clearTimeout(timer)
  }, [])

  const info = weather ? (WMO_CODES[weather.code] || { label: 'Unknown', emoji: '🌡️' }) : null

  return (
    <div
      className="animate-fade-up fixed top-1/2 left-1/2 z-40"
      style={{ transform: 'translate(-50%, -50%)', width: '320px' }}
    >
      <div
        className="p-5 rounded-2xl flex flex-col gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.22))',
          border: '1px solid rgba(56,189,248,0.4)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(56,189,248,0.2), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-sky-400 uppercase tracking-widest font-medium">🌍 Live Weather</p>
          <button className="text-gray-400 hover:text-white transition-colors text-[16px]" onClick={onDismiss}>✕</button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-[12px]">Getting your location…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-red-400 text-[13px]">⚠️ {error}</p>
            <p className="text-gray-500 text-[11px] mt-1">Allow location access and try again</p>
          </div>
        )}

        {weather && info && (
          <>
            {/* City */}
            <p className="text-white font-semibold text-[16px]">📍 {city}</p>

            {/* Main temp */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white text-[52px] font-bold leading-none">{weather.temp}°</span>
                <span className="text-sky-300 text-[14px] ml-1">C</span>
              </div>
              <div className="text-[56px]">{info.emoji}</div>
            </div>

            {/* Condition */}
            <p className="text-sky-300 text-[14px] font-medium -mt-2">{info.label}</p>

            {/* Stats row */}
            <div className="flex gap-3 mt-1">
              {[
                { icon: '💨', label: 'Wind', val: `${weather.wind} km/h` },
                { icon: '💧', label: 'Humidity', val: `${weather.humidity}%` },
              ].map(s => (
                <div key={s.label}
                  className="flex-1 px-3 py-2 rounded-xl flex flex-col items-center gap-1"
                  style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}
                >
                  <span className="text-[16px]">{s.icon}</span>
                  <span className="text-gray-400 text-[10px]">{s.label}</span>
                  <span className="text-white text-[12px] font-semibold">{s.val}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Feature E: Exam Countdown Card ──────────────────────────────────────────
// AECC exam dates (approximate, matching aec.md)
const AECC_EXAMS = [
  { name: 'Mid-Sem (Odd)',  date: new Date(`${new Date().getFullYear()}-10-01`) },
  { name: 'End-Sem (Odd)',  date: new Date(`${new Date().getFullYear()}-12-01`) },
  { name: 'Mid-Sem (Even)', date: new Date(`${new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0)}-02-15`) },
  { name: 'End-Sem (Even)', date: new Date(`${new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0)}-05-10`) },
]

function getNextExam() {
  const now = new Date()
  const upcoming = AECC_EXAMS.filter(e => e.date > now).sort((a,b) => a.date - b.date)
  return upcoming[0] || AECC_EXAMS[0]
}

function ExamCountdownCard({ onDismiss }) {
  const exam = getNextExam()
  const days = Math.ceil((exam.date - new Date()) / (1000 * 60 * 60 * 24))
  const urgency = days <= 7 ? '#ef4444' : days <= 30 ? '#f59e0b' : '#22c55e'

  useEffect(() => {
    const t = setTimeout(onDismiss, 20000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="animate-fade-up fixed top-1/2 left-1/2 z-40"
      style={{ transform: 'translate(-50%, -50%)', width: '300px' }}
    >
      <div
        className="p-5 rounded-2xl flex flex-col gap-3 text-center"
        style={{
          background: `linear-gradient(135deg, rgba(2,2,30,0.95), rgba(30,27,75,0.95))`,
          border: `1px solid ${urgency}55`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 0 40px ${urgency}33, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: urgency }}>📅 Exam Countdown</p>
          <button className="text-gray-400 hover:text-white text-[16px]" onClick={onDismiss}>✕</button>
        </div>

        <div className="text-[64px] font-black" style={{ color: urgency, lineHeight: 1, textShadow: `0 0 30px ${urgency}` }}>
          {days}
        </div>
        <p className="text-white text-[13px] font-semibold -mt-1">days remaining</p>

        <div className="px-3 py-2 rounded-xl" style={{ background: `${urgency}15`, border: `1px solid ${urgency}33` }}>
          <p className="text-white text-[15px] font-bold">{exam.name}</p>
          <p className="text-gray-400 text-[12px] mt-0.5">{exam.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <p className="text-[11px]" style={{ color: days <= 7 ? '#fca5a5' : days <= 30 ? '#fcd34d' : '#86efac' }}>
          {days <= 7 ? '🚨 Exams are very close! Study hard!' : days <= 30 ? '⚠️ Start preparing now!' : '✅ You have time, but start early!'}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse, clearHistory, updatePinnedChips } = useContext(userDataContext)
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synth = window.speechSynthesis
  const toast = useToast()
  const { displayed: typedAiText, done: typingDone } = useTypewriter(aiText, 25)

  // Feature 1: Text input
  const [textInput, setTextInput] = useState('')
  const textInputRef = useRef(null)

  // Feature 9: Now Playing
  const [nowPlaying, setNowPlaying] = useState(null)

  // Tier 3: Timer and Todo
  const [timer, setTimer] = useState(null)    // { totalSeconds }
  const [showTodo, setShowTodo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)  // ← React state for UI (not just ref)
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [isSpeakingState, setIsSpeakingState] = useState(false)  // For avatar animation

  // Feature B: Live Weather Card
  const [showWeather, setShowWeather] = useState(false)

  // Feature E: Exam Countdown
  const [showExamCountdown, setShowExamCountdown] = useState(false)

  // Feature A: Battery status
  const battery = useBattery()

  // Feature F: Mic toggle (state already existed, keep as-is)

  // Feature 10: Morning Briefing
  const [showBriefing, setShowBriefing] = useState(() => {
    const last = localStorage.getItem('nova_last_briefing_date')
    const today = new Date().toDateString()
    return last !== today
  })

  // Feature D: Request browser Notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Feature C: Download JSON helper
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // Language — persists in localStorage
  const [lang, setLang] = useState(() => localStorage.getItem('nova_lang') || 'en-US')
  const langRef = useRef(lang)
  const changeLang = (l) => { setLang(l); langRef.current = l; localStorage.setItem('nova_lang', l) }

  // Conversation memory
  const [conversationHistory, setConversationHistory] = useState([])
  const addToHistory = useCallback((userMsg, assistantMsg) => {
    setConversationHistory(prev => [
      ...prev.slice(-12),
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantMsg }
    ])
  }, [])

  // Mic toggle
  const [micEnabled, setMicEnabled] = useState(true)
  const micEnabledRef = useRef(true)
  const toggleMic = () => {
    const next = !micEnabledRef.current
    micEnabledRef.current = next
    setMicEnabled(next)
    if (!next) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      setTimeout(() => { if (!isRecognizingRef.current) startRecognition() }, 300)
    }
  }

  // ── Stop Speaking ──
  const stopSpeaking = () => {
    synth.cancel()
    isSpeakingRef.current = false
    setIsSpeakingState(false)
    setAiText('')
    playClick()
    setTimeout(() => {
      if (!isRecognizingRef.current && micEnabledRef.current) startRecognition()
    }, 500)
  }

  const isActiveRef = useRef(false)
  const activeTimeoutRef = useRef(null)
  const errorCountRef = useRef(0)
  const maxRetries = 5
  const baseDelay = 2000
  // Track whether synth has been unlocked by a user gesture
  const synthUnlockedRef = useRef(false)
  const greetingSpokenRef = useRef(false)
  const restartTimerRef = useRef(null)

  // Voice gender — can be changed by voice command
  const voiceGenderRef = useRef(
    userData?.assistantImage?.includes('authBg') ? 'male' : 'female'
  )

  // Feature 7: Mood theme
  const moodTheme = getMoodTheme()

  // Push history entry into local userData
  const pushLocalHistory = useCallback((cmd, response, type) => {
    setUserData(prev => ({
      ...prev,
      history: [
        ...(prev.history || []),
        { command: cmd, response, type: type || 'general', timestamp: new Date().toISOString() }
      ].slice(-50)
    }))
  }, [setUserData])

  // ── Feature 3: Pinned chips handlers ──
  const handleAddPin = useCallback(async (chip) => {
    const current = userData?.pinnedChips || []
    const updated = [...current, chip]
    const ok = await updatePinnedChips(updated)
    if (ok) toast.success(`📌 Added "${chip.label}"`)
    else toast.error('Failed to save shortcut')
  }, [userData, updatePinnedChips])

  const handleRemovePin = useCallback(async (idx) => {
    const current = [...(userData?.pinnedChips || [])]
    const removed = current.splice(idx, 1)[0]
    const ok = await updatePinnedChips(current)
    if (ok) toast.success(`Removed "${removed?.label}"`)
    else toast.error('Failed to remove shortcut')
  }, [userData, updatePinnedChips])

  // ── Chip/text command handler ──
  const handleChipClick = useCallback(async (cmd) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsProcessing(true)
    if (isSpeakingRef.current) { synth.cancel(); isSpeakingRef.current = false; setAiText('') }
    recognitionRef.current?.stop()
    setUserText(cmd)
    setAiText('')
    const data = await getGeminiResponse(cmd, langRef.current, conversationHistory)
    if (!data) {
      toast.error('Could not process command')
      setUserText('')
      isProcessingRef.current = false
      setIsProcessing(false)
      return
    }
    handleCommand(data)
    if (data.type === 'reminder-set' && data.reminderMs > 0) scheduleReminder(data.response, data.reminderMs, cmd)
    setAiText(data.response)
    pushLocalHistory(cmd, data.response, data.type)
    addToHistory(cmd, data.response)
    setUserText('')
    playClick()  // 🔊 soft click on successful command
    setTimeout(() => { isProcessingRef.current = false; setIsProcessing(false) }, 800)
  }, [getGeminiResponse, pushLocalHistory, addToHistory, conversationHistory])

  // ── Feature 1: Text input submit ──
  const handleTextSubmit = (e) => {
    e.preventDefault()
    const cmd = textInput.trim()
    if (!cmd) return
    setTextInput('')
    handleChipClick(cmd)
  }

  // Keyboard shortcuts: Ctrl+K = text input, Ctrl+P = command palette
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        textInputRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        playWhoosh()
        setShowCmdPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      toast.success('Logged out successfully')
      setTimeout(() => { setUserData(null); navigate('/signin') }, 800)
    } catch (error) {
      setUserData(null)
      navigate('/signin')
    }
  }

  const scheduleReminder = useCallback((confirmText, delayMs, originalCmd) => {
    const label = originalCmd || 'Reminder'
    toast.info(`⏰ Reminder set: "${label}"`)
    setTimeout(() => {
      const msg = `Reminder: ${label}`
      // Feature D: Use browser Notification when tab is in background
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification('⏰ NOVA Reminder', { body: label, icon: '/vite.svg' })
      } else {
        toast.success(`⏰ ${msg}`, 8000)
      }
      speak(msg)
    }, delayMs)
  }, [])


  const startRecognition = () => {
    if (!micEnabledRef.current) return
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      if (errorCountRef.current >= maxRetries) return
      try {
        recognitionRef.current?.start()
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error("Start error:", error)
      }
    }
  }

  const resetErrorCount = () => { errorCountRef.current = 0 }

  // ── Chrome TTS watchdog ── Chrome has a bug where it silently pauses mid-speech
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (synth.speaking && synth.paused) synth.resume()
    }, 3000)
    return () => clearInterval(watchdog)
  }, [])

  // ── Core speak function ─────────────────────────────────────────────────────
  // IMPORTANT: Chrome blocks speechSynthesis until a user gesture has occurred.
  // We unlock it on first interaction and queue the greeting.
  const speakQueue = useRef([])
  const speakBusy = useRef(false)

  const doSpeakNow = useCallback((text) => {
    if (!text) return
    const currentLang = langRef.current || 'en-US'
    const isMale = voiceGenderRef.current === 'male'

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      let v = null
      if (currentLang.startsWith('en')) {
        const checks = isMale ? [
          x => x.name === 'Google UK English Male',
          x => x.name.includes('Microsoft David') || x.name.includes('David'),
          x => x.name.includes('Microsoft Guy'),
          x => x.name.includes('Google') && x.lang.startsWith('en'),
          x => x.name.includes('Microsoft') && x.lang.startsWith('en'),
          x => x.lang === 'en-US',
          x => x.lang.startsWith('en'),
        ] : [
          x => x.name === 'Google US English',
          x => x.name === 'Google UK English Female',
          x => x.name.includes('Microsoft Zira'),
          x => x.name.includes('Samantha'),
          x => x.name.includes('Google') && x.lang.startsWith('en'),
          x => x.name.includes('Microsoft') && x.lang.startsWith('en'),
          x => x.lang === 'en-US',
          x => x.lang.startsWith('en'),
        ]
        for (const c of checks) { v = voices.find(c); if (v) break }
      } else {
        v = voices.find(x => x.lang === currentLang)
          || voices.find(x => x.lang.startsWith(currentLang.split('-')[0]))
          || voices.find(x => x.lang.startsWith('en'))
      }
      return v
    }

    const trySpeak = () => {
      synth.cancel()
      // Give synth 50ms to settle after cancel
      setTimeout(() => {
        const waitForVoices = (tries = 2) => {
          const voices = window.speechSynthesis.getVoices()
          if (voices.length === 0 && tries > 0) {
            setTimeout(() => waitForVoices(tries - 1), 100)
            return
          }
          const utt = new SpeechSynthesisUtterance(text)
          utt.lang = currentLang
          const voice = pickVoice()
          if (voice) utt.voice = voice
          utt.pitch = isMale ? 0.85 : 1.1
          utt.rate = 1.05
          utt.onerror = (ev) => {
            if (ev.error === 'interrupted' || ev.error === 'canceled') {
              // intentionally cancelled — drain queue
              speakBusy.current = false
              isSpeakingRef.current = false
              setIsSpeakingState(false)
              return
            }
            console.warn('TTS error:', ev.error)
            speakBusy.current = false
            isSpeakingRef.current = false
            setIsSpeakingState(false)
            isProcessingRef.current = false
            setAiText('')
            setTimeout(() => { if (!isRecognizingRef.current && micEnabledRef.current) startRecognition() }, 800)
          }
          utt.onend = () => {
            speakBusy.current = false
            setAiText('')
            isSpeakingRef.current = false
            setIsSpeakingState(false)
            isProcessingRef.current = false
            resetErrorCount()
            setTimeout(() => {
              if (!isRecognizingRef.current && micEnabledRef.current && !isSpeakingRef.current) {
                startRecognition()
              }
            }, 600)
          }
          synth.speak(utt)
          playChime()
        }
        waitForVoices()
      }, 50)
    }

    trySpeak()
  }, [])

  const speak = useCallback((text) => {
    if (!text) return
    isSpeakingRef.current = true
    setIsSpeakingState(true)
    speakBusy.current = true
    // Stop recognition while speaking
    try { recognitionRef.current?.stop() } catch (e) {}
    isRecognizingRef.current = false
    setListening(false)
    doSpeakNow(text)
  }, [doSpeakNow])


  const tabOpenedRef = useRef(false)
  const isProcessingRef = useRef(false)
  const lastOpenedTabRef = useRef(null)  // Feature 4: undo tab

  const handleCommand = (data) => {
    if (!data || !data.response) { speak("Sorry, I couldn't process your request. Please try again."); return }
    const { userInput, response } = data
    const type = data.type || "general"

    // ── Voice change (handle BEFORE speaking so voice is already updated) ──
    if (type === 'voice-change') {
      const gender = data.voiceGender || (data.response?.toLowerCase().includes('male') ? 'male' : 'female')
      voiceGenderRef.current = gender
      toast.success(`🎙️ Voice changed to ${gender}`)
      speak(data.response)
      return
    }

    // ── Tier 3: Timer ──
    if (type === 'timer-start') {
      const secs = parseInt(data.timerSeconds) || 60
      setTimer({ totalSeconds: secs })
      speak(data.response)
      return
    }

    // ── Tier 3: Todo ──
    if (type === 'todo-add') {
      if (data.todoItem) addTodoToStorage(data.todoItem)
      setShowTodo(true)
      speak(data.response)
      return
    }
    if (type === 'todo-read') {
      setShowTodo(true)
      speak(data.response)
      return
    }
    if (type === 'todo-clear') {
      clearTodosFromStorage()
      setShowTodo(false)
      speak(data.response)
      return
    }

    // ── Tier 3: Open any URL ──
    if (type === 'open-url' && data.url) {
      const tabRef = window.open(data.url, '_blank')
      const label = userInput || data.url
      toast.info(
        <span>
          Opening {label} —{' '}
          <span
            style={{ textDecoration: 'underline', cursor: 'pointer', color: '#818cf8', fontWeight: 600 }}
            onClick={() => { try { tabRef?.close() } catch (e) { } toast.success('Tab closed ↩️') }}
          >Undo</span>
        </span>,
        6000
      )
      speak(data.response)
      return
    }

    // Feature B: Weather — show inline card instead of Google tab
    if (type === 'weather-show') {
      setShowWeather(true)
      speak(response)
      return
    }

    // Feature E: Exam countdown card
    if (type === 'exam-countdown') {
      setShowExamCountdown(true)
      speak(response)
      return
    }

    speak(response)

    if (tabOpenedRef.current) return
    const needsTab = ['google-search', 'calculator-open', 'instagram-open', 'facebook-open', 'youtube-search', 'youtube-play'].includes(type)
    if (!needsTab) return

    tabOpenedRef.current = true
    setTimeout(() => { tabOpenedRef.current = false }, 2000)

    let url = null
    let tabLabel = ''
    if (type === 'google-search') { url = `https://www.google.com/search?q=${encodeURIComponent(userInput)}`; tabLabel = 'Google Search' }
    if (type === 'calculator-open') { url = `https://www.google.com/search?q=calculator`; tabLabel = 'Calculator' }
    if (type === 'instagram-open') { url = `https://www.instagram.com/`; tabLabel = 'Instagram' }
    if (type === 'facebook-open') { url = `https://www.facebook.com/`; tabLabel = 'Facebook' }
    if (type === 'youtube-search' || type === 'youtube-play') {
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
      tabLabel = userInput || 'YouTube'
      setNowPlaying({ query: userInput })
    }

    if (url) {
      const tabRef = window.open(url, '_blank')
      lastOpenedTabRef.current = tabRef
      toast.info(
        <span>
          Opened {tabLabel} —{' '}
          <span
            style={{ textDecoration: 'underline', cursor: 'pointer', color: '#818cf8', fontWeight: 600 }}
            onClick={() => {
              try { tabRef?.close() } catch (e) { }
              toast.success('Tab closed ↩️')
              if (type === 'youtube-search' || type === 'youtube-play') setNowPlaying(null)
            }}
          >Undo</span>
        </span>,
        6000
      )
    }
  }


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { console.error('Speech Recognition not supported'); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    let isMounted = true
    let networkErrCount = 0
    let inNetworkBackoff = false  // prevents onend from overriding network backoff

    // Clear any previous timer before scheduling a new one
    const scheduleRestart = (delayMs = 400) => {
      if (!isMounted) return
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null
        inNetworkBackoff = false
        if (!isMounted || isSpeakingRef.current || isRecognizingRef.current || !micEnabledRef.current) return
        try {
          recognition.lang = langRef.current
          recognition.start()
        } catch (e) {
          if (e.name !== 'InvalidStateError') console.warn('Rec start err:', e.message)
        }
      }, delayMs)
    }

    recognition.onstart = () => {
      console.log('[SpeechRecognition] onstart - Listening started')
      isRecognizingRef.current = true
      // Removed networkErrCount = 0 from here so backoff actually works
      inNetworkBackoff = false
      setListening(true)
    }

    recognition.onend = () => {
      console.log('[SpeechRecognition] onend - Listening stopped')
      isRecognizingRef.current = false
      setListening(false)
      // Don't override the backoff timer if we're in network error recovery
      if (inNetworkBackoff) return
      if (isMounted && !isSpeakingRef.current && !isProcessingRef.current && micEnabledRef.current) {
        console.log('[SpeechRecognition] onend - Restarting mic')
        scheduleRestart(500)
      }
    }

    recognition.onerror = (ev) => {
      console.error('[SpeechRecognition] onerror:', ev.error)
      isRecognizingRef.current = false
      setListening(false)
      const err = ev.error
      if (err === 'not-allowed') { console.error('Mic permission denied'); return }
      if (err === 'aborted') { scheduleRestart(600); return }
      if (err === 'no-speech') { scheduleRestart(800); return }
      if (err === 'network') {
        networkErrCount++
        inNetworkBackoff = true
        // Exponential backoff: 3s, 6s, 9s... up to 30s max
        const delay = Math.min(3000 * networkErrCount, 30000)
        // After 20 consecutive failures, pause for 60s then auto-recover
        if (networkErrCount > 20) {
          console.warn('Recognition: many network errors, pausing 60s then auto-retrying...')
          inNetworkBackoff = false
          setTimeout(() => {
            networkErrCount = 0
            if (isMounted && micEnabledRef.current && !isSpeakingRef.current && !isRecognizingRef.current) {
              console.log('[SpeechRecognition] network recovery restart')
              scheduleRestart(1000)
            }
          }, 60000)
          return
        }
        scheduleRestart(delay)
        return
      }
      scheduleRestart(800)
    }

    recognition.onresult = async (e) => {
      console.log('[SpeechRecognition] onresult - raw event:', e)
      if (isProcessingRef.current || isSpeakingRef.current) return
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      console.log('[SpeechRecognition] onresult - transcript:', transcript)
      networkErrCount = 0
      if (!transcript || transcript.length < 2) return

      // No wake-word needed — mic toggle controls when NOVA listens.
      // All speech is processed when mic is enabled.

      isProcessingRef.current = true
      isActiveRef.current = false
      setAiText('')
      setUserText(transcript)
      try { recognition.stop() } catch (e) {}
      isRecognizingRef.current = false
      setListening(false)
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)

      const data = await getGeminiResponse(transcript, langRef.current, conversationHistory)
      if (!data) {
        speak("Sorry, I couldn't process your request.")
        setUserText('')
        isProcessingRef.current = false
        setIsProcessing(false)
        return
      }
      handleCommand(data)
      if (data.type === 'reminder-set' && data.reminderMs > 0) scheduleReminder(data.response, data.reminderMs, transcript)
      setAiText(data.response)
      pushLocalHistory(transcript, data.response, data.type)
      addToHistory(transcript, data.response)
      setUserText('')
      isActiveRef.current = true
      activeTimeoutRef.current = setTimeout(() => { isActiveRef.current = false }, 12000)
      setTimeout(() => { 
        isProcessingRef.current = false
        if (!isRecognizingRef.current && micEnabledRef.current && !isSpeakingRef.current) {
          startRecognition()
        }
      }, 500)
    }

    // Start recognition after a short delay
    const startTimer = setTimeout(() => scheduleRestart(0), 600)

    // ── Greeting: Chrome requires a user gesture before speech works.
    // We unlock synth on first click/key, then play the greeting.
    const greetingText = getSmartGreeting(userData.name)
    const unlockAndGreet = () => {
      if (greetingSpokenRef.current) return
      greetingSpokenRef.current = true
      // Unlock synth with a silent utterance first
      const silent = new SpeechSynthesisUtterance('')
      silent.volume = 0
      window.speechSynthesis.speak(silent)
      setTimeout(() => speak(greetingText), 150)
    }
    // Also attach to first user interaction as fallback
    const onFirstInteraction = () => {
      unlockAndGreet()
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('keydown', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
    document.addEventListener('click', onFirstInteraction)
    document.addEventListener('keydown', onFirstInteraction)
    document.addEventListener('touchstart', onFirstInteraction)

    return () => {
      isMounted = false
      clearTimeout(startTimer)
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('keydown', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
      try { recognition.stop() } catch (e) {}
      setListening(false)
      isRecognizingRef.current = false
      isActiveRef.current = false
    }
  }, [])

  // Feature 10: Mark briefing as shown
  const handleBriefingDismiss = () => {
    setShowBriefing(false)
    localStorage.setItem('nova_last_briefing_date', new Date().toDateString())
  }


  return (
    <div
      className="w-full h-[100vh] flex justify-center items-center flex-col gap-[15px] overflow-hidden relative mood-transition"
      style={{ background: moodTheme.bg }}
    >
      {/* Feature D: Push Notification permission is requested on mount */}

      {/* ===== Morning Briefing Overlay ===== */}
      {showBriefing && <MorningBriefing name={userData?.name} onDismiss={handleBriefingDismiss} />}

      {/* Feature B: Live Weather Card */}
      {showWeather && <WeatherCard onDismiss={() => setShowWeather(false)} />}

      {/* Feature E: Exam Countdown Card */}
      {showExamCountdown && <ExamCountdownCard onDismiss={() => setShowExamCountdown(false)} />}

      {/* Animated neural-network canvas background */}
      <AnimatedBackground />

      {/* Rotating ambient blob */}
      <div
        className="animate-rotate-blob absolute top-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="animate-rotate-blob absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', animationDirection: 'reverse' }}
      />

      {/* ===== Hamburger ===== */}
      <CgMenuRight
        className='text-white absolute top-[20px] right-[20px] w-[28px] h-[28px] cursor-pointer z-20 hover:text-indigo-300 transition-colors'
        onClick={() => setHam(true)}
      />

      {/* ===== Side Menu ===== */}
      <div
        className={`absolute top-0 right-0 w-[280px] h-full backdrop-blur-xl p-[28px] flex flex-col gap-[18px] items-start z-30 transition-transform duration-300 ${ham ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: 'rgba(2,2,30,0.92)', borderLeft: '1px solid rgba(99,102,241,0.3)' }}
      >
        <RxCross1
          className='text-white absolute top-[22px] right-[22px] w-[22px] h-[22px] cursor-pointer hover:text-indigo-300 transition-colors'
          onClick={() => setHam(false)}
        />

        {/* Feature A: Battery Status Pill */}
        {battery && (
          <div
            className="flex items-center gap-[8px] px-3 py-2 rounded-xl w-full"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            <span className="text-[18px]">
              {battery.charging ? '⚡' : battery.level <= 20 ? '🪫' : '🔋'}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-[12px] font-medium">
                  {battery.charging ? 'Charging' : 'Battery'}
                </span>
                <span className="text-[12px] font-bold" style={{ color: battery.level <= 20 ? '#ef4444' : battery.level <= 50 ? '#f59e0b' : '#22c55e' }}>
                  {battery.level}%
                </span>
              </div>
              <div className="w-full h-[4px] rounded-full" style={{ background: 'rgba(99,102,241,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${battery.level}%`,
                    background: battery.level <= 20 ? '#ef4444' : battery.level <= 50 ? '#f59e0b' : '#22c55e',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* User info */}
        <div className='mt-[10px] mb-[4px]'>
          <p className='text-gray-400 text-[13px]'>Signed in as</p>
          <p className='text-white font-semibold text-[16px]'>{userData?.name}</p>
        </div>

        <div className='w-full h-[1px]' style={{ background: 'rgba(99,102,241,0.3)' }} />

        <button
          className='shimmer-btn w-full h-[48px] text-[#1e1b4b] font-semibold rounded-xl text-[15px]'
          onClick={handleLogOut}
        >🚪 Log Out</button>
        <button
          className='shimmer-btn w-full h-[48px] text-[#1e1b4b] font-semibold rounded-xl text-[15px]'
          onClick={() => navigate("/customize")}
        >✨ Customize Assistant</button>

        <div className='w-full h-[1px]' style={{ background: 'rgba(99,102,241,0.3)' }} />

        {/* Language Picker */}
        <LanguagePicker current={lang} onChange={(l) => {
          changeLang(l)
          if (recognitionRef.current) {
            try {
              recognitionRef.current.lang = l
              recognitionRef.current.stop()
            } catch (e) { }
          }
          const label = LANGUAGES.find(x => x.code === l)?.label || l
          toast.success(`🌐 Language switched to ${label}`)
        }} />

        <div className='w-full h-[1px]' style={{ background: 'rgba(99,102,241,0.3)' }} />

        {/* History header + Clear button */}
        <div className='flex items-center justify-between w-full'>
          <h2 className='text-white font-semibold text-[15px] neon-text'>💬 History</h2>
          <div className='flex items-center gap-2'>
            <span className='text-indigo-400 text-[12px]'>
              {userData.history?.filter(h => h?.command).length || 0} chats
            </span>
            <button
              onClick={async () => {
                const ok = await clearHistory()
                if (ok) { setConversationHistory([]); toast.success('History cleared') }
                else toast.error('Failed to clear history')
              }}
              className='text-[11px] px-2 py-[2px] rounded-md text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors'
            >🗑 Clear</button>
          </div>
        </div>

        {/* Feature C: Export buttons */}
        <div className='flex gap-2 w-full'>
          <button
            className='flex-1 text-[11px] py-[6px] rounded-lg font-medium transition-all'
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
            onClick={() => {
              const history = userData.history || []
              downloadJSON(history, 'nova_history.json')
              toast.success('📥 History exported!')
            }}
          >📥 Export History</button>
          <button
            className='flex-1 text-[11px] py-[6px] rounded-lg font-medium transition-all'
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
            onClick={() => {
              try {
                const raw = localStorage.getItem('nova_notes')
                const notes = raw ? JSON.parse(raw) : {}
                downloadJSON(notes, 'nova_notes.json')
                toast.success('📥 Notes exported!')
              } catch { toast.error('No notes to export') }
            }}
          >📥 Export Notes</button>
        </div>

        {/* History list */}
        <div className='w-full flex-1 overflow-y-auto flex flex-col gap-[10px] pb-2'>
          {(() => {
            const items = (userData.history || [])
              .filter(h => h?.command)
              .slice()
              .reverse()
            if (items.length === 0) return (
              <div className='flex flex-col items-center gap-2 mt-4'>
                <span className='text-[28px]'>🤖</span>
                <p className='text-gray-500 text-[13px] text-center'>No conversations yet.<br />Say "Hey Nova" to start!</p>
              </div>
            )
            return items.map((his, i) => {
              const ts = his.timestamp ? new Date(his.timestamp) : null
              let timeLabel = ''
              if (ts) {
                const diff = Math.floor((Date.now() - ts) / 1000)
                if (diff < 60) timeLabel = 'just now'
                else if (diff < 3600) timeLabel = `${Math.floor(diff / 60)} min ago`
                else if (diff < 86400) timeLabel = `${Math.floor(diff / 3600)}h ago`
                else timeLabel = ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              }
              const typeIcons = {
                'google-search': '🔍', 'youtube-search': '▶️', 'youtube-play': '🎵',
                'get-time': '🕐', 'get-date': '📅', 'get-day': '📆', 'get-month': '🗓',
                'calculator-open': '🧮', 'instagram-open': '📷', 'facebook-open': '👤',
                'weather-show': '🌤', 'general': '💬', 'translate': '🌍',
                'note-save': '📝', 'note-recall': '🧠',
              }
              const icon = typeIcons[his.type] || '💬'
              return (
                <div
                  key={i}
                  className='flex flex-col gap-[5px] px-[12px] py-[10px] rounded-xl cursor-pointer transition-all'
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.18)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                >
                  <div className='flex items-center gap-[7px]'>
                    <span className='text-[14px] flex-shrink-0'>{icon}</span>
                    <p className='text-white text-[13px] font-medium truncate flex-1'>{his.command}</p>
                  </div>
                  {his.response && (
                    <p className='text-gray-400 text-[11px] truncate pl-[21px] leading-relaxed'>
                      {his.response}
                    </p>
                  )}
                  {timeLabel && (
                    <p className='text-[10px] pl-[21px]' style={{ color: '#6366f1' }}>{timeLabel}</p>
                  )}
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* ===== Assistant Avatar with Breathing Ring ===== */}
      <div className="relative animate-float">
        {/* Outer shadow glow */}
        <div className={`avatar-breathing-shadow ${isProcessing ? 'thinking' : isSpeakingState ? 'speaking' : ''}`} />
        {/* Spinning conic-gradient ring */}
        <div className={`avatar-breathing-ring ${isProcessing ? 'thinking' : isSpeakingState ? 'speaking' : ''}`} />
        {/* Avatar card */}
        <div
          className="relative w-[220px] h-[300px] flex justify-center items-center overflow-hidden rounded-3xl"
          style={{ border: '1px solid rgba(129,140,248,0.3)' }}
        >
          <img src={userData?.assistantImage} alt="assistant" className='h-full w-full object-cover' />
          <div
            className="absolute bottom-0 left-0 right-0 h-[60px]"
            style={{ background: 'linear-gradient(to top, rgba(2,2,16,0.8), transparent)' }}
          />
          {/* Status indicator on avatar */}
          {isProcessing && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)', animation: 'breathe 1.2s ease-in-out infinite' }}
            >Thinking…</div>
          )}
          {isSpeakingState && !isProcessing && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', animation: 'breathe 0.8s ease-in-out infinite' }}
            >Speaking…</div>
          )}
        </div>
      </div>

      {/* Assistant name */}
      <h1
        className='animated-gradient-text text-[20px] font-bold animate-fade-up'
        style={{ animationDelay: '0.1s' }}
      >
        I'm {userData?.assistantName}
      </h1>

      {/* ===== Shortcut Chips — always visible ===== */}
      <ShortcutChips
        onChipClick={handleChipClick}
        pinnedChips={userData?.pinnedChips}
        onAddPin={handleAddPin}
        onRemovePin={handleRemovePin}
      />

      {/* ===== Status indicator ===== */}
      <div className="flex flex-col items-center gap-3 min-h-[60px] justify-center w-full">
        {listening && !aiText && (
          <div className="flex flex-col items-center gap-2">
            <MicVisualizer active={listening} />
            <p className="text-indigo-400 text-[12px]" style={{ letterSpacing: '0.08em' }}>🎤 Listening...</p>
          </div>
        )}
        {aiText && (
          <div className="flex flex-col items-center gap-2">
            <WaveForm />
            <button
              id="nova-stop-btn"
              onClick={stopSpeaking}
              title="Stop speaking"
              className="stop-speaking-btn"
            >
              <span className="stop-icon">⏹</span>
              Stop
            </button>
          </div>
        )}
        {!listening && !aiText && (
          <div style={{ height: '32px' }} />
        )}
      </div>

      {/* ===== Text bubble ===== */}
      {(userText || aiText) && (
        <div
          className="animate-fade-up max-w-[80vw] md:max-w-[520px] px-[22px] py-[14px] rounded-2xl text-[15px] font-medium text-center leading-relaxed"
          style={{
            background: aiText
              ? 'linear-gradient(135deg, rgba(67,56,202,0.35), rgba(99,102,241,0.2))'
              : 'rgba(255,255,255,0.07)',
            border: `1px solid ${aiText ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.15)'}`,
            boxShadow: aiText ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
          }}
        >
          {aiText ? (
            <span className={`animated-gradient-text ${!typingDone ? 'typewriter-text' : ''}`}>
              {typedAiText}
            </span>
          ) : (
            <span className="text-gray-200">{userText}</span>
          )}
        </div>
      )}

      {/* ===== Feature 1: Text Input Bar ===== */}
      <form
        onSubmit={handleTextSubmit}
        className="fixed bottom-[20px] left-1/2 -translate-x-1/2 z-20 w-[90vw] max-w-[540px] flex items-center gap-2"
      >
        {/* Feature F: Mic Toggle Button */}
        <button
          type="button"
          title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          onClick={toggleMic}
          className="w-[40px] h-[40px] rounded-full flex-shrink-0 flex items-center justify-center text-[18px] transition-all"
          style={{
            background: micEnabled ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.18)',
            border: micEnabled ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(239,68,68,0.5)',
            boxShadow: micEnabled ? 'none' : '0 0 10px rgba(239,68,68,0.3)',
          }}
        >
          {micEnabled ? '🎤' : '🚫'}
        </button>

        {/* Stop button — shown in input bar when AI is speaking */}
        {isSpeakingState && (
          <button
            type="button"
            id="nova-stop-input-btn"
            onClick={stopSpeaking}
            title="Stop NOVA"
            className="w-[40px] h-[40px] rounded-full flex-shrink-0 flex items-center justify-center text-[16px] transition-all stop-btn-pulse"
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.6)',
              boxShadow: '0 0 12px rgba(239,68,68,0.4)',
              color: '#ef4444',
            }}
          >
            ⏹
          </button>
        )}

        <input
          ref={textInputRef}
          className="text-input-bar flex-1"
          placeholder="Type a command... (Ctrl+K)"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          disabled={isProcessing}
        />
        <button
          type="submit"
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all"
          style={{
            background: textInput.trim() ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            cursor: textInput.trim() ? 'pointer' : 'default',
            boxShadow: textInput.trim() ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      {/* ===== Feature 9: Now Playing Widget ===== */}
      {nowPlaying && (
        <NowPlayingWidget query={nowPlaying.query} onDismiss={() => setNowPlaying(null)} />
      )}

      {/* ===== Tier 3: Timer Widget ===== */}
      {timer && (
        <TimerWidget
          key={timer.totalSeconds + '-' + Date.now()}
          totalSeconds={timer.totalSeconds}
          onDismiss={() => setTimer(null)}
        />
      )}

      {/* ===== Tier 3: Todo Panel ===== */}
      {showTodo && (
        <TodoPanel onDismiss={() => setShowTodo(false)} />
      )}

      {/* ===== Todo toggle button ===== */}
      <button
        className="fixed bottom-[72px] right-[16px] z-20 w-[44px] h-[44px] rounded-full flex items-center justify-center text-[20px] transition-all"
        style={{
          background: showTodo ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: showTodo ? '0 0 14px rgba(99,102,241,0.4)' : 'none',
        }}
        onClick={() => setShowTodo(v => !v)}
        title="My Tasks"
      >📋</button>

      {/* ===== Command Palette ===== */}
      {showCmdPalette && (
        <CommandPalette
          onClose={() => setShowCmdPalette(false)}
          onRunCommand={(cmd) => handleChipClick(cmd)}
          onAction={(action) => {
            if (action === 'todo') setShowTodo(true)
            if (action === 'exam') { setShowExamCountdown(true); setShowCmdPalette(false) }
            if (action === 'clear') {
              clearHistory()
              toast.success('History cleared')
              playSuccess()
            }
          }}
        />
      )}

      {/* ===== Ctrl+P button hint ===== */}
      <button
        className="fixed bottom-[72px] left-[16px] z-20 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#818cf8',
          backdropFilter: 'blur(10px)',
        }}
        onClick={() => { playWhoosh(); setShowCmdPalette(true) }}
        title="Command Palette"
      >
        <span style={{ fontSize: '14px' }}>⚡</span>
        <span className="font-mono text-[10px] opacity-60">Ctrl+P</span>
      </button>

      {/* ===== Toast notifications ===== */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  )
}

export default Home
