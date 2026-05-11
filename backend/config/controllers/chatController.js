import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "../db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function chat(req, res) {
  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user's financial context
    let financialContext = {
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      recentTransactions: [],
      spendingByCategory: [],
      goals: []
    };

    try {
      const [transactions, summary, goals] = await Promise.all([
        sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`,
        sql`
          SELECT 
            COALESCE(SUM(amount), 0) as balance,
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
            COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as expenses
          FROM transactions WHERE user_id = ${userId}
        `,
        sql`SELECT * FROM goals WHERE user_id = ${userId}`
      ]);

      const categorySpending = await sql`
        SELECT category, ABS(SUM(amount)) as total
        FROM transactions
        WHERE user_id = ${userId} AND amount < 0
        GROUP BY category
        ORDER BY total DESC
      `;

      financialContext = {
        balance: parseFloat(summary[0]?.balance || 0),
        totalIncome: parseFloat(summary[0]?.income || 0),
        totalExpenses: parseFloat(summary[0]?.expenses || 0),
        recentTransactions: transactions.slice(0, 10).map(t => ({
          title: t.title,
          amount: parseFloat(t.amount),
          category: t.category,
          date: t.created_at
        })),
        spendingByCategory: categorySpending.map(c => ({
          category: c.category,
          total: parseFloat(c.total)
        })),
        goals: goals.map(g => ({
          title: g.title,
          target: parseFloat(g.target_amount),
          current: parseFloat(g.current_amount),
          completed: g.completed
        }))
      };
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    const systemPrompt = `You are a friendly and helpful financial assistant for a personal finance app. Your name is FinBot.

USER'S FINANCIAL DATA:
- Current Balance: $${financialContext.balance.toFixed(2)}
- Total Income: $${financialContext.totalIncome.toFixed(2)}
- Total Expenses: $${financialContext.totalExpenses.toFixed(2)}
- Savings Rate: ${financialContext.totalIncome > 0 ? ((financialContext.totalIncome - financialContext.totalExpenses) / financialContext.totalIncome * 100).toFixed(1) : 0}%

SPENDING BY CATEGORY:
${financialContext.spendingByCategory.map(c => `- ${c.category}: $${c.total.toFixed(2)}`).join('\n') || 'No spending data yet'}

RECENT TRANSACTIONS:
${financialContext.recentTransactions.map(t => `- ${t.title}: $${t.amount.toFixed(2)} (${t.category})`).join('\n') || 'No transactions yet'}

SAVINGS GOALS:
${financialContext.goals.map(g => `- ${g.title}: $${g.current.toFixed(2)}/$${g.target.toFixed(2)} ${g.completed ? '✓ Completed' : ''}`).join('\n') || 'No goals set'}

GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Give specific advice based on the user's actual financial data
3. Keep responses concise (2-3 paragraphs max)
4. Use emojis sparingly to be friendly 💰
5. If asked about something unrelated to finance, politely redirect to financial topics
6. Suggest actionable tips when appropriate
7. Be supportive, not judgmental about spending habits
8. Reference specific numbers from their data when giving advice`;

    try {
      const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
      console.log("Calling Gemini API...");

      const result = await model.generateContent(`${systemPrompt}\n\nUser message: ${message}`);
      const response = result.response.text();
      console.log("Gemini response received successfully");

      res.status(200).json({ 
        message: response,
        context: {
          balance: financialContext.balance,
          income: financialContext.totalIncome,
          expenses: financialContext.totalExpenses
        }
      });
    } catch (aiError) {
      console.error("AI Error:", aiError.message);
      console.error("Full error:", aiError);
      
      // Fallback responses based on user message
      const fallbackResponse = getFallbackResponse(message, financialContext);
      
      res.status(200).json({ 
        message: fallbackResponse,
        context: {
          balance: financialContext.balance,
          income: financialContext.totalIncome,
          expenses: financialContext.totalExpenses
        }
      });
    }

  } catch (error) {
    console.error("Error in chat:", error.message || error);
    res.status(500).json({ message: "Failed to get response. Please try again.", error: error.message });
  }
}

function getFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hi there! 👋 I'm FinBot, your financial assistant. I can see your current balance is $${context.balance.toFixed(2)}. How can I help you today? You can ask me about budgeting tips, saving strategies, or analyzing your spending!`;
  }
  
  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    const savingsRate = context.totalIncome > 0 ? ((context.totalIncome - context.totalExpenses) / context.totalIncome * 100) : 0;
    return `💰 Great question about saving! Based on your data, you're currently saving ${savingsRate.toFixed(1)}% of your income. Here are some tips:\n\n1. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n2. Set up automatic transfers to savings on payday\n3. Review your subscriptions and cancel unused ones\n4. Cook at home more often to reduce food expenses`;
  }
  
  if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) {
    return `📊 Looking at your spending: You've spent $${context.totalExpenses.toFixed(2)} total. Here's my advice:\n\n1. Track every expense for a week to identify patterns\n2. Set spending limits for each category\n3. Wait 24 hours before making non-essential purchases\n4. Use cash for discretionary spending to stay aware`;
  }
  
  if (lowerMessage.includes('budget')) {
    return `📝 Budgeting is key to financial success! With your income of $${context.totalIncome.toFixed(2)}, here's a suggested budget:\n\n• Needs (rent, food, utilities): 50% = $${(context.totalIncome * 0.5).toFixed(2)}\n• Wants (entertainment, dining): 30% = $${(context.totalIncome * 0.3).toFixed(2)}\n• Savings & debt: 20% = $${(context.totalIncome * 0.2).toFixed(2)}\n\nWould you like more specific advice?`;
  }
  
  if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    return `💳 Managing debt wisely is important! Here are some strategies:\n\n1. List all debts with interest rates\n2. Pay minimums on all, extra on highest interest (avalanche method)\n3. Or pay smallest debts first for motivation (snowball method)\n4. Consider consolidation if you have multiple high-interest debts\n5. Avoid taking on new debt while paying off existing ones`;
  }
  
  if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
    return `📈 Investing is great for building wealth! Before investing:\n\n1. Build an emergency fund (3-6 months expenses)\n2. Pay off high-interest debt first\n3. Start with employer 401(k) match if available\n4. Consider low-cost index funds for beginners\n5. Only invest money you won't need for 5+ years\n\nRemember: I'm not a licensed financial advisor, so consider consulting one for personalized investment advice!`;
  }
  
  return `Thanks for your message! 😊 I'm here to help with your finances. Your current balance is $${context.balance.toFixed(2)} with $${context.totalIncome.toFixed(2)} income and $${context.totalExpenses.toFixed(2)} expenses.\n\nYou can ask me about:\n• Saving money tips\n• Budgeting advice\n• Spending analysis\n• Debt management\n• Investment basics\n\nWhat would you like to know?`;
}

// Quick suggestions based on user's financial state
export async function getSuggestions(req, res) {
  try {
    const { userId } = req.params;

    const summary = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as balance,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as expenses
      FROM transactions WHERE user_id = ${userId}
    `;

    const balance = parseFloat(summary[0]?.balance || 0);
    const income = parseFloat(summary[0]?.income || 0);
    const expenses = parseFloat(summary[0]?.expenses || 0);

    let suggestions = [
      "How can I save more money?",
      "Analyze my spending habits",
      "Tips for budgeting"
    ];

    if (balance < 0) {
      suggestions = [
        "Help! I'm in debt",
        "How to reduce my expenses?",
        "Create a recovery plan"
      ];
    } else if (expenses > income * 0.8) {
      suggestions = [
        "I'm spending too much",
        "Where can I cut costs?",
        "Help me budget better"
      ];
    } else if (income > 0 && expenses < income * 0.5) {
      suggestions = [
        "Investment tips for beginners",
        "Should I increase my savings?",
        "Best ways to grow my money"
      ];
    }

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
