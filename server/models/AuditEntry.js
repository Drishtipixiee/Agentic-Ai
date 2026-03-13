import mongoose from 'mongoose';

const AuditEntrySchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  action: { type: String, required: true },
  reasoning: { type: String },
  confidence: { type: Number, min: 0, max: 1 },
  news2Score: Number,
  band: String,
  escalated: { type: Boolean, default: false },
  killSwitchActive: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, immutable: true },
});

// Immutable — no updates or deletes allowed (enforced by middleware)
AuditEntrySchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('AuditEntry is immutable and cannot be modified.'));
  }
  next();
});

AuditEntrySchema.index({ timestamp: -1 });
AuditEntrySchema.index({ agentName: 1 });

export default mongoose.model('AuditEntry', AuditEntrySchema);
