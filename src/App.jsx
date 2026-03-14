import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./assets/Login";
import Home from "./assets/Home";
import Dashboard from "./assets/Dashboard";
import MonitorAgent from "./assets/MonitorAgent";
import TriageAgent from "./assets/TriageAgent";
import RiskAgent from "./assets/RiskAgent";
import DiagnosticAgent from "./assets/DiagnosticAgent";
import EscalationAgent from "./assets/EscalationAgent";
import SchedulerAgent from "./assets/SchedulerAgent";
import MapPage from "./assets/MapPage";
import "./App.css";

function ProtectedRoute({ children, user }) {
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("svashthai_user")); } catch { return null; }
  });

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem("svashthai_token");
    localStorage.removeItem("svashthai_user");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute user={user}><MonitorAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/triage" element={<ProtectedRoute user={user}><TriageAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/risk" element={<ProtectedRoute user={user}><RiskAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/diagnosis" element={<ProtectedRoute user={user}><DiagnosticAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/escalation" element={<ProtectedRoute user={user}><EscalationAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/scheduler" element={<ProtectedRoute user={user}><SchedulerAgent user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute user={user}><MapPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;