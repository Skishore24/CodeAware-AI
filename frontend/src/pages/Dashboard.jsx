import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { healthCheck } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import {
  FolderGit2, Search, Bot, Network, Target, Brain,
  Server, Cpu, GitBranch, Zap, Wrench, ChevronRight,
  Shield, FileCode, Sparkles, Activity,
} from "lucide-react";

const FEATURES = [
  {
    icon: FolderGit2,    color: "#6366f1",
    title: "Repository Cloning",
    desc: "Clone any public GitHub repo and index it instantly with full AST analysis.",
    to: "/repos",
  },
  {
    icon: Search,        color: "#a855f7",
    title: "Hybrid Code Search",
    desc: "TF-IDF + keyword hybrid retrieval across your entire codebase.",
    to: "/search",
  },
  {
    icon: Bot,           color: "#06b6d4",
    title: "Agent Orchestration",
    desc: "Intent-classified ML router dispatches to the right specialist agent.",
    to: "/agent",
  },
  {
    icon: Network,       color: "#10b981",
    title: "Code Knowledge Graph",
    desc: "NetworkX graph of files, classes, functions and their relationships.",
    to: "/graph",
  },
  {
    icon: Target,        color: "#f59e0b",
    title: "Impact Analysis",
    desc: "See what breaks when any symbol changes — before you commit.",
    to: "/graph",
  },
  {
    icon: Brain,         color: "#ec4899",
    title: "RAG Pipeline",
    desc: "Repository-aware answers using chunk retrieval + reasoning.",
    to: "/agent",
  },
  {
    icon: Shield,        color: "#ef4444",
    title: "Security Analysis",
    desc: "Pattern-based detection of unsafe code, XSS, SQL injection, and more.",
    to: "/agent",
  },
  {
    icon: FileCode,      color: "#f97316",
    title: "Autonomous Fix",
    desc: "AI detects bugs, writes a fix, validates it, then opens a PR for you.",
    to: "/autonomous",
  },
  {
    icon: Wrench,        color: "#84cc16",
    title: "Test Generation",
    desc: "Automatically generate pytest test cases for your Python functions.",
    to: "/agent",
  },
];

const QUICK_STARTS = [
  { icon: FolderGit2, text: "Clone a repository", sub: "Go to Repositories and paste a GitHub URL", to: "/repos", color: "#6366f1" },
  { icon: Search,     text: "Search your code",   sub: "Use Code Search with natural language",       to: "/search", color: "#a855f7" },
  { icon: Bot,        text: "Chat with an agent", sub: "Describe a task and let the AI handle it",   to: "/agent", color: "#06b6d4" },
  { icon: Wrench,     text: "Auto-fix a bug",     sub: "Run the autonomous fix pipeline",             to: "/autonomous", color: "#f59e0b" },
];

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeRepo } = useRepo();
  const navigate = useNavigate();

  useEffect(() => {
    healthCheck()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ status: "offline" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 999, padding: "5px 14px", fontSize: 11.5, color: "var(--color-accent)",
          fontWeight: 600, marginBottom: 18, letterSpacing: 0.3,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-green)", display: "inline-block", boxShadow: "0 0 6px var(--color-green)", animation: "pulse-dot 2s infinite" }} />
          Autonomous Code Intelligence Platform
        </div>

        <h1 className="page-title" style={{ fontSize: 36, letterSpacing: -1.2, marginBottom: 10, fontWeight: 900 }}>
          Welcome to{" "}
          <span style={{ background: "var(--grad-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            CodeAware AI
          </span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: 15, maxWidth: 580, lineHeight: 1.7 }}>
          Clone repositories, search code with natural language, visualise dependency graphs,
          and run specialist AI agents — all from one place.
        </p>

        {activeRepo && (
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 12, color: "var(--color-green)",
          }}>
            <FolderGit2 size={13} />
            Active: <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>{activeRepo.name || activeRepo.path}</strong>
          </div>
        )}
      </div>

      {/* ── Status Cards ─────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon"><Server size={20} color="var(--color-accent)" /></span>
          <div className="stat-label">Backend</div>
          <div className="stat-value" style={{ fontSize: 16, fontFamily: "Inter, sans-serif" }}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <span style={{
                color: status?.status === "healthy" ? "var(--color-green)" : "var(--color-red)",
                background: "none", WebkitTextFillColor: "initial",
              }}>
                {status?.status ?? "unknown"}
              </span>
            )}
          </div>
          <div className="stat-delta">{status?.version ?? "—"}</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><Cpu size={20} color="var(--color-purple)" /></span>
          <div className="stat-label">Model</div>
          <div className="stat-value" style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}>
            Reasoner
          </div>
          <div className="stat-delta">Intent-routed</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><GitBranch size={20} color="var(--color-cyan)" /></span>
          <div className="stat-label">API Version</div>
          <div className="stat-value" style={{ fontSize: 22 }}>1.0.0</div>
          <div className="stat-delta">FastAPI</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><Zap size={20} color="var(--color-yellow)" /></span>
          <div className="stat-label">Intent Classes</div>
          <div className="stat-value">9</div>
          <div className="stat-delta">ML classifier</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon"><Activity size={20} color="var(--color-green)" /></span>
          <div className="stat-label">Agents Ready</div>
          <div className="stat-value">7</div>
          <div className="stat-delta">All wired in</div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="section">
        <div className="section-title">
          <Sparkles size={17} color="var(--color-yellow)" /> Quick Start
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {QUICK_STARTS.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.to + q.text}
                onClick={() => navigate(q.to)}
                className="card"
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: 18,
                  textAlign: "left", cursor: "pointer", border: `1px solid ${q.color}22`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.color + "55"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = q.color + "22"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: "var(--radius-sm)",
                  background: q.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={19} color={q.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, color: "var(--color-text)" }}>{q.text}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{q.sub}</div>
                </div>
                <ChevronRight size={15} color="var(--color-text-muted)" style={{ marginLeft: "auto", flexShrink: 0, marginTop: 4 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Feature Grid ─────────────────────────────────────── */}
      <div className="section">
        <div className="section-title">
          <Wrench size={17} color="var(--color-accent)" /> Platform Capabilities
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="feature-card"
                onClick={() => navigate(f.to)}
                style={{ cursor: "pointer" }}
              >
                <div className="feature-card-icon" style={{ background: f.color + "18" }}>
                  <Icon size={19} color={f.color} />
                </div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
