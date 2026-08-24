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
  ShieldAlert,
  ArrowUpRight,
  Layers,
  Zap,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { scanRepository } from "../api/repositories";
import { runSecurityScan } from "../api/security";
import HeroIllustration from "../components/visual/HeroIllustration";
import PipelineSteps from "../components/visual/PipelineSteps";
import Tooltip from "../components/common/Tooltip";

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
            primaryLanguage: analysis.primary_language || "General Code",
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

  const featureCards = [
    {
      id: "search",
      name: "Natural Language Code Search",
      icon: Search,
      color: "var(--primary)",
      bg: "var(--primary-light)",
      desc: "Ask questions in plain English and instantly locate relevant functions, files, routes, and AST symbols.",
      how: "Hybrid AST & semantic vector matching with exact file line citations.",
      cta: "Search Code",
      path: "/search",
    },
    {
      id: "review",
      name: "AI Code Review",
      icon: ShieldCheck,
      color: "var(--success)",
      bg: "var(--success-light)",
      desc: "Evaluate code quality, modularity, exception handling, and engineering architecture across 8 dimensions.",
      how: "Static heuristics combined with deterministic rules for code maintainability.",
      cta: "Run Review",
      path: "/review",
    },
    {
      id: "security",
      name: "Security & Vulnerability Audit",
      icon: ShieldAlert,
      color: "var(--error)",
      bg: "var(--error-light)",
      desc: "Detect SQL injection, hardcoded API secrets, unsafe eval() execution, and OWASP Top 10 flaws.",
      how: "Deterministic vulnerability pattern matching with remediation guidance.",
      cta: "Scan Security",
      path: "/security",
    },
    {
      id: "graph",
      name: "Knowledge Graph & Topology",
      icon: GitGraph,
      color: "var(--purple)",
      bg: "var(--purple-light)",
      desc: "Visualize cross-file relationships, inheritance trees, function call graphs, and module dependencies.",
      how: "Interactive node graph mapping callers, callees, and imported definitions.",
      cta: "Explore Graph",
      path: "/graph",
    },
    {
      id: "impact",
      name: "Blast Radius & Impact Analysis",
      icon: GitFork,
      color: "var(--info)",
      bg: "var(--info-light)",
      desc: "Calculate what will break before modifying any class, function, or API handler.",
      how: "Recursively traces inbound callers and dependent modules with risk scoring.",
      cta: "Analyze Impact",
      path: "/impact",
    },
    {
      id: "autonomous",
      name: "Autonomous Fix & Patching",
      icon: Wrench,
      color: "var(--warning)",
      bg: "var(--warning-light)",
      desc: "Generate targeted code fixes, inspect side-by-side diffs, and validate changes before applying.",
      how: "Isolated patch synthesis with regression test generation and safe review gates.",
      cta: "Find Fixes",
      path: "/autonomous",
    },
  ];

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
      {/* Hero Section with Product Concept & Architecture Illustration */}
      <div className="hero-card">
        <div className="hero-grid">
          <div>
            <div className="hero-tag">
              <Sparkles size={13} />
              <span>AI Code Intelligence Platform</span>
            </div>
            <h1 className="hero-title">
              Understand your codebase with AI
            </h1>
            <p className="hero-subtitle">
              Search code, explore architecture, detect security risks, understand dependencies, and get actionable engineering insights from one unified workspace.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate(activeRepo ? "/search" : "/repos")}
              >
                <Search size={16} />
                <span>{activeRepo ? "Search Code" : "Connect Repository"}</span>
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => navigate("/agent")}
              >
                <Bot size={16} />
                <span>Ask AI Assistant</span>
              </button>

              {activeRepo ? (
                <span className="badge badge-success" style={{ padding: "6px 12px", fontSize: "12.5px" }}>
                  <CheckCircle2 size={13} /> Active: {activeRepo.name}
                </span>
              ) : (
                <span className="badge badge-warning" style={{ padding: "6px 12px", fontSize: "12.5px" }}>
                  No repository active
                </span>
              )}
            </div>
          </div>

          <div>
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* Real Repository Snapshot Metrics */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 800 }}>Repository Snapshot</h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              {activeRepo ? `Verified metadata for ${activeRepo.name}` : "Connect a repository to view live code metrics"}
            </p>
          </div>
          {activeRepo && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/repos")}>
              <span>Switch Repository</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="grid-4">
          {/* Files */}
          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>Source Files</div>
              <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                <FolderGit2 size={18} />
              </div>
            </div>
            <div className="metric-value">
              {stats.loading ? "..." : (stats.files || (activeRepo ? "Ready" : "0"))}
            </div>
            <div className="metric-sub">
              <CheckCircle2 size={12} color="var(--success)" />
              <span>{activeRepo ? "Indexed in AST Symbol Map" : "Awaiting repository"}</span>
            </div>
          </div>

          {/* Primary Language */}
          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>Primary Language</div>
              <div className="metric-icon-box" style={{ backgroundColor: "var(--info-light)", color: "var(--info)" }}>
                <FileCode2 size={18} />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: "20px" }}>
              {stats.loading ? "..." : stats.primaryLanguage}
            </div>
            <div className="metric-sub">
              <span>{Object.keys(stats.languages).length > 0 ? `${Object.keys(stats.languages).length} languages detected` : "AST parsed"}</span>
            </div>
          </div>

          {/* Security Posture */}
          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>Security Posture</div>
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
              {stats.loading ? "..." : activeRepo ? (stats.securityIssues === 0 ? "Protected" : `${stats.securityIssues} Issues`) : "Ready to Scan"}
            </div>
            <div className="metric-sub">
              <span>Static OWASP audit available</span>
            </div>
          </div>

          {/* Specialist Agents */}
          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600 }}>AI Engineering Agents</div>
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
      </div>

      {/* "What can CodeAware AI do?" Section */}
      <div>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
            What can CodeAware AI do?
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Explore the six core intelligence capabilities designed to analyze, secure, and accelerate development.
          </p>
        </div>

        <div className="feature-grid">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="feature-card">
                <div>
                  <div className="feature-icon-box" style={{ backgroundColor: feat.bg, color: feat.color }}>
                    <Icon size={20} />
                  </div>
                  <h3 className="feature-title">{feat.name}</h3>
                  <p className="feature-desc">{feat.desc}</p>
                  <div className="feature-how">
                    <strong style={{ color: "var(--text-main)" }}>How it works: </strong>
                    {feat.how}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(feat.path)}
                  style={{ width: "100%", justifyContent: "space-between", marginTop: "8px" }}
                >
                  <span>{feat.cta}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-Step "How CodeAware Works" Flow */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <PipelineSteps />
      </div>
    </div>
  );
}
