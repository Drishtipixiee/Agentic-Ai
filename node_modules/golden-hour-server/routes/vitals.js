import express from 'express';
import VitalsReading from '../models/VitalsReading.js';

const router = express.Router();

// GET /api/vitals — last 30 readings (for initial chart load)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const readings = await VitalsReading.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('-patientId -__v'); // Never expose patientId to API
    res.json({ success: true, data: readings.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vitals/latest
router.get('/latest', async (req, res) => {
  try {
    const reading = await VitalsReading.findOne()
      .sort({ timestamp: -1 })
      .select('-patientId -__v');
    res.json({ success: true, data: reading });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
