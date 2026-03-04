const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware'); // ✅ FIXED
const { 
  createTransactionController, 
  getTransactionsController, 
  deleteTransactionController, 
  updateTransactionController 
} = require('../controllers/transaction.controller');

const { validateRequest, schemas } = require('../middleware/validation.middleware');

// Apply auth middleware to all transaction routes
router.use(authMiddleware);

router.post('/', validateRequest(schemas.transaction), createTransactionController);
router.get('/', getTransactionsController);
router.put('/:id', updateTransactionController);
router.delete('/:id', deleteTransactionController);

module.exports = router;