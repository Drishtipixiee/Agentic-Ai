import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./Shared.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_BASE, { transports: ["websocket", "polling"] });
  }
  return socketInstance;
}

export function useVitals() {
  const [vitals, setVitals] = useState(null);
  const [risk, setRisk] = useState("stable");
  const [scenario, setScenario] = useState("Stable Baseline");
  const [agents, setAgents] = useState({});
  const [connected, setConnected] = useState(false);
  const [waves, setWaves] = useState([]);
  const [hitlQueue, setHitlQueue] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("vitals", (data) => {
      setVitals(data.vitals);
      setRisk(data.risk);
      setScenario(data.scenario);
      setAgents(data.agents || {});
      if (data.waves) setWaves(data.waves);
    });
    socket.on("hitl_update", (data) => setHitlQueue(data));
    return () => {
      socket.off("vitals");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("hitl_update");
    };
  }, []);

  return { vitals, risk, scenario, agents, connected, waves, hitlQueue };
}

const RISK_COLORS = {
  stable:   { bg: "#DCFCE7", fg: "#166534", dot: "#16a34a", label: "STABLE" },
  medium:   { bg: "#FEF9C3", fg: "#854D0E", dot: "#ca8a04", label: "MODERATE" },
  high:     { bg: "#FFEDD5", fg: "#9A3412", dot: "#ea580c", label: "HIGH RISK" },
  critical: { bg: "#FEF2F2", fg: "#991B1B", dot: "#dc2626", label: "CRITICAL" },
};

const NAV_LINKS = [
  { to: "/dashboard",  label: "Dashboard",   icon: "⬛" },
  { to: "/monitor",    label: "Monitor",      icon: "◉" },
  { to: "/triage",     label: "Triage",       icon: "◈" },
  { to: "/risk",       label: "Risk",         icon: "◆" },
  { to: "/diagnosis",  label: "Diagnostic",   icon: "◇" },
  { to: "/escalation", label: "Escalation",   icon: "◎" },
  { to: "/map",        label: "Map",          icon: "📍" },
];

export default function Navbar({ user, onLogout, risk: propRisk }) {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [listening, setListening] = useState(false);
  const [speechResp, setSpeechResp] = useState("");
  const recognitionRef = useRef(null);
  const { risk: liveRisk, vitals, connected } = useVitals();
  const risk = propRisk || liveRisk || "stable";
  const rc = RISK_COLORS[risk] || RISK_COLORS.stable;

  // SOS handler
  useEffect(() => {
    const socket = getSocket();
    socket.on("alert", (data) => {
      setToasts(prev => [...prev.slice(-3), {
        id: Date.now(), type: data.type, message: data.message, time: new Date().toLocaleTimeString()
      }]);
    });
    socket.on("sos", (data) => {
      setToasts(prev => [...prev.slice(-3), {
        id: Date.now(), type: "sos", message: data.message, time: new Date().toLocaleTimeString()
      }]);
    });
    return () => { socket.off("alert"); socket.off("sos"); };
  }, []);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const t = setTimeout(() => setToasts(prev => prev.slice(1)), 6000);
      return () => clearTimeout(t);
    }
  }, [toasts]);

  const triggerSOS = async () => {
    addToast("sos", "🚨 SOS Triggered! Emergency services notified.");
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await fetch(`${API_BASE}/api/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, message: "Manual SOS triggered from dashboard" })
        });
      }, async () => {
        await fetch(`${API_BASE}/api/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: 28.6139, lng: 77.2090, message: "Manual SOS triggered from dashboard" })
        });
      });
    } catch(e) {}
  };

  const addToast = (type, message) => {
    setToasts(prev => [...prev.slice(-3), { id: Date.now(), type, message, time: new Date().toLocaleTimeString() }]);
  };

  // Web Speech AI
  const startSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Web Speech API not supported in this browser. Please use Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechResp("Processing: " + transcript);
      try {
        const res = await fetch(`${API_BASE}/api/speech-response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript })
        });
        const data = await res.json();
        const reply = data.response || "Unable to process query.";
        setSpeechResp(reply);
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        addToast("info", `🎙 AI: "${reply.substring(0, 80)}..." `);
      } catch(e) { setSpeechResp("Error processing speech."); }
    };
    recognition.start();
  };

  const stopSpeech = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    setListening(false);
  };

  const initials = user?.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "DR";

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <div className="navbar-logo">Sv</div>
          <span className="navbar-name">SvasthAI</span>
        </NavLink>
        <div className="navbar-sep" />

        <div className="navbar-nav">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
              <span style={{ fontSize: "0.7rem" }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar-right">
          {/* Live Risk */}
          {vitals && (
            <div className="navbar-risk-badge" style={{ background: rc.bg, color: rc.fg, borderColor: rc.dot + "50" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: rc.dot, display: "inline-block", animation: risk === "critical" ? "pulse 0.8s infinite" : "none" }} />
              {rc.label}
            </div>
          )}

          {/* Socket status */}
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.7rem", color: connected ? "#16a34a" : "#94A3B8", fontWeight:600 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background: connected?"#16a34a":"#94A3B8", display:"inline-block" }}/>
            {connected?"Live":"Offline"}
          </div>

          {/* Speech AI */}
          <button className={`speech-btn ${listening ? "listening" : ""}`}
            onClick={listening ? stopSpeech : startSpeech}
            title={listening ? "Stop Listening" : "Ask AI (Voice)"}>
            {listening ? "🔴" : "🎙"}
          </button>

          {/* SOS */}
          <button className="sos-nav-btn" onClick={triggerSOS}>🚨 SOS</button>

          {/* User */}
          <div className="navbar-user" onClick={() => { if(confirm("Log out of SvasthAI?")) { onLogout(); navigate("/login"); } }}>
            <div className="navbar-avatar">{initials}</div>
            <span>{user?.name || "Doctor"}</span>
          </div>
        </div>
      </nav>

      {/* Toast Alerts */}
      {toasts.length > 0 && (
        <div className="alert-toast">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              <div className="toast-icon">{t.type==="sos"?"🚨":t.type==="critical"?"🔴":t.type==="high"?"🟠":"ℹ"}</div>
              <div>
                <div className="toast-title">{t.type.toUpperCase()} Alert</div>
                <div className="toast-msg">{t.message}</div>
                <div className="toast-time">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speech Response Banner */}
      {speechResp && (
        <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "8px 24px", fontSize: "0.82rem", color: "#3730A3", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
          <span>🤖 <strong>AI:</strong> {speechResp}</span>
          <button onClick={()=>setSpeechResp("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:"1rem" }}>✕</button>
        </div>
      )}
    </>
  );
}
