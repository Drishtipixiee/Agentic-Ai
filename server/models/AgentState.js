import mongoose from 'mongoose';

const AgentStateSchema = new mongoose.Schema({
  stateId: { type: String, default: 'singleton', unique: true },
  scenario: { type: String, enum: ['STABLE', 'DETERIORATING', 'CRITICAL'], default: 'STABLE' },
  killSwitchActive: { type: Boolean, default: false },
  news2Score: { type: Number, default: 0 },
  band: { type: String, default: 'STABLE' },
  confidence: { type: Number, default: 0 },
  agentStatuses: {
    monitoring: { type: String, default: 'IDLE' },
    privacy: { type: String, default: 'IDLE' },
    triage: { type: String, default: 'IDLE' },
    diagnostic: { type: String, default: 'IDLE' },
    escalation: { type: String, default: 'IDLE' },
  },
  latestVitals: mongoose.Schema.Types.Mixed,
  latestNews2: mongoose.Schema.Types.Mixed,
  latestHrv: mongoose.Schema.Types.Mixed,
  latestDiagnosis: String,
  lastEscalation: Date,
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('AgentState', AgentStateSchema);
