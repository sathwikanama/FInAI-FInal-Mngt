const express = require("express");
const router = express.Router();
const { ReceiptScan } = require("../models");
const Tesseract = require('tesseract.js');
const multer = require('multer');
const ocrEnhancedController = require('../controllers/ocrEnhanced.controller');
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', file.mimetype);
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      console.error('❌ Invalid file type:', file.mimetype);
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

console.log("✅ OCR ROUTES LOADED");

// POST enhanced OCR with auto-transaction creation
router.post("/process", authMiddleware, upload.single("receipt"), ocrEnhancedController.processReceiptAndCreateTransaction);

// POST scan single receipt (legacy - kept for compatibility)
router.post("/scan", upload.single("receipt"), async (req, res) => {
  console.log('🔍 OCR Scan Request Received');
  console.log('📁 File details:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'No file received');
  console.log('📋 Request headers:', Object.keys(req.headers));
  
  try {
    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: "No image file uploaded"
      });
    }

    const imagePath = require("path").resolve(req.file.path);
    console.log('📸 Image path:', imagePath);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(imagePath)) {
      console.error('❌ File does not exist at path:', imagePath);
      return res.status(400).json({
        success: false,
        message: "Uploaded file not found"
      });
    }

    console.log('🧠 Starting Tesseract OCR processing...');
    const { data: { text, confidence } } = await Tesseract.recognize(
      imagePath,
      "eng",
      {
        logger: m => console.log(`OCR: ${m.status} - ${Math.round(m.progress * 100)}%`)
      }
    );

    console.log('📝 OCR Results:', {
      textLength: text?.length || 0,
      confidence: confidence,
      textPreview: text?.substring(0, 200) + (text?.length > 200 ? '...' : '')
    });

    if (!text || text.trim().length < 10) {
      console.error('❌ OCR failed to extract sufficient text');
      return res.json({
        success: false,
        message: "OCR failed to extract sufficient text",
        data: { confidence, textLength: text?.length || 0 }
      });
    }

    // Normalize text
    const cleanText = text.replace(/,/g, '');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

    let totalCandidates = [];

    // Step 1: Collect total-related lines
    for (let line of lines) {
      const lower = line.toLowerCase();

      if (
        lower.includes("total") ||
        lower.includes("grand total") ||
        lower.includes("net total") ||
        lower.includes("amount payable")
      ) {
        if (lower.includes("sub")) continue;

        const numbers = line.match(/\d+(\.\d+)?/g);

        if (numbers) {
          const value = parseFloat(numbers[numbers.length - 1]);

          if (value > 1 && value < 100000) {
            totalCandidates.push(value);
          }
        }
      }
    }

    console.log('🔢 Processing text for amount extraction...');
    console.log('📊 Total candidates found:', totalCandidates);

    let amount = null;

    // Prefer last detected total
    if (totalCandidates.length > 0) {
      amount = totalCandidates[totalCandidates.length - 1];
      console.log('💰 Amount detected from total keywords:', amount);
    }

    // Step 2: Safe fallback — scan bottom 6 lines but ignore time patterns
    if (!amount) {
      console.log('🔍 Trying fallback method - scanning bottom lines...');
      const bottomLines = lines.slice(-6);
      console.log('📝 Bottom lines:', bottomLines);

      for (let line of bottomLines) {

        // Ignore time like 21:18
        if (line.match(/\d{1,2}:\d{2}/)) continue;

        // Ignore percentages
        if (line.includes("%")) continue;

        const numbers = line.match(/\d+(\.\d+)?/g);

        if (numbers) {
          const value = parseFloat(numbers[numbers.length - 1]);

          if (value > 10 && value < 100000) {
            amount = value;
            console.log('💰 Amount detected from fallback:', amount, 'in line:', line);
            break;
          }
        }
      }
    }

    if (!amount) {
      console.error('❌ No amount detected in receipt');
      return res.json({
        success: false,
        message: "Total amount not detected",
        data: { 
          lines: lines.slice(-10), // Show last 10 lines for debugging
          totalCandidates,
          confidence
        }
      });
    }

    console.log('✅ Final extracted amount:', amount);

    // Save to database
    try {
      console.log('💾 Saving to database...');
      await ReceiptScan.create({
        amount: amount
      });
      console.log('✅ Saved to database successfully');
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Continue anyway - we can still return the amount
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Cleaned up temporary file');
    } catch (cleanupError) {
      console.error('⚠️ File cleanup error:', cleanupError);
    }

    console.log('🎉 OCR processing completed successfully');
    return res.json({
      success: true,
      amount: amount,
      confidence: confidence,
      message: "Receipt processed successfully"
    });

  } catch (error) {
    console.error("❌ OCR ERROR:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(require("path").resolve(req.file.path));
        console.log('🗑️ Cleaned up temporary file after error');
      } catch (cleanupError) {
        console.error('⚠️ File cleanup error after main error:', cleanupError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: "OCR processing failed: " + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET receipt history
router.get("/history", async (req, res) => {
  try {
    const receipts = await ReceiptScan.findAll({
      order: [["scannedAt", "DESC"]]
    });

    res.json({
      success: true,
      data: receipts.map(r => ({
        id: r.id,
        amount: r.amount,
        scannedAt: r.scannedAt
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
