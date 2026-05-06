import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant, clearHistory, updatePinnedChips } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant)
userRouter.post("/asktoassistant", isAuth, askToAssistant)
userRouter.delete("/history", isAuth, clearHistory)
userRouter.post("/pinned-chips", isAuth, updatePinnedChips)

export default userRouter
