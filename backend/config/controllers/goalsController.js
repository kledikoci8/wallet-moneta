import { sql } from "../db.js";

// Get all goals for a user
export async function getGoalsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const goals = await sql`
      SELECT * FROM goals 
      WHERE user_id = ${userId} 
      ORDER BY completed ASC, deadline ASC NULLS LAST, created_at DESC
    `;

    res.status(200).json(goals);
  } catch (error) {
    console.error("Error getting goals", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Create a new goal
export async function createGoal(req, res) {
  try {
    const { user_id, title, target_amount, deadline, category, icon, color } = req.body;

    if (!user_id || !title || !target_amount) {
      return res.status(400).json({ message: "User ID, title, and target amount are required" });
    }

    const goal = await sql`
      INSERT INTO goals (user_id, title, target_amount, deadline, category, icon, color)
      VALUES (${user_id}, ${title}, ${target_amount}, ${deadline || null}, ${category || 'General'}, ${icon || 'flag'}, ${color || '#2E7D32'})
      RETURNING *
    `;

    res.status(201).json(goal[0]);
  } catch (error) {
    console.error("Error creating goal", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update goal progress (add money to savings)
export async function updateGoalProgress(req, res) {
  try {
    const { id } = req.params;
    const { amount, note, user_id } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const currentGoal = await sql`SELECT * FROM goals WHERE id = ${id}`;

    if (currentGoal.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const uid = user_id || currentGoal[0].user_id;
    const newAmount = parseFloat(currentGoal[0].current_amount) + parseFloat(amount);
    const isCompleted = newAmount >= parseFloat(currentGoal[0].target_amount);

    await sql`
      INSERT INTO goal_contributions (goal_id, user_id, amount, note)
      VALUES (${id}, ${uid}, ${parseFloat(amount)}, ${note || null})
    `;

    const goal = await sql`
      UPDATE goals 
      SET current_amount = ${newAmount}, completed = ${isCompleted}
      WHERE id = ${id}
      RETURNING *
    `;

    res.status(200).json(goal[0]);
  } catch (error) {
    console.error("Error updating goal progress", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getGoalContributions(req, res) {
  try {
    const { goalId } = req.params;
    const rows = await sql`
      SELECT * FROM goal_contributions
      WHERE goal_id = ${goalId}
      ORDER BY contributed_at DESC
    `;
    res.status(200).json(rows);
  } catch (error) {
    console.error("getGoalContributions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update goal details
export async function updateGoal(req, res) {
  try {
    const { id } = req.params;
    const { title, target_amount, deadline, category, icon, color } = req.body;

    const goal = await sql`
      UPDATE goals 
      SET 
        title = COALESCE(${title}, title),
        target_amount = COALESCE(${target_amount}, target_amount),
        deadline = COALESCE(${deadline}, deadline),
        category = COALESCE(${category}, category),
        icon = COALESCE(${icon}, icon),
        color = COALESCE(${color}, color)
      WHERE id = ${id}
      RETURNING *
    `;

    if (goal.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json(goal[0]);
  } catch (error) {
    console.error("Error updating goal", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete a goal
export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`DELETE FROM goals WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get savings tips based on user's spending patterns
export async function getSavingsTips(req, res) {
  try {
    const { userId } = req.params;

    // Get spending by category for the last 30 days
    const spending = await sql`
      SELECT category, ABS(SUM(amount)) as total
      FROM transactions
      WHERE user_id = ${userId} AND amount < 0 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY total DESC
    `;

    // Get total income and expenses
    const summary = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as expenses
      FROM transactions
      WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '30 days'
    `;

    const income = parseFloat(summary[0]?.income || 0);
    const expenses = parseFloat(summary[0]?.expenses || 0);
    const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;

    // Generate personalized tips
    const tips = generateSavingsTips(spending, income, expenses, savingsRate);

    res.status(200).json({
      spending,
      income,
      expenses,
      savingsRate: savingsRate.toFixed(1),
      tips
    });
  } catch (error) {
    console.error("Error getting savings tips", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

function generateSavingsTips(spending, income, expenses, savingsRate) {
  const tips = [];

  // General tips based on savings rate
  if (savingsRate < 10) {
    tips.push({
      id: 1,
      icon: 'alert-circle',
      title: 'Boost Your Savings',
      description: 'Try to save at least 20% of your income. Start small and increase gradually.',
      priority: 'high'
    });
  } else if (savingsRate < 20) {
    tips.push({
      id: 2,
      icon: 'trending-up',
      title: 'Good Progress!',
      description: 'You\'re saving ' + savingsRate.toFixed(0) + '%. Push for 20% to build a solid emergency fund.',
      priority: 'medium'
    });
  } else {
    tips.push({
      id: 3,
      icon: 'checkmark-circle',
      title: 'Excellent Saver!',
      description: 'You\'re saving ' + savingsRate.toFixed(0) + '% of your income. Consider investing the surplus.',
      priority: 'low'
    });
  }

  // Category-specific tips
  spending.forEach((cat, index) => {
    const percentage = income > 0 ? (parseFloat(cat.total) / income * 100) : 0;
    
    if (cat.category === 'Food & Drinks' && percentage > 15) {
      tips.push({
        id: 10 + index,
        icon: 'restaurant',
        title: 'Reduce Food Spending',
        description: 'Food is ' + percentage.toFixed(0) + '% of income. Try meal prepping to save up to 50%.',
        priority: 'high'
      });
    }
    
    if (cat.category === 'Entertainment' && percentage > 10) {
      tips.push({
        id: 20 + index,
        icon: 'film',
        title: 'Entertainment Budget',
        description: 'Consider free alternatives like parks, libraries, or streaming services you already have.',
        priority: 'medium'
      });
    }

    if (cat.category === 'Shopping' && percentage > 15) {
      tips.push({
        id: 30 + index,
        icon: 'cart',
        title: 'Smart Shopping',
        description: 'Wait 24 hours before non-essential purchases. Use the 30-day rule for big items.',
        priority: 'high'
      });
    }

    if (cat.category === 'Transportation' && percentage > 15) {
      tips.push({
        id: 40 + index,
        icon: 'car',
        title: 'Transport Costs',
        description: 'Consider carpooling, public transit, or biking to reduce transportation expenses.',
        priority: 'medium'
      });
    }
  });

  // Always include these general tips
  tips.push({
    id: 100,
    icon: 'wallet',
    title: '50/30/20 Rule',
    description: 'Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.',
    priority: 'info'
  });

  tips.push({
    id: 101,
    icon: 'calendar',
    title: 'Automate Savings',
    description: 'Set up automatic transfers to your savings account on payday.',
    priority: 'info'
  });

  tips.push({
    id: 102,
    icon: 'cash',
    title: 'Emergency Fund',
    description: 'Aim for 3-6 months of expenses in an easily accessible savings account.',
    priority: 'info'
  });

  return tips;
}
