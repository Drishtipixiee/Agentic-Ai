import { sanitise } from '../core/encryption.js';
import AuditEntry from '../models/AuditEntry.js';

export class PrivacyAgent {
  constructor() {
    this.status = 'IDLE';
  }

  async process(rawRecord) {
    this.status = 'RUNNING';
    try {
      // Encrypt PHI fields + return sanitised abstraction
      const sanitised = sanitise(rawRecord);

      await new AuditEntry({
        agentName: 'PrivacyAgent',
        action: 'PHI_SANITISED',
        reasoning: 'Patient identity fields encrypted with AES-256-GCM. Downstream agents receive anonymised physiological data only.',
        confidence: 1.0,
        metadata: {
          fieldsEncrypted: ['patientId', 'name', 'dob'],
          scenario: rawRecord.scenario,
        },
      }).save();

      this.status = 'DONE';
      return sanitised;
    } catch (err) {
      this.status = 'ERROR';
      throw err;
    }
  }
}
