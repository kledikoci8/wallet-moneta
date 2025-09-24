import express from "express"
import { sql } from "../config/db.js";
import { createTransaction, deleteTransaction, getSummaryByUserId, getTransactionsByUserId } from "../config/controllers/transactionsController.js";
// krijojme router
const router = express.Router()

//kur i kishim tek server.js i kishim me app.post ose app.get ose app.delete
// ne vend te /api/transactions=>psh mund te vendosim edhe vetem / per shkak te app.use("/api/transactions", transactionsRoute); ne server.js
router.get("/:userId",getTransactionsByUserId);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);
router.get("/summary/:userId",getSummaryByUserId);
     
export default router