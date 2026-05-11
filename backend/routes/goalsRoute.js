import express from "express";
import {
  getGoalsByUserId,
  createGoal,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
  getSavingsTips,
  getGoalContributions,
} from "../config/controllers/goalsController.js";

const router = express.Router();

router.get("/tips/:userId", getSavingsTips);
router.get("/contributions/:goalId", getGoalContributions);
router.get("/:userId", getGoalsByUserId);
router.post("/", createGoal);
router.put("/progress/:id", updateGoalProgress);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router;
