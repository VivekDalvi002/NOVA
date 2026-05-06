import mongoose from "mongoose"

const connectDb = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 10000,   // 10s to select server
            socketTimeoutMS: 45000,             // 45s socket timeout
            family: 4,                          // Force IPv4 — fixes ESERVFAIL DNS issues
        })
        console.log("✅ DB connected")
    } catch (error) {
        console.error(`❌ DB connection failed: ${error.message}`)
        if (retries > 0) {
            const delay = (6 - retries) * 3000  // 3s, 6s, 9s... backoff
            console.log(`🔄 Retrying in ${delay / 1000}s... (${retries} attempts left)`)
            setTimeout(() => connectDb(retries - 1), delay)
        } else {
            console.error("💥 All DB connection attempts failed. Server running without DB.")
        }
    }
}

export default connectDb
