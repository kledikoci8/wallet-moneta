import express from "express";
import { deleteUserData } from "../config/controllers/usersController.js";

const router = express.Router();

router.delete("/:userId", deleteUserData);

export default router;
