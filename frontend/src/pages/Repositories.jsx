import { useState } from "react";
import { cloneRepository, scanRepository, analyzeCode } from "../api/repositories";
import { useToast } from "../components/Toast";

export default function Repositories() {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  async function handleClone(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setCloning(true);
    setScanResult(null);
    setAnalysisResult(null);
    try {
      const data = await cloneRepository(url.trim());
      if (data.success) {
        const name = data.repository_name;
        if (!repos.includes(name)) {
          setRepos((prev) => [name, ...prev]);
        }
        toast("success", "Repository ready", data.message);
        setActiveRepo(name);
        setUrl("");
      } else {
        toast("error", "Clone failed", data.error || "Unknown error");
      }
    } catch (err) {
      toast("error", "Clone failed", err.message);
    } finally {
      setCloning(false);
    }
  }

  async function handleScan(repoName) {
    setScanning(true);
    setScanResult(null);
    setAnalysisResult(null);
    try {
      const data = await scanRepository(repoName);
      setScanResult(data.analysis);
      toast("success", "Scan complete", "Repository scanned successfully.");
    } catch (err) {
      toast("error", "Scan failed", err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleAnalyze(repoName) {
    setAnalyzing(true);
    setScanResult(null);
    setAnalysisResult(null);
    try {
      const data = await analyzeCode(repoName);
      setAnalysisResult(data.analysis);
      toast("success", "Analysis complete", "Code analysis finished.");
    } catch (err) {
      toast("error", "Analysis failed", err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Repositories</h1>
        <p className="page-subtitle">Clone GitHub repositories and analyse their structure.</p>
      </div>

      {/* Clone form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Clone a Repository</div>
        <form onSubmit={handleClone}>
          <div className="input-row">
            <input
              className="input"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={cloning}
            />
            <button className="btn btn-primary" type="submit" disabled={cloning || !url.trim()}>
              {cloning ? <><span className="spinner" /> Cloning…</> : "⬇️ Clone"}
            </button>
          </div>
        </form>
      </div>

      {/* Repo list */}
      {repos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">No repositories cloned yet. Paste a GitHub URL above.</div>
        </div>
      ) : (
        <div className="section">
          <div className="section-title">Cloned Repositories</div>
          <div className="result-list">
            {repos.map((name) => (
              <div
                key={name}
                className="result-item"
                style={{
                  borderColor: activeRepo === name ? "var(--color-accent)" : undefined,
                }}
              >
                <div className="result-item-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📁</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 600 }}>
                      {name}
                    </span>
                    {activeRepo === name && <span className="badge badge-info">selected</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setActiveRepo(name); handleScan(name); }}
                      disabled={scanning || analyzing}
                    >
                      {scanning && activeRepo === name ? <><span className="spinner" /> Scanning…</> : "🔎 Scan"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setActiveRepo(name); handleAnalyze(name); }}
                      disabled={scanning || analyzing}
                    >
                      {analyzing && activeRepo === name ? <><span className="spinner" /> Analysing…</> : "🧬 Analyse Code"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan results */}
      {scanResult && (
        <div className="section">
          <div className="section-title">🔎 Scan Results</div>
          <div className="card">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              {Object.entries(scanResult)
                .filter(([k]) => typeof scanResult[k] !== "object")
                .map(([k, v]) => (
                  <div key={k} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: 12, border: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>{String(v)}</div>
                  </div>
                ))}
            </div>
            <pre className="code-block" style={{ maxHeight: 320 }}>
              {JSON.stringify(scanResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Analysis results */}
      {analysisResult && (
        <div className="section">
          <div className="section-title">🧬 Code Analysis</div>
          <div className="card">
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-label">Python Files</div>
                <div className="stat-value">{analysisResult.python_files ?? "—"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Functions</div>
                <div className="stat-value">{analysisResult.total_functions ?? "—"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Classes</div>
                <div className="stat-value">{analysisResult.total_classes ?? "—"}</div>
              </div>
            </div>
            <pre className="code-block" style={{ maxHeight: 320 }}>
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
