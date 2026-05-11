import express from "express";
import { chat, getSuggestions } from "../config/controllers/chatController.js";

const router = express.Router();

router.post("/", chat);
router.get("/suggestions/:userId", getSuggestions);

export default router;
