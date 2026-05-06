import React, { useContext, useState } from 'react'
import bg from "../assets/authBg.png"
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"

const Particles = () => (
  <>
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          width: Math.random() * 5 + 3,
          height: Math.random() * 5 + 3,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 10 + 8}s`,
          animationDelay: `${Math.random() * 6}s`,
        }}
      />
    ))}
  </>
)

function SignUp() {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")

  const handleSignUp = async (e) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      let result = await axios.post(`${serverUrl}/api/auth/signup`, { name, email, password }, { withCredentials: true })
      setUserData(result.data)
      setLoading(false)
      navigate("/customize")
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
      <div className="absolute inset-0" style={{ background: 'rgba(2,2,20,0.72)' }} />
      <Particles />
      <div
        className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full pointer-events-none animate-rotate-blob"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.14), transparent 70%)' }}
      />

      <form
        className='glass-card w-[90%] max-w-[460px] flex flex-col items-center gap-[16px] px-[32px] py-[44px] rounded-3xl z-10 animate-fade-up'
        onSubmit={handleSignUp}
      >
        <div
          className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mb-[4px]"
          style={{ background: 'linear-gradient(135deg,#6366f1,#3730a3)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>

        <h1 className='text-white text-[24px] font-semibold text-center leading-tight mb-[4px]'>
          Create your{' '}
          <span style={{ background: 'linear-gradient(90deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NOVA
          </span>{' '}Account
        </h1>

        <input
          type="text"
          placeholder='Your name'
          className='input-glow w-full h-[50px] bg-transparent text-white placeholder-gray-400 px-[20px] rounded-xl text-[15px]'
          style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.07)' }}
          required
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <input
          type="email"
          placeholder='Email address'
          className='input-glow w-full h-[50px] bg-transparent text-white placeholder-gray-400 px-[20px] rounded-xl text-[15px]'
          style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.07)' }}
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <div
          className='w-full h-[50px] text-white rounded-xl text-[15px] relative'
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

        {err.length > 0 && <p className='text-red-400 text-[14px] w-full px-1'>⚠ {err}</p>}

        <button
          className='shimmer-btn w-full h-[52px] mt-[6px] text-[#1e1b4b] font-semibold rounded-xl text-[17px]'
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
              </svg>
              Creating account...
            </span>
          ) : 'Create Account'}
        </button>

        <p className='text-gray-400 text-[15px] cursor-pointer' onClick={() => navigate("/signin")}>
          Already have an account?{' '}
          <span style={{ color: '#818cf8' }} className="hover:underline font-medium">Sign In</span>
        </p>
      </form>
    </div>
  )
}

export default SignUp
