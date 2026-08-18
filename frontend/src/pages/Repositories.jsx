import { useState } from "react";
import { cloneAndIngest, scanRepository, analyzeCode } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";
import {
  FolderGit2, GitBranch, FileText, CheckCircle2,
  AlertCircle, Code2, Layers, ChevronRight, RefreshCw,
  FolderCheck, Sparkles,
} from "lucide-react";

// Clone progress stages
const STAGES = [
  { key: "cloning",   label: "Cloning",   icon: GitBranch },
  { key: "scanning",  label: "Scanning",  icon: FolderGit2 },
  { key: "analyzing", label: "Analyzing", icon: Code2 },
  { key: "indexing",  label: "Indexing",  icon: Layers },
  { key: "graphing",  label: "Graph",     icon: FileText },
  { key: "done",      label: "Ready",     icon: CheckCircle2 },
];

export default function Repositories() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repository, setRepository] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(null);

  const { activeRepo, setActiveRepo, repositories, refreshRepositories, loadingRepos } = useRepo();
  const toast = useToast();

  // ─── Select / Scan an existing cloned repository ─────────────
  const selectExistingRepo = async (rep) => {
    setActiveRepo(rep);
    setRepository({
      name: rep.name,
      path: rep.path,
      repository_path: rep.path,
      status: "READY",
    });
    setError("");

    setLoadingExisting(true);
    try {
      // Run scanner and analyzer on the selected repository
      const [scanRes, analysisRes] = await Promise.allSettled([
        scanRepository(rep.path),
        analyzeCode(rep.path),
      ]);

      if (scanRes.status === "fulfilled" && scanRes.value?.analysis) {
        setScanResult(scanRes.value.analysis);
      }
      if (analysisRes.status === "fulfilled" && analysisRes.value?.analysis) {
        setAnalysisResult(analysisRes.value.analysis);
      }

      toast("success", "Active repository set", `${rep.name} is now active across all tools.`);
    } catch (err) {
      toast("warning", "Repository selected", `Set ${rep.name} as active.`);
    } finally {
      setLoadingExisting(false);
    }
  };

  // ─── Clone & Ingest ────────────────────────────────────────
  const cloneRepository = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setRepository(null);
    setScanResult(null);
    setAnalysisResult(null);

    // Simulate stage progression
    const stageKeys = ["cloning", "scanning", "analyzing", "indexing", "graphing"];
    let si = 0;
    setStage("cloning");
    const ticker = setInterval(() => {
      si++;
      if (si < stageKeys.length) setStage(stageKeys[si]);
      else clearInterval(ticker);
    }, 1800);

    try {
      const data = await cloneAndIngest(repoUrl.trim());

      clearInterval(ticker);
      setStage("done");

      const repositoryData = data.repository || {};
      const ingestionData  = data.ingestion  || {};

      const repoObj = {
        ...repositoryData,
        repository_path:
          data.repository_path ||
          repositoryData.repository_path ||
          repositoryData.path ||
          repositoryData.local_path,
        ingestion_status: ingestionData.status,
        ingestion: ingestionData,
      };

      setRepository(repoObj);
      setActiveRepo({
        name: repositoryData.name || repositoryData.repository_name,
        path: repoObj.repository_path,
        url:  repoUrl.trim(),
      });

      if (ingestionData.scan)     setScanResult(ingestionData.scan);
      if (ingestionData.analysis) setAnalysisResult(ingestionData.analysis);

      await refreshRepositories();
      toast("success", "Repository ready", `${repositoryData.name || repoUrl} cloned and indexed.`);

    } catch (err) {
      clearInterval(ticker);
      setStage(null);
      setError(err.message || "Unable to process repository.");
      toast("error", "Clone failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────
  const repositoryPath =
    repository?.repository_path || repository?.path || repository?.local_path || activeRepo?.path || "";

  const files     = scanResult?.files || [];
  const functions = analysisResult?.functions || [];
  const classes   = analysisResult?.classes   || [];

  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  // ─── UI ────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Code Intelligence</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FolderGit2 size={26} color="var(--color-accent)" /> Repositories
        </h1>
        <p className="page-subtitle">
          Connect a GitHub repository or choose from previously cloned projects in your workspace.
        </p>
      </div>

      {/* Existing Cloned Repositories Section */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 7 }}>
            <FolderCheck size={16} color="var(--color-green)" />
            Workspace Cloned Repositories
            <span className="badge badge-info" style={{ marginLeft: 6 }}>
              {repositories.length} detected
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={refreshRepositories}
            disabled={loadingRepos}
            title="Refresh repository list"
          >
            <RefreshCw size={13} className={loadingRepos ? "spinner" : ""} /> Refresh
          </button>
        </div>

        {repositories.length === 0 ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: 13, padding: "12px 0" }}>
            No cloned repositories found in workspace. Clone one below to begin.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {repositories.map((rep) => {
              const isActive = activeRepo?.path === rep.path || activeRepo?.name === rep.name;
              return (
                <div
                  key={rep.path}
                  onClick={() => selectExistingRepo(rep)}
                  style={{
                    background: isActive ? "rgba(99,102,241,0.12)" : "var(--color-surface)",
                    border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = "var(--color-border-bright)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
                      <FolderGit2 size={16} color={isActive ? "var(--color-accent)" : "var(--color-text-subtle)"} />
                      <span>{rep.name}</span>
                    </div>
                    {isActive ? (
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        <CheckCircle2 size={11} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-info" style={{ fontSize: 10 }}>
                        Click to Activate
                      </span>
                    )}
                  </div>

                  <code style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                    {rep.path}
                  </code>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>
                    <span>{rep.files_count} files</span>
                    <span style={{ color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 3 }}>
                      Inspect <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Clone card */}
      <section className="repo-connect-card">
        <div className="repo-connect-icon">
          <FolderGit2 size={22} color="var(--color-accent)" />
        </div>
        <div className="repo-connect-content">
          <h2>Clone New GitHub Repository</h2>
          <p>Enter the URL of any public GitHub repository to clone, analyse and index.</p>

          <div className="repo-input-row">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              onKeyDown={(e) => { if (e.key === "Enter") cloneRepository(); }}
              disabled={loading}
            />
            <button
              className="primary-button"
              onClick={cloneRepository}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Processing…</>
              ) : (
                <><GitBranch size={15} /> Clone &amp; Ingest</>
              )}
            </button>
          </div>

          <div className="repo-hint">
            Example: https://github.com/Skishore24/BUS
          </div>
        </div>
      </section>

      {/* Progress stages */}
      {stage && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Processing pipeline</div>
          <div className="progress-steps">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isDone   = i < stageIndex;
              const isActive = i === stageIndex;
              return (
                <div
                  key={s.key}
                  className={`progress-step ${isDone ? "done" : isActive ? "active" : ""}`}
                >
                  <div className="progress-step-dot">
                    {isDone ? (
                      <CheckCircle2 size={13} />
                    ) : isActive ? (
                      <span className="spinner spinner-sm" style={{ borderTopColor: "var(--color-accent)" }} />
                    ) : (
                      <Icon size={12} />
                    )}
                  </div>
                  <div className="progress-step-label">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="repo-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Repository connected */}
      {(repository || activeRepo) && (
        <section className="repo-success-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--color-green)", marginBottom: 4 }}>
                Active Repository
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {repository?.name || activeRepo?.name || repoUrl}
              </h2>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={11} /> Ready
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Local Path</div>
              <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--color-text-subtle)", wordBreak: "break-all" }}>
                {repositoryPath || "—"}
              </code>
            </div>
            {repoUrl && (
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>GitHub URL</div>
                <a href={repoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", fontSize: 11, fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
                  {repoUrl}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scan Results */}
      {scanResult && (
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FolderGit2 size={14} color="var(--color-accent)" /> Repository Structure
          </div>

          <div className="metrics-grid">
            {[
              { label: "Files",       value: Array.isArray(files) ? files.length : (files || 0) },
              { label: "Languages",   value: scanResult.languages?.length || 0 },
              { label: "Directories", value: scanResult.directories?.length || 0 },
              { label: "Status",      value: "Scanned" },
            ].map(({ label, value }) => (
              <div className="metric-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {scanResult.languages?.length > 0 && (
            <div className="data-section">
              <h3><Code2 size={13} /> Detected Languages</h3>
              <div className="tag-list">
                {scanResult.languages.map((lang) => (
                  <span className="tag" key={lang}>{lang}</span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(files) && files.length > 0 && (
            <div className="data-section">
              <h3><FileText size={13} /> Files <span style={{ color: "var(--color-text-muted)", fontSize: 11, fontWeight: 400 }}>(first 30)</span></h3>
              <div className="file-list">
                {files.slice(0, 30).map((file, i) => {
                  const name = typeof file === "string" ? file : file.path || file.name || "Unknown";
                  return (
                    <div className="file-row" key={i}>
                      <ChevronRight size={11} color="var(--color-text-muted)" />
                      <span>{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Code Analysis */}
      {analysisResult && (
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Code2 size={14} color="var(--color-purple)" /> Code Intelligence (AST)
          </div>

          <div className="metrics-grid">
            {[
              { label: "Functions", value: Array.isArray(functions) ? functions.length : (functions || 0) },
              { label: "Classes",   value: Array.isArray(classes)   ? classes.length   : (classes   || 0) },
              { label: "Imports",   value: analysisResult.imports?.length || 0 },
              { label: "Status",    value: "Analyzed" },
            ].map(({ label, value }) => (
              <div className="metric-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {functions.length > 0 && (
            <div className="data-section">
              <h3><Code2 size={13} /> Functions <span style={{ color: "var(--color-text-muted)", fontSize: 11, fontWeight: 400 }}>(first 40)</span></h3>
              <div className="symbol-grid">
                {functions.slice(0, 40).map((item, i) => {
                  const name = typeof item === "string" ? item : item.name || "Unknown";
                  return (
                    <div className="symbol-card" key={i}>
                      <span className="symbol-type">Function</span>
                      <strong>{name}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {classes.length > 0 && (
            <div className="data-section">
              <h3><Layers size={13} /> Classes <span style={{ color: "var(--color-text-muted)", fontSize: 11, fontWeight: 400 }}>(first 40)</span></h3>
              <div className="symbol-grid">
                {classes.slice(0, 40).map((item, i) => {
                  const name = typeof item === "string" ? item : item.name || "Unknown";
                  return (
                    <div className="symbol-card" key={i}>
                      <span className="symbol-type" style={{ color: "var(--color-purple)" }}>Class</span>
                      <strong>{name}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}