import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const RECEIPT_EXTRACTION_PROMPT = `You are an expert receipt analyzer. Analyze the provided receipt image and extract the following information in valid JSON format only.

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no code blocks, no additional text
- Use null for any information that cannot be clearly identified
- Do not invent or guess information that is not visible
- All amounts should be numbers (not strings)
- Date should be in YYYY-MM-DD format
- confidence should be between 0 and 1 (how confident you are in the extraction)

Extract the following fields:
{
  "merchantName": "Name of the store/merchant or null",
  "date": "YYYY-MM-DD format or null",
  "totalAmount": numeric total amount or null,
  "currency": "3-letter currency code (e.g., INR, USD, EUR)",
  "category": "One of: Groceries, Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Utilities, Travel, Education, Other",
  "paymentMethod": "One of: Cash, Credit Card, Debit Card, UPI, Net Banking, Other or null",
  "tax": numeric tax amount or null,
  "confidence": confidence score between 0 and 1,
  "items": [
    {
      "name": "item name",
      "quantity": numeric quantity,
      "price": numeric price for this line item
    }
  ]
}

Analyze the receipt carefully and provide accurate extraction.`;

export interface ExtractedReceiptData {
  merchantName: string | null;
  date: string | null;
  totalAmount: number | null;
  currency: string | null;
  category: string | null;
  paymentMethod: string | null;
  tax: number | null;
  confidence: number | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const VALID_CATEGORIES = [
  'Groceries', 'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Healthcare', 'Utilities', 'Travel', 'Education', 'Other'
];

const VALID_PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'
];

export const analyzeReceipt = async (imagePath: string): Promise<ExtractedReceiptData> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-from-aistudio-google-com') {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Default to gemini-2.5-flash with fallback to gemini-1.5-flash
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  let responseText = '';
  try {
    const result = await model.generateContent([
      RECEIPT_EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);
    responseText = result.response.text().trim();
  } catch (apiErr: unknown) {
    // If gemini-2.5-flash is not available, try gemini-1.5-flash
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fallbackResult = await fallbackModel.generateContent([
        RECEIPT_EXTRACTION_PROMPT,
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
      ]);
      responseText = fallbackResult.response.text().trim();
    } catch {
      throw apiErr;
    }
  }

  // Parse and validate the JSON response
  let rawParsed: Record<string, unknown>;
  try {
    // Remove any potential markdown wrapping just in case
    const cleanedResponse = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    rawParsed = JSON.parse(cleanedResponse) as Record<string, unknown>;
  } catch {
    throw new Error('AI returned invalid JSON response');
  }

  // Validate and sanitize the parsed data
  return validateExtractedData(rawParsed);
};

const validateExtractedData = (data: Record<string, unknown>): ExtractedReceiptData => {
  return {
    merchantName: typeof data.merchantName === 'string' ? data.merchantName : null,
    date: validateDate(data.date),
    totalAmount: typeof data.totalAmount === 'number' && data.totalAmount >= 0 ? data.totalAmount : null,
    currency: validateCurrency(data.currency),
    category: typeof data.category === 'string' && VALID_CATEGORIES.includes(data.category) ? data.category : 'Other',
    paymentMethod: typeof data.paymentMethod === 'string' && VALID_PAYMENT_METHODS.includes(data.paymentMethod) ? data.paymentMethod : null,
    tax: typeof data.tax === 'number' && data.tax >= 0 ? data.tax : null,
    confidence: typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1
      ? data.confidence
      : 0.9,
    items: validateItems(data.items),
  };
};

const validateDate = (dateStr: unknown): string | null => {
  if (typeof dateStr !== 'string') return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return dateStr;
};

const validateCurrency = (currency: unknown): string => {
  if (typeof currency === 'string' && /^[A-Z]{3}$/.test(currency)) {
    return currency;
  }
  return 'INR';
};

const validateItems = (items: unknown): ExtractedReceiptData['items'] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : 'Item',
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      price: typeof item.price === 'number' && item.price >= 0 ? item.price : 0,
    }))
    .filter(item => item.name !== 'Item' || item.price > 0);
};
