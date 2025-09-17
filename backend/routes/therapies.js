const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
  res.json({ message: 'Get all therapies - To be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get therapy by ID - To be implemented' });
});

router.post('/', protect, authorize('admin', 'doctor'), (req, res) => {
  res.json({ message: 'Create therapy - To be implemented' });
});

router.put('/:id', protect, authorize('admin', 'doctor'), (req, res) => {
  res.json({ message: 'Update therapy - To be implemented' });
});

router.delete('/:id', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Delete therapy - To be implemented' });
});

module.exports = router;