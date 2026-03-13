import mongoose from 'mongoose';

const VitalsReadingSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // encrypted
  scenario: { type: String, enum: ['STABLE', 'DETERIORATING', 'CRITICAL'], default: 'STABLE' },
  rr: Number,           // Respiration Rate (bpm)
  spo2: Number,         // Oxygen Saturation (%)
  sysBP: Number,        // Systolic Blood Pressure (mmHg)
  hr: Number,           // Heart Rate (bpm)
  consciousness: { type: String, enum: ['Alert', 'CVPU', 'NewConfusion'], default: 'Alert' },
  temp: Number,         // Temperature (°C)
  rrIntervals: [Number],// RR intervals in ms (for HRV)
  news2: {
    total: Number,
    band: String,
    color: String,
    scores: mongoose.Schema.Types.Mixed,
    shapWeights: mongoose.Schema.Types.Mixed,
  },
  hrv: {
    sdnn: Number,
    rmssd: Number,
    lfhf: Number,
    autonomicRisk: Boolean,
    interpretation: String,
  },
  timestamp: { type: Date, default: Date.now },
});

VitalsReadingSchema.index({ timestamp: -1 });
VitalsReadingSchema.index({ patientId: 1, timestamp: -1 });

export default mongoose.model('VitalsReading', VitalsReadingSchema);
