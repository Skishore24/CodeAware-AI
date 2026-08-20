import { useState, useEffect } from "react";
import {
  Sliders,
  Cpu,
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Info,
  Bot,
  Activity,
  Boxes,
  Zap,
  Terminal,
  FileCode,
  GitFork,
  Wrench,
} from "lucide-react";
import { getSystemStatus } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";

export default function Settings() {
  const { backendStatus, checkHealth } = useRepo();
  const { addToast } = useToast();

  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const agentsList = [
    { name: "RepositoryAgent", icon: Boxes, intent: "repository_analysis", desc: "Language distribution, file counts, and entry points" },
    { name: "SearchAgent", icon: Bot, intent: "code_search", desc: "Natural language query and symbol relevance matching" },
    { name: "RAGAgent", icon: FileCode, intent: "code_explanation", desc: "Repository-aware chunk retrieval with line citations" },
    { name: "CodeAnalysisAgent", icon: Terminal, intent: "code_analysis", desc: "AST symbol definitions, classes, and parameter extraction" },
    { name: "BugAgent", icon: Activity, intent: "bug_analysis", desc: "Syntax checks, bare excepts, and runtime flaws" },
    { name: "SecurityAgent", icon: ShieldCheck, intent: "security_analysis", desc: "Static OWASP audits (SQLi, secrets, dangerous eval, path traversal)" },
    { name: "ImpactAgent", icon: GitFork, intent: "impact_analysis", desc: "Blast radius scoring, direct/indirect callers, and affected APIs" },
    { name: "TestAgent", icon: FileCode, intent: "test_generation", desc: "Synthesizes isolated unit tests with mock fixtures" },
    { name: "FixAgent", icon: Wrench, intent: "fix_request", desc: "Generates targeted patches and unified diffs" },
    { name: "DocumentationAgent", icon: FileCode, intent: "documentation", desc: "Generates markdown architecture & API documentation" },
    { name: "ArchitectureAgent", icon: Boxes, intent: "architecture_analysis", desc: "Layer separation (API, services, models, UI) and coupling risks" },
    { name: "PerformanceAgent", icon: Zap, intent: "performance_analysis", desc: "N+1 query patterns, blocking I/O, and bottlenecks" },
    { name: "CodeReviewAgent", icon: CheckCircle2, intent: "code_review", desc: "8-dimension engineering code quality review" },
    { name: "GitAgent", icon: Activity, intent: "git_analysis", desc: "Commit history, branches, and diff analysis" },
    { name: "ValidationAgent", icon: ShieldCheck, intent: "validation", desc: "Isolated syntax and regression test validation" },
  ];

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getSystemStatus();
      setSystemInfo(data);
      await checkHealth();
      addToast("Diagnostics refreshed.", "info");
    } catch {
      // Backend offline or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & AI Diagnostics</h1>
          <p className="page-subtitle">
            Local intelligence configuration, specialist agent registry, and backend inference diagnostics.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchStatus} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {/* AI Engine & Inference Mode */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: "var(--space-4)" }}>
            <Cpu size={18} color="var(--primary)" />
            <span>AI Reasoning & Inference Architecture</span>
          </h2>

          <div className="grid-2">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Inference Mode</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
                  {systemInfo?.inference?.mode || "Local Deterministic Intelligence"}
                </div>
              </div>

              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Reasoning Engine</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
                  {systemInfo?.inference?.reasoning_engine || "CodeAware-Deterministic-Reasoner-v1"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Vector Embeddings & Retrieval</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
                  {systemInfo?.inference?.embeddings || "Local TF-IDF & Symbol Vectorizer"}
                </div>
              </div>

              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>External API Dependencies</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <CheckCircle2 size={16} /> None (100% Self-Hosted & Local-First)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 15 Specialist Agents Registry Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Bot size={18} color="var(--primary)" />
              <span>Specialist Agents Registry ({agentsList.length})</span>
            </h2>
            <span className="badge badge-success">All Active & Registered</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {agentsList.map((ag, idx) => {
              const Icon = ag.icon;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-main)" }}>
                      {ag.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {ag.desc}
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: "10px", padding: "1px 5px", marginTop: "6px" }}>
                      Intent: {ag.intent}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
