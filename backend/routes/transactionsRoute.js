import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getSummaryByUserId,
  getTransactionsByUserId,
  getAnalyticsByUserId,
  updateTransaction,
  getCategorySpendByMonth,
  getRecurringTransactions,
  exportTransactions,
  getTransactionById,
} from "../config/controllers/transactionsController.js";

const router = express.Router();

router.get("/detail/:id", getTransactionById);
router.get("/export/:userId", exportTransactions);
router.get("/categories/:userId", getCategorySpendByMonth);
router.get("/recurring/:userId", getRecurringTransactions);
router.get("/analytics/:userId", getAnalyticsByUserId);
router.get("/summary/:userId", getSummaryByUserId);
router.put("/:id", updateTransaction);
router.get("/:userId", getTransactionsByUserId);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);

export default router;
