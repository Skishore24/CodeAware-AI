import { useState, useEffect } from "react";
import { healthCheck } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";
import {
  Settings, Server, Brain, GitBranch, RefreshCw,
  CheckCircle2, XCircle, ExternalLink, Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const { activeRepo, clearRepo, setActiveRepo } = useRepo();
  const toast = useToast();

  const [apiUrl, setApiUrl]         = useState("http://localhost:8000");
  const [healthy, setHealthy]       = useState(null);
  const [checking, setChecking]     = useState(false);
  const [customRepoPath, setCustomRepoPath] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ca_api_url");
    if (stored) setApiUrl(stored);
  }, []);

  const saveApiUrl = () => {
    localStorage.setItem("ca_api_url", apiUrl);
    toast("success", "API URL saved", "Reload the page to apply.");
  };

  const testConnection = async () => {
    setChecking(true);
    setHealthy(null);
    try {
      await healthCheck();
      setHealthy(true);
      toast("success", "Backend reachable", "Connection successful.");
    } catch {
      setHealthy(false);
      toast("error", "Backend unreachable", "Check that uvicorn is running.");
    } finally {
      setChecking(false);
    }
  };

  const setManualRepo = () => {
    if (!customRepoPath.trim()) return;
    const name = customRepoPath.trim().split(/[\\/]/).pop();
    setActiveRepo({ name, path: customRepoPath.trim() });
    toast("success", "Active repo set", name);
    setCustomRepoPath("");
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Configuration</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={26} color="var(--color-accent)" /> Settings
        </h1>
        <p className="page-subtitle">Configure CodeAware AI, manage active repository, and check system health.</p>
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* API Configuration */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Server size={16} color="var(--color-accent)" /> API Configuration
          </div>
          <div className="card">
            <div className="form-group">
              <label>Backend API URL</label>
              <div className="input-row">
                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
                <button className="btn btn-secondary" onClick={saveApiUrl}>Save</button>
                <button className="btn btn-primary" onClick={testConnection} disabled={checking}>
                  {checking ? <><span className="spinner" /> Testing…</> : <><RefreshCw size={14} /> Test</>}
                </button>
              </div>
            </div>

            {healthy !== null && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderRadius: "var(--radius-sm)", marginTop: 8,
                background: healthy ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${healthy ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                fontSize: 13,
              }}>
                {healthy
                  ? <><CheckCircle2 size={14} color="var(--color-green)" /> <span style={{ color: "var(--color-green)" }}>Backend is healthy and responding.</span></>
                  : <><XCircle     size={14} color="var(--color-red)"   /> <span style={{ color: "var(--color-red)"   }}>Backend unreachable — is uvicorn running?</span></>}
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={13} /> API Docs
              </a>
              <a href={`${apiUrl}/health`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={13} /> Health
              </a>
            </div>
          </div>
        </div>

        {/* Active Repository */}
        <div className="settings-section">
          <div className="settings-section-title">
            <GitBranch size={16} color="var(--color-accent)" /> Active Repository
          </div>
          <div className="card">
            {activeRepo ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Currently active</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{activeRepo.name || activeRepo.path}</div>
                  {activeRepo.path && (
                    <code style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--color-text-subtle)", wordBreak: "break-all" }}>
                      {activeRepo.path}
                    </code>
                  )}
                  {activeRepo.url && (
                    <div style={{ marginTop: 4 }}>
                      <a href={activeRepo.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--color-accent)", fontFamily: "JetBrains Mono, monospace" }}>
                        {activeRepo.url}
                      </a>
                    </div>
                  )}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => { clearRepo(); toast("info", "Repo cleared", ""); }}>
                  <Trash2 size={13} /> Clear Active Repo
                </button>
              </div>
            ) : (
              <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 12 }}>
                No active repository. Clone one in the Repositories page, or set one manually below.
              </div>
            )}

            <div className="divider" />

            <div className="form-group">
              <label>Set Repo Manually (by path)</label>
              <div className="input-row">
                <input
                  value={customRepoPath}
                  onChange={(e) => setCustomRepoPath(e.target.value)}
                  placeholder="C:\...\my-repo"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
                <button className="btn btn-secondary" onClick={setManualRepo} disabled={!customRepoPath.trim()}>
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Brain size={16} color="var(--color-accent)" /> System Info
          </div>
          <div className="card">
            {[
              { label: "Frontend",     value: "React 19 + Vite 8" },
              { label: "Backend",      value: "FastAPI + Python" },
              { label: "ML Engine",    value: "TF-IDF Intent Classifier" },
              { label: "Search",       value: "Hybrid TF-IDF + Keyword" },
              { label: "Graph",        value: "NetworkX" },
              { label: "RAG",          value: "Chunk retrieval pipeline" },
              { label: "App Version",  value: "1.0.0" },
            ].map(({ label, value }) => (
              <div key={label} className="settings-row">
                <div>
                  <div className="settings-label">{label}</div>
                </div>
                <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--color-text-subtle)" }}>
                  {value}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
