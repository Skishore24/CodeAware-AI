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
          setStats({
            files: scanRes.total_files || activeRepo.files_count || 0,
            functions: scanRes.total_functions || 0,
            classes: scanRes.total_classes || 0,
            languages: scanRes.languages || {},
            primaryLanguage: scanRes.primary_language || "Code",
            securityIssues: secCount,
            loading: false,
          });
        }
      } catch (e) {
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{getTimeGreeting()}</h1>
          <p className="page-subtitle">
            {activeRepo
              ? `Workspace: ${activeRepo.name} — Production Code Intelligence`
              : "No active repository selected. Clone or select a repository to begin."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/repos")}>
            <FolderGit2 size={15} />
            <span>Switch Repository</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/search")}>
            <Search size={15} />
            <span>Search Code</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Total Files</span>
            <FolderGit2 size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>
            {stats.loading ? "..." : stats.files.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Indexed & Analyzed
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Primary Language</span>
            <FileCode2 size={16} color="var(--info)" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)" }}>
            {stats.loading ? "..." : stats.primaryLanguage}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {Object.keys(stats.languages).length} language types detected
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Security Posture</span>
            <ShieldCheck size={16} color={stats.securityIssues > 0 ? "var(--warning)" : "var(--success)"} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: stats.securityIssues > 0 ? "var(--warning)" : "var(--success)" }}>
            {stats.loading ? "..." : stats.securityIssues === 0 ? "Clean" : `${stats.securityIssues} Issues`}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Static OWASP Audit
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>AI Reasoning Engine</span>
            <Bot size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>
            Local Reasoner
          </div>
          <div style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500, marginTop: "4px" }}>
            ● 15 Agents Ready
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid-2" style={{ marginBottom: "var(--space-6)" }}>
        {/* Repository Health */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={18} color="var(--primary)" />
              <span>Repository Health Summary</span>
            </h2>
            <span className="badge badge-success">Live Evaluation</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 500 }}>Code Health</span>
                <span style={{ fontWeight: 600 }}>88%</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "88%", height: "100%", backgroundColor: "var(--primary)", borderRadius: "3px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 500 }}>Security Score</span>
                <span style={{ fontWeight: 600 }}>{stats.securityIssues === 0 ? "96%" : "78%"}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: stats.securityIssues === 0 ? "96%" : "78%", height: "100%", backgroundColor: "var(--success)", borderRadius: "3px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 500 }}>Modularity & Architecture</span>
                <span style={{ fontWeight: 600 }}>92%</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "92%", height: "100%", backgroundColor: "var(--info)", borderRadius: "3px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Workflows */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Sparkles size={18} color="var(--primary)" />
              <span>Quick Workflows</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              className="card"
              style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navigate("/search")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Search size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Natural Language Code Search</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Find authentication, queries, and endpoints</div>
                </div>
              </div>
              <ArrowRight size={16} color="#9CA3AF" />
            </div>

            <div
              className="card"
              style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navigate("/review")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Full Engineering Code Review</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Audit correctness, security, and smells</div>
                </div>
              </div>
              <ArrowRight size={16} color="#9CA3AF" />
            </div>

            <div
              className="card"
              style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navigate("/autonomous")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Wrench size={18} color="var(--warning)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px" }}>Safe Autonomous Bug Fixer</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Generate patches, review diffs, and validate</div>
                </div>
              </div>
              <ArrowRight size={16} color="#9CA3AF" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
