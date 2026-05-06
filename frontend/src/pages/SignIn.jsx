import React, { useContext, useState } from 'react'
import bg from "../assets/authBg.png"
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"

// Floating particles component
const Particles = () => (
  <>
    {[...Array(10)].map((_, i) => {
      const size = Math.random() * 5 + 3
      return (
        <div
          key={i}
          className="particle"
          style={{
            width: size,
            height: size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 8}s`,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      )
    })}
  </>
)

function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      let result = await axios.post(`${serverUrl}/api/auth/signin`, { email, password }, { withCredentials: true })
      setUserData(result.data)
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setUserData(null)
      setLoading(false)
      setErr(error.response.data.message)
    }
  }

  return (
    <div
      className='w-full h-[100vh] flex justify-center items-center relative overflow-hidden'
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(2,2,20,0.72)' }} />
      <Particles />

      {/* Ambient glow */}
      <div
        className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none animate-rotate-blob"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }}
      />

      <form
        className='glass-card w-[90%] max-w-[460px] flex flex-col items-center gap-[18px] px-[32px] py-[48px] rounded-3xl z-10 animate-fade-up'
        onSubmit={handleSignIn}
      >
        {/* Logo mark */}
        <div
          className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mb-[4px]"
          style={{ background: 'linear-gradient(135deg,#6366f1,#3730a3)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>

        <h1 className='text-white text-[26px] font-semibold text-center leading-tight mb-[6px]'>
          Sign In to{' '}
          <span style={{ background: 'linear-gradient(90deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NOVA
          </span>
        </h1>

        <input
          type="email"
          placeholder='Email address'
          className='input-glow w-full h-[52px] bg-transparent text-white placeholder-gray-400 px-[20px] rounded-xl text-[15px] transition-all'
          style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.07)' }}
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <div
          className='w-full h-[52px] text-white rounded-xl text-[15px] relative transition-all'
          style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.07)' }}
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder='Password'
            className='input-glow w-full h-full rounded-xl bg-transparent placeholder-gray-400 px-[20px]'
            required
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <button type="button" className='absolute top-[14px] right-[16px] text-gray-400 hover:text-white transition-colors' onClick={() => setShowPassword(p => !p)}>
            {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
          </button>
        </div>

        {err.length > 0 && (
          <p className='text-red-400 text-[14px] w-full px-1'>⚠ {err}</p>
        )}

        <button
          className='shimmer-btn w-full h-[52px] mt-[8px] text-[#1e1b4b] font-semibold rounded-xl text-[17px]'
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
              </svg>
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>

        <p className='text-gray-400 text-[15px] cursor-pointer' onClick={() => navigate("/signup")}>
          Don't have an account?{' '}
          <span style={{ color: '#818cf8' }} className="hover:underline font-medium">Sign Up</span>
        </p>
      </form>
    </div>
  )
}

export default SignIn
