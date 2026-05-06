import uploadOnCloudinary from "../config/cloudinary.js"
import groqResponse, { GroqRateLimitError } from "../groq.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
// import moment from "moment"

export const getCurrentUser = async (req, res) => {
   try {
      const userId = req.userId
      const user = await User.findById(userId).select("-password")
      if (!user) {
         return res.status(400).json({ message: "user not found" })
      }
      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "get current user error" })
   }
}

export const updateAssistant = async (req, res) => {
   try {
      const { assistantName, imageUrl, personality } = req.body
      let assistantImage;
      if (req.file) {
         assistantImage = await uploadOnCloudinary(req.file.path)
      } else {
         assistantImage = imageUrl
      }

      const user = await User.findByIdAndUpdate(req.userId, {
         assistantName, assistantImage, personality
      }, { new: true }).select("-password")
      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "updateAssistantError user error" })
   }
}

// ── Pinned Chips CRUD ────────────────────────────────────────────────────────
export const updatePinnedChips = async (req, res) => {
   try {
      const { pinnedChips } = req.body  // expects full array [{label, cmd}]
      if (!Array.isArray(pinnedChips)) {
         return res.status(400).json({ message: "pinnedChips must be an array" })
      }
      // Limit to 10 custom chips max
      const limited = pinnedChips.slice(0, 10)
      const user = await User.findByIdAndUpdate(
         req.userId,
         { pinnedChips: limited },
         { new: true }
      ).select("-password")
      return res.json(user)
   } catch (error) {
      console.error("updatePinnedChips error:", error.message)
      return res.status(500).json({ message: "Failed to update pinned chips" })
   }
}

