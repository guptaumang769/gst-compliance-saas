const creditDebitNoteService = require('../services/creditDebitNoteService');

async function createNote(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const data = await creditDebitNoteService.createNote(business.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Credit/debit note created successfully',
      data
    });
  } catch (error) {
    console.error('Create credit/debit note error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create credit/debit note'
    });
  }
}

async function getNotes(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const params = {
      noteType: req.query.noteType,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50
    };

    const result = await creditDebitNoteService.getNotes(business.id, params);

    res.status(200).json({
      success: true,
      message: 'Credit/debit notes retrieved successfully',
      notes: result.notes,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get credit/debit notes error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve credit/debit notes'
    });
  }
}

async function getNoteById(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const data = await creditDebitNoteService.getNoteById(req.params.id, business.id);

    res.status(200).json({
      success: true,
      message: 'Credit/debit note retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Get credit/debit note error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Credit/debit note not found'
    });
  }
}

async function updateNote(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const data = await creditDebitNoteService.updateNote(
      req.params.id,
      business.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Credit/debit note updated successfully',
      data
    });
  } catch (error) {
    console.error('Update credit/debit note error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update credit/debit note'
    });
  }
}

async function deleteNote(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    await creditDebitNoteService.deleteNote(req.params.id, business.id);

    res.status(200).json({
      success: true,
      message: 'Credit/debit note deleted successfully'
    });
  } catch (error) {
    console.error('Delete credit/debit note error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete credit/debit note'
    });
  }
}

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
