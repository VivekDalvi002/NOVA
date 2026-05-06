import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

const Particles = () => (
    <>
        {[...Array(10)].map((_, i) => (
            <div
                key={i}
                className="particle"
                style={{
                    width: Math.random() * 6 + 3,
                    height: Math.random() * 6 + 3,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 12 + 8}s`,
                    animationDelay: `${Math.random() * 7}s`,
                }}
            />
        ))}
    </>
)

function Customize2() {
    const { userData, backendImage, selectedImage, serverUrl, setUserData } = useContext(userDataContext)
    const [assistantName, setAssistantName] = useState(userData?.AssistantName || "")
    const [personality, setPersonality] = useState(userData?.personality || "Friendly")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleUpdateAssistant = async () => {
        setLoading(true)
        try {
            let formData = new FormData()
            formData.append("assistantName", assistantName)
            formData.append("personality", personality)
            if (backendImage) {
                formData.append("assistantImage", backendImage)
            } else {
                formData.append("imageUrl", selectedImage)
            }
            const result = await axios.post(`${serverUrl}/api/user/update`, formData, { withCredentials: true })
            setLoading(false)
            setUserData(result.data)
            navigate("/")
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    return (
        <div
            className='w-full h-[100vh] flex justify-center items-center flex-col p-[24px] relative overflow-hidden'
            style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d0d3a 0%, #020210 70%)' }}
        >
            <Particles />

            {/* Ambient blobs */}
            <div
                className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none animate-rotate-blob"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)' }}
            />

            {/* Back button */}
            <button
                className='absolute top-[24px] left-[24px] flex items-center gap-2 text-gray-300 hover:text-white transition-colors z-10'
                onClick={() => navigate("/customize")}
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '50px', padding: '8px 16px' }}
            >
                <MdKeyboardBackspace className='w-[20px] h-[20px]' />
                <span className="text-[14px] font-medium">Back</span>
            </button>

            {/* Title */}
            <div className="text-center mb-[40px] animate-fade-up z-10">
                <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 text-[13px] text-indigo-300 font-medium"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                    🤖 Almost there...
                </div>
                <h1 className='text-white text-[28px] font-semibold'>
                    Name Your{' '}
                    <span style={{ background: 'linear-gradient(90deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Assistant
                    </span>
                </h1>
                <p className='text-gray-400 text-[15px] mt-2'>Give your AI companion a unique name</p>
            </div>

            {/* Input */}
            <div className="w-full max-w-[520px] z-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <input
                    type="text"
                    placeholder='e.g. Nova, Aria, Jarvis...'
                    className='input-glow w-full h-[58px] bg-transparent text-white placeholder-gray-400 px-[24px] rounded-2xl text-[18px]'
                    style={{
                        border: '1px solid rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.08)',
                        transition: 'all 0.3s ease',
                    }}
                    required
                    onChange={(e) => setAssistantName(e.target.value)}
                    value={assistantName}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && assistantName.trim()) {
                            handleUpdateAssistant()
                        }
                    }}
                />
            </div>

            {/* Personality Picker */}
            <div className="w-full max-w-[520px] mt-[24px] z-10 animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <p className='text-gray-400 text-[13px] uppercase tracking-widest mb-3 pl-2'>🎙 Select Personality</p>
                <div className='flex flex-wrap gap-3'>
                    {['Professional', 'Friendly', 'Funny', 'Strict'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPersonality(p)}
                            className='flex-1 min-w-[110px] py-[12px] rounded-xl text-[14px] font-medium transition-all'
                            style={{
                                background: personality === p ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
                                border: `1px solid ${personality === p ? '#818cf8' : 'rgba(99,102,241,0.2)'}`,
                                color: personality === p ? 'white' : '#94a3b8',
                                transform: personality === p ? 'scale(1.02)' : 'scale(1)',
                            }}
                        >
                            {p === 'Professional' && '👔 '}
                            {p === 'Friendly' && '😊 '}
                            {p === 'Funny' && '😂 '}
                            {p === 'Strict' && '🧐 '}
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create button */}
            {assistantName && (
                <button
                    className='shimmer-btn min-w-[260px] h-[54px] mt-[28px] text-[#1e1b4b] font-semibold rounded-full text-[17px] z-10 animate-fade-up flex items-center justify-center gap-2'
                    style={{ animationDelay: '0.2s' }}
                    disabled={loading}
                    onClick={handleUpdateAssistant}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
                            </svg>
                            Creating...
                        </span>
                    ) : (
                        <span>✨ Create My Assistant</span>
                    )}
                </button>
            )}
        </div>
    )
}

export default Customize2