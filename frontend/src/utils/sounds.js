// ── NOVA Sound Effects Engine ──────────────────────────────────────────────────
// Generates premium micro-sounds using the Web Audio API (no audio files needed)

const AudioCtxClass = window.AudioContext || window.webkitAudioContext
let ctx = null

function getCtx() {
  if (!ctx) {
    ctx = new AudioCtxClass()
  }
  // Try to resume if it was created in a suspended state (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

// Soft click — for button presses (like Apple's tap sound)
export function playClick() {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1800, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.06)
    gain.gain.setValueAtTime(0.08, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.08)
  } catch {}
}

// Gentle chime — AI response received (like Notion notification)
export function playChime() {
  try {
    const c = getCtx()
    const notes = [880, 1108.73, 1318.51] // A5 → C#6 → E6 (A major triad ascending)
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = c.currentTime + i * 0.09
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.06, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.35)
    })
  } catch {}
}

// Soft whoosh — for slide/swipe transitions
export function playWhoosh() {
  try {
    const c = getCtx()
    const bufferSize = c.sampleRate * 0.15
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5
    }
    const source = c.createBufferSource()
    source.buffer = buffer
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1200, c.currentTime)
    filter.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.15)
    filter.Q.value = 1.5
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.12, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
    source.connect(filter).connect(gain).connect(c.destination)
    source.start()
    source.stop(c.currentTime + 0.15)
  } catch {}
}

// Success ping — for completed actions (timer done, note saved)
export function playSuccess() {
  try {
    const c = getCtx()
    const notes = [784, 988, 1175] // G5 → B5 → D6 (uplifting)
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = c.currentTime + i * 0.1
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  } catch {}
}

// Error blip — for error states
export function playError() {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(280, c.currentTime)
    osc.frequency.linearRampToValueAtTime(200, c.currentTime + 0.15)
    gain.gain.setValueAtTime(0.04, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.15)
  } catch {}
}
