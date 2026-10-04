import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyzeReceipt } from '../services/gemini.service';
import { createError } from '../middleware/error.middleware';

export const analyzeReceiptController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let imagePath: string | undefined;

  try {
    if (!req.file) {
      return next(createError('No image file provided', 400));
    }

    imagePath = req.file.path;

    // Analyze with Gemini
    const extractedData = await analyzeReceipt(imagePath);

    // Build the receipt image URL (relative path for serving)
    const fileName = path.basename(imagePath);
    const receiptImageUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      message: 'Receipt analyzed successfully',
      data: {
        ...extractedData,
        receiptImage: receiptImageUrl,
      },
    });
  } catch (err) {
    // Clean up uploaded file if analysis failed and it's not a valid receipt
    if (imagePath && fs.existsSync(imagePath)) {
      // Keep the file if it was uploaded successfully, just failed analysis
      // The user can retry analysis
    }

    const error = err as Error;
    if (error.message === 'AI returned invalid JSON response') {
      return next(createError('Unable to analyze this receipt. Please try again.', 422));
    }
    if (error.message.includes('API key')) {
      return next(createError('AI service is not configured. Please contact support.', 503));
    }
    next(createError('Unable to analyze this receipt. Please try again.', 500));
  }
};
