/**
 * Chatbot Routes (Phase 3: Chatbot) — rules/FAQ, no LLM.
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/query', chatbotController.query);

module.exports = router;
