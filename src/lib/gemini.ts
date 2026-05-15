import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseExpenseDetails(text: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `
    Analyze the following expense input from a user.
    Extract the item name, the amount, the currency (default to LKR if not specified).
    Categorize the expense into a typical category like "Dining Out", "Transport", "Utilities", "Groceries", "Entertainment", etc.
    Assign a necessity score from 1 to 5, where 1 is highly necessary (e.g., rent, basic groceries) and 5 is highly unnecessary (e.g., luxury items, impulse dining).
    Set "is_unnecessary" to true if the score is 4 or 5, otherwise false.

    Respond ONLY with a valid JSON object matching this structure (no markdown tags, no extra text):
    {
      "item": "string",
      "amount": number,
      "currency": "string",
      "category": "string",
      "necessity_score": number,
      "is_unnecessary": boolean
    }

    Expense input: "${text}"
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const jsonText = response.text().trim().replace(/^```json/, '').replace(/```$/, '');
  
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Gemini response', jsonText);
    throw new Error('Failed to parse expense');
  }
}

export async function roastWallet(transactions: any[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `
    You are a sarcastic financial advisor roasting a user's wallet based on their recent transactions.
    Here are their recent transactions:
    ${JSON.stringify(transactions, null, 2)}
    
    Give a short, brutally honest, and humorous paragraph analyzing their spending habits. Focus especially on anything marked as "is_unnecessary". Don't be too mean, keep it fun but stinging.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
