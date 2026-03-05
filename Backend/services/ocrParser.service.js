/**
 * Intelligent OCR Parser Service
 * Extracts and parses receipt data with smart categorization
 */

class OCRParser {
  constructor() {
    this.categoryKeywords = {
      'Food & Dining': [
        'restaurant', 'cafe', 'food', 'dining', 'pizza', 'burger', 'sandwich',
        'starbucks', 'mcdonald', 'kfc', 'subway', 'domino', 'eatery', 'bistro',
        'bakery', 'coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'meal'
      ],
      'Transportation': [
        'uber', 'ola', 'taxi', 'cab', 'metro', 'bus', 'train', 'railway',
        'airport', 'flight', 'booking', 'travel', 'gas', 'petrol', 'diesel',
        'parking', 'toll', 'auto', 'rickshaw', 'zoomcar', 'ola', 'uber'
      ],
      'Shopping': [
        'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'tata cliq', 'shop',
        'mall', 'store', 'retail', 'walmart', 'target', 'costco', 'big bazaar',
        'd-mart', 'reliance fresh', 'more', 'spencer', 'lifestyle', 'shoppers stop'
      ],
      'Bills & Utilities': [
        'electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'recharge',
        'broadband', 'dish', 'cable', 'rent', 'maintenance', 'society', 'dth',
        'postpaid', 'prepaid', 'bill', 'utility', 'electric', 'power'
      ],
      'Entertainment': [
        'movie', 'cinema', 'theatre', 'netflix', 'prime', 'hotstar', 'spotify',
        'youtube', 'concert', 'event', 'show', 'game', 'playstation', 'xbox',
        'pub', 'bar', 'club', 'party', 'amusement', 'park'
      ],
      'Groceries': [
        'grocery', 'vegetable', 'fruit', 'milk', 'bread', 'egg', 'meat',
        'supermarket', 'provision', 'dairy', 'fresh', 'organic', 'bigbasket',
        'grofers', 'blinkit', 'swiggy instamart', 'zepto'
      ],
      'Healthcare': [
        'hospital', 'doctor', 'clinic', 'pharmacy', 'medical', 'medicine',
        'health', 'diagnostic', 'test', 'checkup', 'dental', 'eye', 'apollo',
        'fortis', 'medlife', 'practo', 'netmeds'
      ],
      'Education': [
        'school', 'college', 'university', 'course', 'tuition', 'fees',
        'education', 'learning', 'training', 'certification', 'book', 'stationery',
        'byju', 'unacademy', 'vedantu', 'coursera', 'udemy'
      ]
    };

    this.merchantPatterns = {
      // Common merchant name patterns
      merchantIndicators: [
        'store', 'shop', 'mart', 'center', 'plaza', 'complex', 'limited',
        'pvt', 'ltd', 'inc', 'corp', 'restaurant', 'cafe', 'bistro'
      ]
    };
  }

  /**
   * Parse OCR text and extract structured data
   */
  parseReceiptText(text, userId) {
    const cleanText = text.replace(/,/g, '').replace(/\s+/g, ' ').trim();
    const lines = cleanText.split('\n').map(line => line.trim()).filter(Boolean);

    const extractedData = {
      merchant_name: this.extractMerchantName(lines),
      total_amount: this.extractTotalAmount(lines),
      date: this.extractDate(lines),
      category: null,
      payment_method: this.extractPaymentMethod(lines),
      description: cleanText.substring(0, 200) + '...',
      user_id: userId,
      confidence: 0
    };

    // Smart categorization
    extractedData.category = this.categorizeTransaction(extractedData.merchant_name, cleanText);

    // Calculate confidence score
    extractedData.confidence = this.calculateConfidence(extractedData);

    return extractedData;
  }

  /**
   * Extract merchant name from receipt lines
   */
  extractMerchantName(lines) {
    // Usually the first few lines contain merchant name
    const candidateLines = lines.slice(0, 5);
    
    for (const line of candidateLines) {
      // Skip if it looks like a date, amount, or address
      if (this.looksLikeDate(line) || this.looksLikeAmount(line) || this.looksLikeAddress(line)) {
        continue;
      }

      // Check if it contains merchant indicators
      if (this.containsMerchantIndicators(line)) {
        return line.length > 50 ? line.substring(0, 50) : line;
      }
    }

    // Fallback: return first non-trivial line
    for (const line of candidateLines) {
      if (line.length > 3 && !this.looksLikeAmount(line) && !this.looksLikeDate(line)) {
        return line.length > 50 ? line.substring(0, 50) : line;
      }
    }

    return 'Unknown Merchant';
  }

