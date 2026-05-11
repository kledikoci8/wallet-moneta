import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";
import goalsRoute from "./routes/goalsRoute.js";
import chatRoute from "./routes/chatRoute.js";
import budgetsRoute from "./routes/budgetsRoute.js";
import usersRoute from "./routes/usersRoute.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();


if (process.env.NODE_ENV === "production") job.start(); //start the cron job

//qe t marrim vlerat tek api transactions(try) duhet t perdorim middleware
// Temporarily disable rate limiter if Upstash is having issues
// app.use(rateLimiter);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;


app.get("/api/health",(req,res) => {
    res.status(200).send("It's working");
});


// we should have a route for health check 
app.get("/health",(req,res) => {
    res.send("It's working");
});


app.use("/api/transactions", transactionsRoute);
app.use("/api/products", transactionsRoute);
app.use("/api/goals", goalsRoute);
app.use("/api/chat", chatRoute);
app.use("/api/budgets", budgetsRoute);
app.use("/api/users", usersRoute);

initDB().then(()=> {
app.listen(PORT, () => {
    console.log("Server is up and running on PORT:",PORT);
});
});