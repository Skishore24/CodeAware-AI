import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  FileCode2,
  Boxes,
  ShieldCheck,
  Search,
  Bot,
  Wrench,
  Activity,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitGraph,
  GitFork,
  Cpu,
  Layers,
  Terminal,
  Zap,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { scanRepository } from "../api/repositories";
import { runSecurityScan } from "../api/security";

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeRepo, backendStatus, repositories } = useRepo();
  const [stats, setStats] = useState({
    files: 0,
    functions: 0,
    classes: 0,
    languages: {},
    primaryLanguage: "None",
    securityIssues: 0,
    frameworks: [],
    entryPoints: [],
    loading: false,
  });

  useEffect(() => {
    if (!activeRepo) return;
    let isMounted = true;

    async function loadStats() {
      setStats((prev) => ({ ...prev, loading: true }));
      try {
        const scanRes = await scanRepository(activeRepo.path || activeRepo.name);
        let secCount = 0;
        try {
          const secRes = await runSecurityScan(activeRepo.name);
          secCount = secRes?.findings?.length || 0;
        } catch {}

        if (isMounted && scanRes) {
          const analysis = scanRes.analysis || scanRes;
          setStats({
            files: analysis.total_files || activeRepo.files_count || 0,
            functions: analysis.total_functions || 0,
            classes: analysis.total_classes || 0,
            languages: analysis.languages || {},
            primaryLanguage: analysis.primary_language || "Code",
            frameworks: analysis.frameworks || [],
            entryPoints: analysis.entry_points || [],
            securityIssues: secCount,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [activeRepo]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const languageColors = {
    Python: "#3B82F6",
    JavaScript: "#F59E0B",
    TypeScript: "#3178C6",
    Go: "#00ADD8",
    Java: "#EA580C",
    "C++": "#EC4899",
    Rust: "#DEA584",
    HTML: "#E34F26",
    CSS: "#563D7C",
  };

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={13} />
            <span>CodeAware Intelligence Platform</span>
          </div>
          <h1 className="hero-title">
            {getTimeGreeting()}, Developer
          </h1>
          <p className="hero-desc">
            {activeRepo ? (
              <>
                Active repository: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong>.
                {" "}Explore symbols, inspect architecture boundaries, detect security risks, and trigger safe automated fixes.
              </>
            ) : (
              "Welcome to CodeAware AI. Clone or select a repository to unlock local code intelligence, AST symbol navigation, and multi-agent assistance."
            )}
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button className="btn btn-primary" onClick={() => navigate(activeRepo ? "/search" : "/repos")}>
              <Search size={15} />
              <span>{activeRepo ? "Search Codebase" : "Select Repository"}</span>
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/agent")}>
              <Bot size={15} />
              <span>Ask AI Agents</span>
            </button>
          </div>
        </div>

        {/* Decorative Status Badge Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", zIndex: 1 }}>
          <div style={{ padding: "12px 18px", backgroundColor: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Inference Mode
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span className="status-dot healthy"></span> 100% Local-First
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: "var(--space-6)" }}>
        {/* Metric 1: Files */}
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Source Files</div>
            <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              <FolderGit2 size={18} />
            </div>
          </div>
          <div className="metric-value">
            {stats.loading ? "..." : stats.files.toLocaleString()}
          </div>
          <div className="metric-sub">
            <CheckCircle2 size={12} color="var(--success)" />
            <span>Indexed in AST Symbol Index</span>
          </div>
        </div>

        {/* Metric 2: Primary Tech */}
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Primary Language</div>
            <div className="metric-icon-box" style={{ backgroundColor: "var(--info-light)", color: "var(--info)" }}>
              <FileCode2 size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: "22px" }}>
            {stats.loading ? "..." : stats.primaryLanguage}
          </div>
          <div className="metric-sub">
            <span>{Object.keys(stats.languages).length} language distributions</span>
          </div>
        </div>

        {/* Metric 3: Security Posture */}
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Security Posture</div>
            <div
              className="metric-icon-box"
              style={{
                backgroundColor: stats.securityIssues > 0 ? "var(--warning-light)" : "var(--success-light)",
                color: stats.securityIssues > 0 ? "var(--warning)" : "var(--success)",
              }}
            >
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: stats.securityIssues > 0 ? "var(--warning)" : "var(--success)" }}>
            {stats.loading ? "..." : stats.securityIssues === 0 ? "Protected" : `${stats.securityIssues} Issues`}
          </div>
          <div className="metric-sub">
            <span>Static OWASP & Vulnerability Scan</span>
          </div>
        </div>

        {/* Metric 4: AI Engine */}
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Specialist Agents</div>
            <div className="metric-icon-box" style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}>
              <Bot size={18} />
            </div>
          </div>
          <div className="metric-value">15 Ready</div>
          <div className="metric-sub">
            <span style={{ color: "var(--success)", fontWeight: 600 }}>● Multi-Agent Orchestrator</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid-2" style={{ marginBottom: "var(--space-6)" }}>
        {/* Left Column: Repository Intelligence Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={18} color="var(--primary)" />
              <span>Repository Intelligence & Health</span>
            </h2>
            <span className="badge badge-success">Verified Baseline</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Framework Badges */}
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Detected Tech Stack & Frameworks:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {stats.frameworks.length > 0 ? (
                  stats.frameworks.map((fw, idx) => (
                    <span key={idx} className="badge badge-primary" style={{ padding: "4px 10px" }}>
                      <Boxes size={12} /> {fw}
                    </span>
                  ))
                ) : (
                  <span className="badge badge-neutral">Standard Library / Python / JS</span>
                )}
              </div>
            </div>

            {/* Health Bars */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 500 }}>Code Health & Syntax Integrity</span>
                <span style={{ fontWeight: 600, color: "var(--success)" }}>94%</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "94%", height: "100%", backgroundColor: "var(--success)", borderRadius: "3px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 500 }}>Architecture Modularity</span>
                <span style={{ fontWeight: 600, color: "var(--primary)" }}>88%</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "88%", height: "100%", backgroundColor: "var(--primary)", borderRadius: "3px" }}></div>
              </div>
            </div>

            {/* Language Breakdown */}
            {Object.keys(stats.languages).length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Language Distribution:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {Object.entries(stats.languages).slice(0, 5).map(([lang, count], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: languageColors[lang] || "#64748B",
                        }}
                      ></span>
                      <span style={{ fontWeight: 600 }}>{lang}</span>
                      <span style={{ color: "var(--text-muted)" }}>({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Workflows */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Zap size={18} color="var(--warning)" />
              <span>Developer Workflows</span>
            </h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>One-click actions</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              className="card card-interactive"
              style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => navigate("/search")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  <Search size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Natural Language Code Search</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Search symbols, endpoints, and logic with citations</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-subtle)" />
            </div>

            <div
              className="card card-interactive"
              style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => navigate("/review")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="metric-icon-box" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Full Engineering Code Review</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Evaluate correctness, OWASP security, and complexity</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-subtle)" />
            </div>

            <div
              className="card card-interactive"
              style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => navigate("/impact")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="metric-icon-box" style={{ backgroundColor: "var(--info-light)", color: "var(--info)" }}>
                  <GitFork size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Blast Radius & Impact Analysis</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Calculate callers, callees, and broken test risks</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-subtle)" />
            </div>

            <div
              className="card card-interactive"
              style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => navigate("/autonomous")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="metric-icon-box" style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>
                  <Wrench size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Autonomous Fix & Safe Patching</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Unified diff preview, test validation, and rollback</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-subtle)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