  /**
   * Extract total amount with enhanced logic
   */
  extractTotalAmount(lines) {
    let totalCandidates = [];

    // Look for total-related keywords
    const totalKeywords = [
      'total', 'grand total', 'net total', 'amount payable', 'amount due',
      'total amount', 'payable amount', 'final amount', 'bill amount'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      // Check for total keywords
      const hasTotalKeyword = totalKeywords.some(keyword => line.includes(keyword));
      
      if (hasTotalKeyword && !line.includes('sub')) {
        const numbers = lines[i].match(/\d+(\.\d+)?/g);
        if (numbers) {
          const value = parseFloat(numbers[numbers.length - 1]);
          if (value > 1 && value < 100000) {
            totalCandidates.push({ value, line: lines[i], confidence: 0.9 });
          }
        }
      }
    }

    // If no explicit total found, look at bottom lines
    if (totalCandidates.length === 0) {
      const bottomLines = lines.slice(-6);
      
      for (const line of bottomLines) {
        // Skip time patterns
        if (line.match(/\d{1,2}:\d{2}/)) continue;
        
        // Skip percentage lines
        if (line.includes('%')) continue;
        
        // Skip phone numbers
        if (line.match(/\d{10}/)) continue;

        const numbers = line.match(/\d+(\.\d+)?/g);
        if (numbers) {
          const value = parseFloat(numbers[numbers.length - 1]);
          if (value > 10 && value < 100000) {
            totalCandidates.push({ value, line, confidence: 0.6 });
          }
        }
      }
    }

    // Return the highest confidence candidate
    if (totalCandidates.length > 0) {
      const best = totalCandidates.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      return best.value;
    }

    return null;
  }

  /**
   * Extract date from receipt
   */
  extractDate(lines) {
    const datePatterns = [
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,  // DD/MM/YYYY, DD-MM-YYYY
      /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/,  // YYYY/MM/DD
      /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i,  // DD Month YYYY
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i  // Month DD, YYYY
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const date = new Date(match[0]);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    // Default to today if no date found
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Extract payment method
   */
  extractPaymentMethod(lines) {
    const paymentPatterns = {
      'Cash': ['cash', 'paid by cash'],
      'Card': ['card', 'credit card', 'debit card', 'visa', 'mastercard', 'rupay'],
      'UPI': ['upi', 'gpay', 'paytm', 'phonepe', 'bhim', 'upi transaction'],
      'Net Banking': ['net banking', 'online transfer', 'neft', 'rtgs', 'imps'],
      'Wallet': ['wallet', 'paytm wallet', 'phonepe wallet', 'amazon pay']
    };

    const text = lines.join(' ').toLowerCase();

    for (const [method, keywords] of Object.entries(paymentPatterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return method;
      }
    }

    return 'Unknown';
  }

  /**
   * Smart categorization based on merchant name and text content
   */
  categorizeTransaction(merchantName, fullText) {
    const text = (merchantName + ' ' + fullText).toLowerCase();

    // Score each category based on keyword matches
    const categoryScores = {};
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += keyword.length > 4 ? 2 : 1; // Weight longer keywords more
        }
      }
      if (score > 0) {
        categoryScores[category] = score;
      }
    }

    // Return category with highest score, or default to Other
    if (Object.keys(categoryScores).length > 0) {
      return Object.keys(categoryScores).reduce((a, b) => 
        categoryScores[a] > categoryScores[b] ? a : b
      );
    }

    return 'Other';
  }

  /**
   * Calculate confidence score for extracted data
   */
  calculateConfidence(data) {
    let confidence = 0;
    let factors = 0;

    if (data.total_amount && data.total_amount > 0) {
      confidence += 0.4;
      factors++;
    }

    if (data.merchant_name && data.merchant_name !== 'Unknown Merchant') {
      confidence += 0.2;
      factors++;
    }

    if (data.date) {
      confidence += 0.2;
      factors++;
    }

    if (data.category && data.category !== 'Other') {
      confidence += 0.1;
      factors++;
    }

    if (data.payment_method && data.payment_method !== 'Unknown') {
      confidence += 0.1;
      factors++;
    }

    return factors > 0 ? confidence : 0;
  }

  /**
   * Helper methods
   */
  looksLikeDate(line) {
    return line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) ||
           line.match(/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/);
  }

  looksLikeAmount(line) {
    return line.match(/(?:₹|Rs\.?|USD|\$)\s*\d+(?:\.\d{2})?/) ||
           line.match(/^\d+(?:\.\d{2})?\s*(?:Rs\.?|USD|\$)?$/);
  }

  looksLikeAddress(line) {
    return line.match(/\d+\s+[A-Za-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Lane|Ln)/i);
  }

  containsMerchantIndicators(line) {
    return this.merchantPatterns.merchantIndicators.some(indicator => 
      line.toLowerCase().includes(indicator)
    );
  }
}

module.exports = new OCRParser();
