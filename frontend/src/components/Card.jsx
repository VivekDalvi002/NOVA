import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext'

function Card({ image }) {
  const { selectedImage, setSelectedImage, setBackendImage, setFrontendImage } = useContext(userDataContext)
  const isSelected = selectedImage === image

  return (
    <div
      onClick={() => { setSelectedImage(image); setBackendImage(null); setFrontendImage(null) }}
      className="relative w-[70px] h-[140px] lg:w-[150px] lg:h-[250px] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: isSelected ? '2px solid #818cf8' : '2px solid rgba(99,102,241,0.3)',
        boxShadow: isSelected
          ? '0 0 24px rgba(99,102,241,0.7), 0 0 50px rgba(99,102,241,0.3)'
          : '0 4px 16px rgba(0,0,0,0.5)',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        background: '#020220',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1.06)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(67,56,202,0.25)'
          e.currentTarget.style.borderColor = 'rgba(129,140,248,0.7)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
        }
      }}
    >
      <img src={image} className='h-full w-full object-cover' alt="assistant option" />
      {/* Selected shimmer overlay */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, transparent 60%, rgba(99,102,241,0.1) 100%)',
          }}
        />
      )}
      {/* Selected check badge */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.8)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default Card
