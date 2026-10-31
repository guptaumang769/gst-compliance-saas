/**
 * Chatbot Controller (Phase 3: Chatbot) — rules/FAQ, no LLM.
 * Delegates matching to the pure chatbotMatcher.
 */

const { matchQuery } = require('../utils/chatbotMatcher');

async function query(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'Missing required field: message' });
    }

    const result = matchQuery(message);
    return res.status(200).json({
      success: true,
      answer: result.answer,
      matched: result.matched,
      suggestions: result.suggestions
    });
  } catch (error) {
    console.error('Chatbot query error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process chatbot query' });
  }
}

module.exports = { query };
