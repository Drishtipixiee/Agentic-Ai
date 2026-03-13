import express from 'express';
import AuditEntry from '../models/AuditEntry.js';

const router = express.Router();

// GET /api/audit — last 50 audit entries
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const entries = await AuditEntry.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('-__v');
    res.json({ success: true, data: entries.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
