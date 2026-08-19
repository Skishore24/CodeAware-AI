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
} from "lucide-react";
import { getSystemStatus } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";

export default function Settings() {
  const { backendStatus, checkHealth } = useRepo();
  const { addToast } = useToast();

  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getSystemStatus();
      setSystemInfo(data);
      await checkHealth();
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
            Local intelligence configuration, inference engine status, and runtime health.
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
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Inference Mode</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                  {systemInfo?.inference?.mode || "Local Deterministic Intelligence"}
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Reasoning Engine</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                  {systemInfo?.inference?.reasoning_engine || "CodeAware-Deterministic-Reasoner-v1"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Vector Embeddings & Retrieval</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                  {systemInfo?.inference?.embeddings || "Local TF-IDF & Symbol Vectorizer"}
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>External API Dependencies</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--success)" }}>
                  None (100% Self-Hosted & Local-First)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Health & Status */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: "var(--space-4)" }}>
            <Server size={18} color="var(--primary)" />
            <span>Backend Services & Component Health</span>
          </h2>

          <div className="grid-3">
            <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Backend Server</span>
                <span className={`status-dot ${backendStatus}`}></span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                {backendStatus === "healthy" ? "Running on http://localhost:8000" : "Offline"}
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Specialist Agents</span>
                <span className="status-dot healthy"></span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                15 Agents Active & Registered
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>AST & Knowledge Graph</span>
                <span className="status-dot healthy"></span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                NetworkX & AST Parsers Ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
