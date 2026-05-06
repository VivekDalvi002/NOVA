import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    assistantName: {
        type: String
    },
    assistantImage: {
        type: String
    },
    personality: {
        type: String,
        default: 'Friendly',
        enum: ['Professional', 'Friendly', 'Funny', 'Strict']
    },
    history: [
        {
            command: { type: String },
            response: { type: String },
            type: { type: String, default: 'general' },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    pinnedChips: [
        {
            label: { type: String, required: true },
            cmd: { type: String, required: true }
        }
    ],
    notes: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]

}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User