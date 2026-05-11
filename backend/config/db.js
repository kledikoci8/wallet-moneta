import { neon } from "@neondatabase/serverless";

import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL);

async function migrateTransactionsColumns() {
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence_interval VARCHAR(20)`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_due_date DATE`;
}

export async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
       id SERIAL PRIMARY KEY,
       user_id VARCHAR(255) NOT NULL,
       title VARCHAR(255) NOT NULL,
       amount DECIMAL(10,2) NOT NULL,
       category VARCHAR(255) NOT NULL,
       created_at DATE NOT NULL DEFAULT CURRENT_DATE
     )`;

    await migrateTransactionsColumns();

    await sql`CREATE TABLE IF NOT EXISTS goals(
       id SERIAL PRIMARY KEY,
       user_id VARCHAR(255) NOT NULL,
       title VARCHAR(255) NOT NULL,
       target_amount DECIMAL(10,2) NOT NULL,
       current_amount DECIMAL(10,2) DEFAULT 0,
       deadline DATE,
       category VARCHAR(100),
       icon VARCHAR(50) DEFAULT 'flag',
       color VARCHAR(20) DEFAULT '#2E7D32',
       created_at TIMESTAMP DEFAULT NOW(),
       completed BOOLEAN DEFAULT FALSE
     )`;

    await sql`CREATE TABLE IF NOT EXISTS goal_contributions(
       id SERIAL PRIMARY KEY,
       goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
       user_id VARCHAR(255) NOT NULL,
       amount DECIMAL(10,2) NOT NULL,
       note VARCHAR(255),
       contributed_at TIMESTAMP DEFAULT NOW()
     )`;

    await sql`CREATE TABLE IF NOT EXISTS budgets(
       id SERIAL PRIMARY KEY,
       user_id VARCHAR(255) NOT NULL,
       category VARCHAR(255) NOT NULL,
       limit_amount DECIMAL(10,2) NOT NULL,
       month INTEGER NOT NULL,
       year INTEGER NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (user_id, category, month, year)
     )`;

    console.log("Database initialized saksesfull");
  } catch (error) {
    console.error("Error initializing DB", error);
    process.exit(1);
  }
}
