import axios from "axios"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read college info ONCE at startup
let collegeInfo = ""
try {
    const raw = fs.readFileSync(path.join(__dirname, "aec.md"), "utf-8")
    collegeInfo = raw.length > 800 ? raw.substring(0, 800) + "\n...(truncated)" : raw
} catch {
    console.warn("aec.md not found, proceeding without college info")
}

// ── Load all available Groq API keys ─────────────────────────────────────────
const getApiKeys = () => {
    const keys = []
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY)
    let i = 1
    while (process.env[`GROQ_API_KEY_${i}`]) {
        const k = process.env[`GROQ_API_KEY_${i}`]
        if (!keys.includes(k)) keys.push(k)
        i++
    }
    return keys
}

const MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]

export class GroqRateLimitError extends Error {
    constructor() { super("All Groq API keys and models are rate-limited"); this.isGroqRateLimit = true }
}

const callGroq = async (apiKey, model, systemPrompt, command) => {
    const result = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: command }
            ],
            temperature: 0.5,
            max_tokens: 200
        },
        {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 10000
        }
    )
    const text = result.data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Empty response from Groq")
    return text
}

const groqResponse = async (command, assistantName, userName, userNotes = [], lang = 'en-IN', conversationHistory = []) => {
    const apiKeys = getApiKeys()
    if (apiKeys.length === 0) throw new Error("No GROQ_API_KEY(s) set in .env")

    // Build a notes summary for recall context
    let notesContext = ""
    if (userNotes.length > 0) {
        notesContext = "\n\nUSER'S SAVED NOTES (use these to answer recall questions):\n" +
            userNotes.map(n => `- ${n.key}: ${n.value}`).join("\n")
    }

    // Current date/time context so AI can answer time-based questions accurately
    const now = new Date()
    const timeContext = `\n\nCURRENT DATE & TIME: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST`

    // Map lang code → human-readable name for the AI
    const LANG_NAMES = {
        'en-US': 'English', 'en-IN': 'English', 'en-GB': 'English',
        'hi-IN': 'Hindi', 'mr-IN': 'Marathi', 'es-ES': 'Spanish',
        'fr-FR': 'French', 'de-DE': 'German', 'ja-JP': 'Japanese',
    }
    const responseLang = LANG_NAMES[lang] || 'English'
    const langInstruction = responseLang === 'English'
        ? ''
        : `\n\n⚠️ CRITICAL: The user speaks ${responseLang}. You MUST write the "response" field entirely in ${responseLang}. Do not use English in the response field. Only JSON keys stay in English.`

    const systemPrompt = `You are ${assistantName}, voice assistant by ${userName}. Reply ONLY raw JSON (no markdown):
{"type":"<type>","userInput":"<input>","response":"<1 sentence max>","noteKey":"","noteValue":"","voiceGender":"","timerSeconds":0,"todoItem":"","url":""}

Types: general|google-search|youtube-search|youtube-play|get-time|get-date|get-day|get-month|calculator-open|instagram-open|facebook-open|weather-show|translator|note-save|note-recall|reminder-set|voice-change|timer-start|todo-add|todo-read|todo-clear|open-url|exam-countdown

Rules: Math/facts→general,compute yourself. Jokes→general. Translation→translator. Creator→${userName}. College→use info below. Use history for context.
${collegeInfo ? 'COLLEGE:' + collegeInfo : ''}${notesContext}${timeContext}${langInstruction}`

    // Build messages: system + conversation history + current command
    const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-4),  // last 4 turns for speed
        { role: "user", content: command }
    ]

    for (const model of MODELS) {
        for (const apiKey of apiKeys) {
            try {
                const result = await axios.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        model,
                        messages,
                        temperature: 0.5,
                        max_tokens: 150
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 6000
                    }
                )
                const text = result.data?.choices?.[0]?.message?.content
                if (!text) throw new Error("Empty response from Groq")
                console.log(`✅ Groq success [model=${model}, key=...${apiKey.slice(-6)}]`)
                return text
            } catch (err) {
                const status = err.response?.status
                const isRateLimit = status === 429 || status === 503
                if (isRateLimit) {
                    console.warn(`⚠️  Rate limited [model=${model}, key=...${apiKey.slice(-6)}] — trying next key/model...`)
                    continue
                }
                console.warn(`⚠️  Groq error [${status || err.message}] on key ...${apiKey.slice(-6)}, trying next...`)
            }
        }
    }

    throw new GroqRateLimitError()
}

export default groqResponse
