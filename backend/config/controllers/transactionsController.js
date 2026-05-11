import { sql } from "../db.js";

function computeNextDueDate(fromDate, interval) {
  const d = new Date(fromDate);
  if (interval === "weekly") d.setDate(d.getDate() + 7);
  else if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  else if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
    const nid = parseInt(id, 10);
    if (isNaN(nid)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const rows = await sql`SELECT * FROM transactions WHERE id = ${nid}`;
    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("getTransactionById", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
            SELECT * FROM transactions 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    const {
      title,
      amount,
      category,
      user_id,
      date,
      is_recurring,
      recurrence_interval,
    } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: " All fields are required" });
    }

    const transactionDate = date ? new Date(date) : new Date();
    const rec =
      is_recurring &&
      ["weekly", "monthly", "yearly"].includes(recurrence_interval);
    const nextDue = rec
      ? computeNextDueDate(transactionDate, recurrence_interval)
      : null;

    const transaction = await sql`
    INSERT INTO transactions(user_id,title,amount,category,created_at,is_recurring,recurrence_interval,next_due_date)
    VALUES (${user_id},${title},${amount},${category},${transactionDate},${rec},${
      rec ? recurrence_interval : null
    },${nextDue})
    RETURNING *
    `;
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.error(" Error creating the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const { title, amount, category, date, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const nid = parseInt(id, 10);
    if (isNaN(nid)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const existing = await sql`SELECT * FROM transactions WHERE id = ${nid}`;
    if (existing.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (existing[0].user_id !== user_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const t = title !== undefined ? title : existing[0].title;
    const a = amount !== undefined ? amount : existing[0].amount;
    const c = category !== undefined ? category : existing[0].category;
    const created = date ? new Date(date) : existing[0].created_at;

    const row = await sql`
      UPDATE transactions SET
        title = ${t},
        amount = ${a},
        category = ${c},
        created_at = ${created}
      WHERE id = ${nid}
      RETURNING *
    `;

    res.status(200).json(row[0]);
  } catch (error) {
    console.error("Error updating transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
         DELETE FROM transactions WHERE id = ${id} RETURNING *
        `;
    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction delete successfully" });
  } catch (error) {
    console.error(" Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;
    const balanceResult = await sql`
       SELECT COALESCE(SUM(amount),0) as balance FROM transactions WHERE user_id = ${userId}
       `;

    const incomeResult = await sql`
        SELECT COALESCE(SUM(amount),0) as income FROM transactions WHERE user_id= ${userId} AND amount > 0
       `;

    const expensesResult = await sql`
        SELECT COALESCE(SUM(amount),0) as expenses FROM transactions WHERE user_id= ${userId} AND amount < 0
       `;
    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.error(" Error getting  the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAnalyticsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const dailyData = await sql`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expense
            FROM transactions 
            WHERE user_id = ${userId}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

    const monthlyData = await sql`
            SELECT 
                TO_CHAR(created_at, 'Mon') as month,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expense
            FROM transactions 
            WHERE user_id = ${userId}
                AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
        `;

    res.status(200).json({
      dailyData: dailyData.map((d) => ({
        date: d.date,
        income: parseFloat(d.income),
        expense: parseFloat(d.expense),
      })),
      monthlyData: monthlyData.map((m) => ({
        month: m.month,
        income: parseFloat(m.income),
        expense: Math.abs(parseFloat(m.expense)),
      })),
    });
  } catch (error) {
    console.error("Error getting analytics", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategorySpendByMonth(req, res) {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ message: "month and year query params required" });
    }

    const rows = await sql`
      SELECT category, COALESCE(ABS(SUM(amount)), 0) as total
      FROM transactions
      WHERE user_id = ${userId}
        AND amount < 0
        AND EXTRACT(MONTH FROM created_at::timestamp)::int = ${month}
        AND EXTRACT(YEAR FROM created_at::timestamp)::int = ${year}
      GROUP BY category
      ORDER BY total DESC
    `;

    res.status(200).json({
      categories: rows.map((r) => ({
        category: r.category,
        amount: parseFloat(r.total),
      })),
    });
  } catch (error) {
    console.error("Error category spend", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRecurringTransactions(req, res) {
  try {
    const { userId } = req.params;
    const rows = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId} AND COALESCE(is_recurring, false) = true
      ORDER BY next_due_date ASC NULLS LAST
    `;
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error recurring", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function exportTransactions(req, res) {
  try {
    const { userId } = req.params;
    const rows = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const header = "Date,Title,Category,Type,Amount\n";
    const lines = rows.map((r) => {
      const type = parseFloat(r.amount) >= 0 ? "Income" : "Expense";
      const amt = Math.abs(parseFloat(r.amount)).toFixed(2);
      const d = r.created_at
        ? new Date(r.created_at).toISOString().slice(0, 10)
        : "";
      const title = String(r.title).replace(/"/g, '""');
      const cat = String(r.category).replace(/"/g, '""');
      return `${d},"${title}","${cat}",${type},${amt}`;
    });

    const csv = header + lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transactions.csv"'
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("export error", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/** Called by daily cron: materialize due recurring transactions */
export async function processRecurringTransactions() {
  const due = await sql`
    SELECT * FROM transactions
    WHERE COALESCE(is_recurring, false) = true
      AND next_due_date IS NOT NULL
      AND next_due_date <= CURRENT_DATE
  `;
  for (const t of due) {
    if (!t.recurrence_interval) continue;
    await sql`
      INSERT INTO transactions (user_id, title, amount, category, created_at, is_recurring, recurrence_interval, next_due_date)
      VALUES (${t.user_id}, ${t.title}, ${t.amount}, ${t.category}, ${t.next_due_date}, false, null, null)
    `;
    const next = computeNextDueDate(t.next_due_date, t.recurrence_interval);
    await sql`UPDATE transactions SET next_due_date = ${next} WHERE id = ${t.id}`;
  }
}
