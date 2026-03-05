/**
 * OCR Test Script
 * Test Tesseract.js functionality independently
 */

const Tesseract = require('tesseract.js');
const path = require('path');

async function testOCR() {
  console.log('🧪 Testing Tesseract.js OCR functionality...');
  
  try {
    // Test with a simple text image URL (you can replace with a local file path)
    const imageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png';
    
    console.log('📸 Processing test image...');
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => console.log(`OCR Test: ${m.status} - ${Math.round(m.progress * 100)}%`)
      }
    );

    console.log('✅ OCR Test Results:');
    console.log('📝 Extracted Text:', text);
    console.log('🎯 Confidence:', confidence);
    
    if (text && text.trim().length > 0) {
      console.log('🎉 Tesseract.js is working correctly!');
    } else {
      console.log('⚠️ No text extracted - might be image issue');
    }

  } catch (error) {
    console.error('❌ OCR Test Failed:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Run test if called directly
if (require.main === module) {
  testOCR()
    .then(() => {
      console.log('🏁 OCR test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 OCR test crashed:', error);
      process.exit(1);
    });
}

module.exports = testOCR;