// ── Ask the assistant ────────────────────────────────────────────────────────
export const askToAssistant = async (req, res) => {
   try {
      const { command, lang, conversationHistory } = req.body
      if (!command) {
         return res.status(400).json({ response: "No command provided." })
      }

      // Lean query: only fetch fields needed for the AI call (skip history/password)
      const user = await User.findById(req.userId).select('name assistantName notes').lean();
      if (!user) {
         return res.status(400).json({ response: "User not found." })
      }

      const userName = user.name
      const assistantName = user.assistantName
      const userNotes = user.notes || []
      const language = lang || 'en-IN'
      const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : []

      let result;
      try {
         result = await groqResponse(command, assistantName, userName, userNotes, language, history)
      } catch (groqErr) {
         if (groqErr.isGroqRateLimit) {
            console.warn("⚡ All Groq keys rate-limited, falling back to Gemini...")
            try {
               result = await geminiResponse(command, assistantName, userName)
            } catch (geminiErr) {
               console.error("Gemini fallback also failed:", geminiErr.message)
               return res.status(500).json({ response: "Sorry, all AI services are temporarily busy. Please try again in a moment." })
            }
         } else {
            console.error("API call failed:", groqErr.message)
            return res.status(500).json({ response: "Sorry, the AI service is temporarily unavailable. Please try again." })
         }
      }

      if (!result) {
         console.error("API returned empty result");
         return res.status(500).json({ response: "Sorry, I couldn't process your request. Please try again." })
      }

      // Clean the result — remove markdown code fences if present
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```')) {
         cleanResult = cleanResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const jsonMatch = cleanResult.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
         console.error("Could not parse JSON from API response:", result);
         return res.json({
            type: 'general',
            userInput: command,
            response: cleanResult.substring(0, 200)
         })
      }

      let gemResult;
      try {
         gemResult = JSON.parse(jsonMatch[0])
      } catch (parseError) {
         console.error("JSON parse error:", parseError.message, "Raw:", jsonMatch[0]);
         let rawText = cleanResult.replace(/["'{}]/g, '').trim();
         if (rawText.length > 250) rawText = rawText.substring(0, 250) + "...";
         gemResult = {
            type: 'general',
            userInput: command,
            response: rawText || "I processed your request but had trouble formatting the response."
         }
      }

      console.log("Parsed result:", gemResult)
      const type = gemResult.type || 'general'

      // Helper: save history entry (fire-and-forget — don't block response)
      // Since we used .lean() above, we need a direct DB update
      const saveHistory = (finalType, finalResponse) => {
         User.findByIdAndUpdate(req.userId, {
            $push: {
               history: {
                  $each: [{ command, response: finalResponse, type: finalType, timestamp: new Date() }],
                  $slice: -50
               }
            }
         }).catch(err => console.warn('History save error:', err.message))
      }

      switch (type) {
         case 'get-date': {
            const resp = `current date is ${moment().format("YYYY-MM-DD")}`
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         case 'get-time': {
            const resp = `current time is ${moment().format("hh:mm A")}`
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         case 'get-day': {
            const resp = `today is ${moment().format("dddd")}`
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         case 'get-month': {
            const resp = `current month is ${moment().format("MMMM")}`
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         // ── Note Save ──
         case 'note-save': {
            const noteKey = gemResult.noteKey || command
            const noteValue = gemResult.noteValue || ""
            if (noteKey && noteValue) {
               // Update existing note or add new
               const existingIdx = user.notes.findIndex(n => n.key.toLowerCase() === noteKey.toLowerCase())
               if (existingIdx >= 0) {
                  user.notes[existingIdx].value = noteValue
                  user.notes[existingIdx].createdAt = new Date()
               } else {
                  user.notes.push({ key: noteKey, value: noteValue, createdAt: new Date() })
               }
               if (user.notes.length > 50) user.notes = user.notes.slice(-50)
               user.markModified('notes')
            }
            const resp = gemResult.response || `Got it, I'll remember that.`
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         // ── Note Recall ──
         case 'note-recall': {
            const resp = gemResult.response || "I don't have that saved."
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         // ── Translate ──
         case 'translator': {
            const resp = gemResult.response || "Sorry, I couldn't translate that."
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         // ── Reminder ──
         case 'reminder-set': {
            const resp = gemResult.response || "Reminder set!"
            const reminderMs = gemResult.reminderMs || 0
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp, reminderMs })
         }
         case 'google-search':
         case 'youtube-search':
         case 'youtube-play':
         case 'general':
         case "calculator-open":
         case "instagram-open":
         case "facebook-open":
         case "weather-show": {
            const resp = gemResult.response || "Done!"
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp });
         }
         // ── Tier 3: Timer ──
         case 'timer-start': {
            const resp = gemResult.response || "Timer started!"
            const timerSeconds = parseInt(gemResult.timerSeconds) || 60
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp, timerSeconds })
         }
         // ── Tier 3: Todo ──
         case 'todo-add': {
            const resp = gemResult.response || "Added to your list!"
            const todoItem = gemResult.todoItem || gemResult.userInput || command
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp, todoItem })
         }
         case 'todo-read': {
            const resp = gemResult.response || "Here's your list!"
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp })
         }
         case 'todo-clear': {
            const resp = gemResult.response || "List cleared!"
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp })
         }
         // ── Tier 3: Open URL ──
         case 'open-url': {
            const resp = gemResult.response || "Opening that for you!"
            const url = gemResult.url || ''
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp, url })
         }
         // ── Voice Change ──
         case 'voice-change': {
            const resp = gemResult.response || "Voice changed!"
            saveHistory(type, resp)
            return res.json({ type, userInput: gemResult.userInput || command, response: resp, voiceGender: gemResult.voiceGender })
         }
         default: {
            const resp = gemResult.response || "I processed your request."
            saveHistory('general', resp)
            return res.json({ type: 'general', userInput: gemResult.userInput || command, response: resp })
         }
      }

   } catch (error) {
      console.error("askToAssistant error:", error.message || error);
      return res.status(500).json({ response: "Something went wrong. Please try again." })
   }
}

// ── Clear conversation history ──────────────────────────────────────────────
export const clearHistory = async (req, res) => {
   try {
      const user = await User.findById(req.userId)
      if (!user) return res.status(404).json({ message: 'User not found' })
      user.history = []
      user.markModified('history')
      await user.save()
      return res.json({ message: 'History cleared' })
   } catch (error) {
      console.error('clearHistory error:', error.message)
      return res.status(500).json({ message: 'Failed to clear history' })
   }
}