import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
export const userDataContext = createContext()
function UserContext({ children }) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"
  const [userData, setUserData] = useState(null)
  const [frontendImage, setFrontendImage] = useState(null)
  const [backendImage, setBackendImage] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
      setUserData(result.data)
    } catch (error) {
      // 400 = no token / not logged in — expected, skip silently
      if (error?.response?.status !== 400) {
        console.error('UserContext error:', error)
      }
    }
  }

  const getGeminiResponse = async (command, lang = 'en-US', conversationHistory = []) => {
    try {
      const result = await axios.post(`${serverUrl}/api/user/asktoassistant`, { command, lang, conversationHistory }, { withCredentials: true })
      return result.data
    } catch (error) {
      console.log(error)
      if (error.response?.data) return error.response.data
      return { type: 'general', userInput: command, response: "Sorry, something went wrong. Please try again." }
    }
  }

  const clearHistory = async () => {
    try {
      await axios.delete(`${serverUrl}/api/user/history`, { withCredentials: true })
      setUserData(prev => ({ ...prev, history: [] }))
      return true
    } catch (error) {
      console.log('clearHistory error:', error)
      return false
    }
  }

  const updatePinnedChips = async (chips) => {
    try {
      const result = await axios.post(`${serverUrl}/api/user/pinned-chips`, { pinnedChips: chips }, { withCredentials: true })
      setUserData(prev => ({ ...prev, pinnedChips: result.data.pinnedChips }))
      return true
    } catch (error) {
      console.log('updatePinnedChips error:', error)
      return false
    }
  }

  useEffect(() => {
    handleCurrentUser()
  }, [])
  const value = {
    serverUrl, userData, setUserData, backendImage, setBackendImage, frontendImage, setFrontendImage, selectedImage, setSelectedImage, getGeminiResponse, clearHistory, updatePinnedChips
  }
  return (
    <div>
      <userDataContext.Provider value={value}>
        {children}
      </userDataContext.Provider>
    </div>
  )
}

export default UserContext
