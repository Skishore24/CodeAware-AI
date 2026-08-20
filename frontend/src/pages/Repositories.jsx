import { useState } from "react";
import {
  FolderGit2,
  GitBranch,
  Search,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Loader2,
  ExternalLink,
  Code2,
  FileCode2,
  Sparkles,
  Layers,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { cloneAndIngest } from "../api/repositories";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function Repositories() {
  const navigate = useNavigate();
  const { repositories, activeRepo, setActiveRepo, refreshRepositories, loadingRepos } = useRepo();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("git"); // 'git' | 'samples'
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneStage, setCloneStage] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const sampleRepositories = [
    {
      name: "FastAPI Clean Architecture",
      url: "https://github.com/tiangolo/fastapi.git",
      desc: "Modern, high-performance web framework for building APIs with Python.",
      lang: "Python",
      tag: "API & Backend",
    },
    {
      name: "Flask Minimal REST",
      url: "https://github.com/pallets/flask.git",
      desc: "Micro web framework written in Python with modular routing.",
      lang: "Python",
      tag: "Web Framework",
    },
    {
      name: "Express JS Starter",
      url: "https://github.com/expressjs/express.git",
      desc: "Fast, unopinionated, minimalist web framework for Node.js.",
      lang: "JavaScript",
      tag: "Node.js",
    },
  ];

  const handleClone = async (targetUrl) => {
    const url = (targetUrl || cloneUrl).trim();
    if (!url) return;

    setCloning(true);
    setCloneStage("Cloning git repository to local workspace...");

    try {
      setCloneStage("Scanning files & building AST symbol index...");
      const res = await cloneAndIngest(url);
      if (res?.success) {
        addToast("Repository cloned and ingested successfully!", "success");
        setCloneUrl("");
        await refreshRepositories();
        if (res.repository) {
          setActiveRepo(res.repository);
        }
      } else {
        addToast(res?.error || "Cloning failed", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to clone repository", "error");
    } finally {
      setCloning(false);
      setCloneStage("");
    }
  };

  const filteredRepos = repositories.filter((r) =>
    r.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Repositories & Ingestion</h1>
          <p className="page-subtitle">
            Clone, ingest, and index local or remote codebases for AST symbol navigation and agent intelligence.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refreshRepositories} disabled={loadingRepos}>
            <RefreshCw size={14} className={loadingRepos ? "animate-spin" : ""} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* Clone & Ingest Wizard Card */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="tab-nav" style={{ marginBottom: "var(--space-4)" }}>
          <button
            className={`tab-btn ${activeTab === "git" ? "active" : ""}`}
            onClick={() => setActiveTab("git")}
          >
            <FolderGit2 size={15} />
            <span>Clone Git Repository</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "samples" ? "active" : ""}`}
            onClick={() => setActiveTab("samples")}
          >
            <Sparkles size={15} />
            <span>Sample Repositories</span>
          </button>
        </div>

        {activeTab === "git" ? (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleClone(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="input"
                placeholder="https://github.com/owner/repository.git"
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                disabled={cloning}
                style={{ flex: 1, padding: "10px 14px" }}
              />
              <button type="submit" className="btn btn-primary btn-lg" disabled={cloning || !cloneUrl.trim()}>
                {cloning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{cloneStage || "Ingesting..."}</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Clone & Ingest</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
              Clones repository locally into the workspace, performs AST parsing, creates TF-IDF chunks, and maps knowledge graphs.
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {sampleRepositories.map((sample, idx) => (
              <div key={idx} className="card" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>{sample.name}</span>
                  <span className="badge badge-primary" style={{ fontSize: "11px" }}>{sample.lang}</span>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "14px", lineHeight: "1.4" }}>
                  {sample.desc}
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%" }}
                  disabled={cloning}
                  onClick={() => handleClone(sample.url)}
                >
                  <FolderGit2 size={13} />
                  <span>Ingest this repo</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {cloning && (
          <div className="timeline" style={{ marginTop: "var(--space-4)", backgroundColor: "var(--bg-subtle)" }}>
            <div className="timeline-step">
              <span className="timeline-dot completed"></span>
              <span style={{ fontWeight: 600 }}>Step 1:</span>
              <span>Validating Git Target</span>
            </div>
            <div className="timeline-step">
              <span className="timeline-dot running"></span>
              <span style={{ fontWeight: 600 }}>Step 2:</span>
              <span>{cloneStage || "Executing clone and AST symbol parsing..."}</span>
            </div>
            <div className="timeline-step">
              <span className="timeline-dot"></span>
              <span style={{ fontWeight: 600 }}>Step 3:</span>
              <span>Vectorizing Chunks & Building Knowledge Graph</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Active Count Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <div style={{ position: "relative", width: "320px" }}>
          <input
            type="text"
            className="input"
            placeholder="Filter indexed repositories..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ paddingLeft: "34px" }}
          />
          <Search size={16} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
          {filteredRepos.length} workspace repositor{filteredRepos.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Repositories Grid */}
      {filteredRepos.length === 0 ? (
        <div className="card" style={{ padding: "50px 20px", textAlign: "center" }}>
          <FolderGit2 size={44} color="var(--text-subtle)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>No repositories indexed yet</h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Clone a public GitHub repository or ingest a sample repository above to start analyzing code.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredRepos.map((repo) => {
            const isActive = activeRepo?.name === repo.name;
            return (
              <div
                key={repo.name}
                className="card"
                style={{
                  borderColor: isActive ? "var(--primary)" : "var(--border-color)",
                  boxShadow: isActive ? "0 0 0 2px var(--primary-light), var(--shadow-sm)" : "var(--shadow-xs)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isActive ? "var(--primary-light)" : "var(--bg-muted)",
                          color: isActive ? "var(--primary)" : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FolderGit2 size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)" }}>
                        {repo.name}
                      </span>
                    </div>
                    {isActive ? (
                      <span className="badge badge-primary">Active</span>
                    ) : (
                      <span className="badge badge-neutral">Indexed</span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "var(--text-muted)", margin: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Indexed Files</span>
                      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                        {repo.files_count ? `${repo.files_count} files` : "Ready"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Intelligence Status</span>
                      <span style={{ color: "var(--success)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  {isActive ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate("/search")}>
                      <Search size={13} />
                      <span>Search Code</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setActiveRepo(repo);
                        addToast(`Switched active repository to ${repo.name}`, "info");
                      }}
                    >
                      <span>Set as Active</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}