import { sql } from "../db.js";

export async function getBudgetsByUser(req, res) {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    const budgets = await sql`
      SELECT * FROM budgets
      WHERE user_id = ${userId} AND month = ${month} AND year = ${year}
      ORDER BY category ASC
    `;

    const spentRows = await sql`
      SELECT category, COALESCE(ABS(SUM(amount)), 0) as spent
      FROM transactions
      WHERE user_id = ${userId} AND amount < 0
        AND EXTRACT(MONTH FROM created_at::timestamp)::int = ${month}
        AND EXTRACT(YEAR FROM created_at::timestamp)::int = ${year}
      GROUP BY category
    `;
    const spentMap = Object.fromEntries(
      spentRows.map((r) => [r.category, parseFloat(r.spent)])
    );

    const merged = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const limit = parseFloat(b.limit_amount);
      const remaining = limit - spent;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      let status = "ok";
      if (pct > 100) status = "over";
      else if (pct > 80) status = "warning";
      return {
        ...b,
        limit_amount: limit,
        spent_amount: spent,
        remaining,
        percent_used: pct,
        status,
      };
    });

    res.status(200).json(merged);
  } catch (error) {
    console.error("getBudgets", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function upsertBudget(req, res) {
  try {
    const { user_id, category, limit_amount, month, year } = req.body;
    if (!user_id || !category || limit_amount === undefined || !month || !year) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const row = await sql`
      INSERT INTO budgets (user_id, category, limit_amount, month, year)
      VALUES (${user_id}, ${category}, ${limit_amount}, ${month}, ${year})
      ON CONFLICT (user_id, category, month, year)
      DO UPDATE SET limit_amount = EXCLUDED.limit_amount
      RETURNING *
    `;
    res.status(201).json(row[0]);
  } catch (error) {
    console.error("upsertBudget", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBudget(req, res) {
  try {
    const { id } = req.params;
    const { limit_amount } = req.body;
    if (limit_amount === undefined) {
      return res.status(400).json({ message: "limit_amount required" });
    }
    const row = await sql`
      UPDATE budgets SET limit_amount = ${limit_amount}
      WHERE id = ${id}
      RETURNING *
    `;
    if (row.length === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json(row[0]);
  } catch (error) {
    console.error("updateBudget", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBudget(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM budgets WHERE id = ${id} RETURNING *`;
    if (result.length === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("deleteBudget", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBudgetStatus(req, res) {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    const budgets = await sql`
      SELECT * FROM budgets
      WHERE user_id = ${userId} AND month = ${month} AND year = ${year}
    `;

    const spentRows = await sql`
      SELECT category, COALESCE(ABS(SUM(amount)), 0) as spent
      FROM transactions
      WHERE user_id = ${userId} AND amount < 0
        AND EXTRACT(MONTH FROM created_at::timestamp)::int = ${month}
        AND EXTRACT(YEAR FROM created_at::timestamp)::int = ${year}
      GROUP BY category
    `;
    const spentMap = Object.fromEntries(
      spentRows.map((r) => [r.category, parseFloat(r.spent)])
    );

    const out = budgets.map((b) => {
      const spent_amount = spentMap[b.category] || 0;
      const limit_amount = parseFloat(b.limit_amount);
      const remaining = limit_amount - spent_amount;
      const percent_used =
        limit_amount > 0 ? (spent_amount / limit_amount) * 100 : 0;
      let status = "ok";
      if (percent_used > 100) status = "over";
      else if (percent_used > 80) status = "warning";
      return {
        id: b.id,
        category: b.category,
        limit_amount,
        spent_amount,
        remaining,
        percent_used,
        status,
      };
    });

    res.status(200).json(out);
  } catch (error) {
    console.error("budget status", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
