import React, { useEffect, useState } from 'react'

// Toast types: 'success' | 'error' | 'info' | 'warning'
const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
}

const COLORS = {
    success: { border: 'rgba(34,197,94,0.4)', glow: 'rgba(34,197,94,0.2)', bar: '#22c55e' },
    error: { border: 'rgba(239,68,68,0.4)', glow: 'rgba(239,68,68,0.2)', bar: '#ef4444' },
    warning: { border: 'rgba(234,179,8,0.4)', glow: 'rgba(234,179,8,0.2)', bar: '#eab308' },
    info: { border: 'rgba(99,102,241,0.4)', glow: 'rgba(99,102,241,0.2)', bar: '#6366f1' },
}

// Single Toast item
function ToastItem({ id, message, type = 'info', duration = 3500, onRemove }) {
    const [exiting, setExiting] = useState(false)
    const c = COLORS[type] || COLORS.info

    useEffect(() => {
        const t = setTimeout(() => {
            setExiting(true)
            setTimeout(() => onRemove(id), 350)
        }, duration)
        return () => clearTimeout(t)
    }, [])

    return (
        <div
            onClick={() => { setExiting(true); setTimeout(() => onRemove(id), 350) }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(2,2,30,0.92)',
                border: `1px solid ${c.border}`,
                boxShadow: `0 4px 24px ${c.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
                backdropFilter: 'blur(16px)',
                cursor: 'pointer',
                minWidth: '240px',
                maxWidth: '340px',
                position: 'relative',
                overflow: 'hidden',
                animation: exiting
                    ? 'toastOut 0.35s ease forwards'
                    : 'toastIn 0.35s ease forwards',
                userSelect: 'none',
            }}
        >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{ICONS[type]}</span>
            <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
                {message}
            </p>
            {/* Progress bar */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0,
                height: '2px',
                background: c.bar,
                width: '100%',
                transformOrigin: 'left',
                animation: `toastBar ${duration}ms linear forwards`,
            }} />
        </div>
    )
}

// Toast container — renders all active toasts
export function ToastContainer({ toasts, removeToast }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
        }}>
            {toasts.map(t => (
                <ToastItem key={t.id} {...t} onRemove={removeToast} />
            ))}
        </div>
    )
}

// Hook to manage toasts
export function useToast() {
    const [toasts, setToasts] = useState([])

    const showToast = (message, type = 'info', duration = 3500) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type, duration }])
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return {
        toasts, showToast, removeToast,
        success: (msg, duration) => showToast(msg, 'success', duration),
        error: (msg, duration) => showToast(msg, 'error', duration),
        warning: (msg, duration) => showToast(msg, 'warning', duration),
        info: (msg, duration) => showToast(msg, 'info', duration),
    }
}
