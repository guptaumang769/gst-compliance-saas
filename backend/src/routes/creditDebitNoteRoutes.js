const express = require('express');
const router = express.Router();
const creditDebitNoteController = require('../controllers/creditDebitNoteController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', creditDebitNoteController.createNote);
router.get('/', creditDebitNoteController.getNotes);
router.get('/:id', creditDebitNoteController.getNoteById);
router.put('/:id', creditDebitNoteController.updateNote);
router.delete('/:id', creditDebitNoteController.deleteNote);

module.exports = router;
