import { sql } from "../db.js";

export async function deleteUserData(req, res) {
  try {
    const { userId } = req.params;

    await sql`DELETE FROM goal_contributions WHERE user_id = ${userId}`;
    await sql`DELETE FROM goals WHERE user_id = ${userId}`;
    await sql`DELETE FROM budgets WHERE user_id = ${userId}`;
    await sql`DELETE FROM transactions WHERE user_id = ${userId}`;

    res.status(200).json({ message: "All user data deleted" });
  } catch (error) {
    console.error("deleteUserData", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
