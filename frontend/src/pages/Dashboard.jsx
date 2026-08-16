import { useState, useEffect } from "react";
import { healthCheck } from "../api/repositories";

const FEATURES = [
  {
    icon: "📦",
    title: "Repository Cloning",
    desc: "Clone any public GitHub repo and index it instantly.",
  },
  {
    icon: "🔍",
    title: "Hybrid Code Search",
    desc: "TF-IDF + keyword hybrid retrieval across your entire codebase.",
  },
  {
    icon: "🤖",
    title: "Agent Orchestration",
    desc: "Intent-classified ML router dispatches to the right specialist agent.",
  },
  {
    icon: "🕸️",
    title: "Code Knowledge Graph",
    desc: "NetworkX graph of files, classes, functions and their relationships.",
  },
  {
    icon: "🎯",
    title: "Impact Analysis",
    desc: "See what breaks when any symbol changes — before you commit.",
  },
  {
    icon: "🧠",
    title: "RAG Pipeline",
    desc: "Repository-aware answers using chunk retrieval + reasoning.",
  },
];

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthCheck()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ status: "offline" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 999,
          padding: "5px 14px",
          fontSize: 12,
          color: "var(--color-accent)",
          fontWeight: 600,
          marginBottom: 16,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-green)", display: "inline-block", boxShadow: "0 0 6px var(--color-green)" }} />
          Autonomous Code Intelligence Platform
        </div>
        <h1 className="page-title" style={{ fontSize: 32, letterSpacing: -1, marginBottom: 8 }}>
          Welcome to{" "}
          <span style={{
            background: "var(--grad-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            CodeAware AI
          </span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: 15, maxWidth: 560 }}>
          Clone repositories, search code with natural language, visualise
          dependency graphs, and run specialist AI agents — all from one place.
        </p>
      </div>

      {/* Status cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">🖥️</span>
          <div className="stat-label">Backend</div>
          <div className="stat-value" style={{ fontSize: 16, fontFamily: "Inter, sans-serif" }}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <span style={{
                color: status?.status === "healthy" ? "var(--color-green)" : "var(--color-red)",
                background: "none",
                WebkitTextFillColor: "initial",
              }}>
                {status?.status ?? "unknown"}
              </span>
            )}
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🧠</span>
          <div className="stat-label">Model</div>
          <div className="stat-value" style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}>
            Reasoner-v0
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔗</span>
          <div className="stat-label">API Version</div>
          <div className="stat-value" style={{ fontSize: 20 }}>0.1.0</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-label">Intent Classes</div>
          <div className="stat-value">9</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section">
        <div className="section-title">⚡ Quick Start</div>
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04))" }}>
          <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, color: "var(--color-text-subtle)", fontSize: 13.5 }}>
            <li><strong style={{ color: "var(--color-text)" }}>Clone a repo</strong> → Go to <em>Repositories</em> and paste a GitHub URL</li>
            <li><strong style={{ color: "var(--color-text)" }}>Search code</strong> → Use <em>Code Search</em> with natural language queries</li>
            <li><strong style={{ color: "var(--color-text)" }}>Run an agent</strong> → Describe a task in <em>Agent Chat</em> and let the orchestrator pick the right agent</li>
            <li><strong style={{ color: "var(--color-text)" }}>Explore the graph</strong> → Build a knowledge graph and analyse symbol impact</li>
          </ol>
        </div>
      </div>

      {/* Feature grid */}
      <div className="section">
        <div className="section-title">🛠️ Platform Features</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
