import express from 'express';

const router = express.Router();

// POST /api/escalation/toggle — toggle kill switch
router.post('/toggle', (req, res) => {
  try {
    const orchestrator = req.app.get('orchestrator');
    const active = orchestrator.toggleKillSwitch();
    res.json({ success: true, killSwitchActive: active });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/escalation/scenario — change patient scenario
router.post('/scenario', (req, res) => {
  try {
    const { scenario } = req.body;
    if (!['STABLE', 'DETERIORATING', 'CRITICAL'].includes(scenario)) {
      return res.status(400).json({ success: false, error: 'Invalid scenario' });
    }
    const orchestrator = req.app.get('orchestrator');
    orchestrator.setScenario(scenario);
    res.json({ success: true, scenario });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/escalation/state — current orchestrator state
router.get('/state', async (req, res) => {
  try {
    const AgentState = (await import('../models/AgentState.js')).default;
    const state = await AgentState.findOne({ stateId: 'singleton' });
    res.json({ success: true, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
