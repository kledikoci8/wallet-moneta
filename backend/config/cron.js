import cron from "cron";
import https from "https";
import { processRecurringTransactions } from "./controllers/transactionsController.js";

const keepAliveJob = new cron.CronJob("*/14 * * * *", function () {
  if (!process.env.API_URL) return;
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

const recurringJob = new cron.CronJob("5 0 * * *", function () {
  processRecurringTransactions().catch((e) =>
    console.error("Recurring cron error", e)
  );
});

export default {
  start() {
    keepAliveJob.start();
    recurringJob.start();
  },
};
