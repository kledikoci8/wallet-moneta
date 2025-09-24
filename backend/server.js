import express from "express";
import dotenv from "dotenv";
import {initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();


if(process.env.NODE_ENV==="production ")job.start(); //start the cron job

//qe t marrim vlerat tek api transactions(try) duhet t perdorim middleware
app.use(rateLimiter);
app.use(express.json());

//our costum simple middleware
//app.use((req,res,next) => {
    // console.log("hey we hit a request, the method is", req.method);
    //next();
    //});

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

initDB().then(()=> {
app.listen(PORT, () => {
    console.log("Server is up and running on PORT:",PORT);
});
});