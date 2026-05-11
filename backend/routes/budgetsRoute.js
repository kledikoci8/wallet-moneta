import express from "express";
import {
  getBudgetsByUser,
  upsertBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
} from "../config/controllers/budgetsController.js";

const router = express.Router();

router.get("/status/:userId", getBudgetStatus);
router.get("/:userId", getBudgetsByUser);
router.post("/", upsertBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
