import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [vitalsState, setVitalsState] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({
    monitoring: 'IDLE',
    privacy: 'IDLE',
    triage: 'IDLE',
    diagnostic: 'IDLE',
    escalation: 'IDLE',
  });
  const [escalationEvent, setEscalationEvent] = useState(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('vitals:update', (data) => {
      setVitalsState(data);
      setKillSwitchActive(data.killSwitchActive || false);
    });

    socket.on('agent:status', ({ agent, status }) => {
      setAgentStatuses(prev => ({ ...prev, [agent]: status }));
    });

    socket.on('escalation:triggered', (event) => {
      setEscalationEvent(event);
      // Auto-dismiss after 8s
      setTimeout(() => setEscalationEvent(null), 8000);
    });

    socket.on('killswitch:changed', ({ active }) => setKillSwitchActive(active));

    return () => socket.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    connected,
    vitalsState,
    agentStatuses,
    escalationEvent,
    killSwitchActive,
  };
}
