import { useState } from "react";
import {
  FolderGit2,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  Loader2,
  ArrowRight,
  ShieldCheck,
  GitGraph,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { cloneAndIngest, deleteRepository } from "../api/repositories";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/feedback/EmptyState";
import { CardSkeleton } from "../components/feedback/Skeleton";

export default function Repositories() {
  const navigate = useNavigate();
  const { repositories, activeRepo, setActiveRepo, refreshRepositories, loadingRepos } = useRepo();
  const { addToast } = useToast();

  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneStage, setCloneStage] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const sampleRepositories = [
    {
      name: "FastAPI Clean Architecture",
      url: "https://github.com/tiangolo/fastapi.git",
      desc: "High-performance modern Python API framework with type hints.",
      lang: "Python",
      tag: "API & Backend",
    },
    {
      name: "Flask Minimal REST",
      url: "https://github.com/pallets/flask.git",
      desc: "Micro web framework in Python with modular routing and templates.",
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
    if (!url) {
      addToast("Please enter a valid Git repository URL.", "warning");
      return;
    }

    setCloning(true);
    setCloneStage("Cloning repository into local workspace...");

    try {
      setCloneStage("Scanning AST symbols and building search index...");
      const res = await cloneAndIngest(url);
      if (res?.success) {
        addToast(`Repository "${res.repository_name || 'project'}" cloned and indexed successfully!`, "success");
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

  const handleDeleteRepo = async (repoName) => {
    if (!repoName) return;
    setDeleting(true);
    try {
      const res = await deleteRepository(repoName);
      if (res?.success) {
        addToast(`Repository "${repoName}" removed successfully.`, "success");
        setRepoToDelete(null);
        await refreshRepositories();
      } else {
        addToast(res?.error || "Failed to remove repository.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to remove repository.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRepos = (repositories || []).filter((r) =>
    r.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            Repository Management & Ingestion
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Connect GitHub repositories or local codebases to build AST symbol maps, hybrid vector search, and dependency graphs.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={refreshRepositories}
          disabled={loadingRepos}
          title="Refresh repository list"
        >
          <RefreshCw size={14} className={loadingRepos ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Connect New Repository Card */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
          <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            <Plus size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Connect a Repository</h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              Paste any GitHub repository HTTPS or SSH clone URL. CodeAware will clone, parse AST symbols, and index it.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleClone();
          }}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="https://github.com/username/repository.git"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              disabled={cloning}
              style={{ paddingLeft: "36px" }}
            />
            <FolderGit2
              size={16}
              color="var(--text-subtle)"
              style={{ position: "absolute", left: "12px", top: "11px" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={cloning || !cloneUrl.trim()}
          >
            {cloning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Ingesting...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Clone & Ingest</span>
              </>
            )}
          </button>
        </form>

        {cloning && (
          <div style={{ marginTop: "14px", padding: "10px 14px", backgroundColor: "var(--primary-light)", borderRadius: "var(--radius-md)", border: "1px solid var(--primary-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Loader2 size={16} className="animate-spin" color="var(--primary)" />
            <span style={{ fontSize: "12.5px", color: "var(--primary-text)", fontWeight: 600 }}>
              {cloneStage}
            </span>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div style={{ marginTop: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
            Or try one of these sample open-source repositories:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {sampleRepositories.map((sample, idx) => (
              <div
                key={idx}
                className="card card-interactive"
                style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => {
                  setCloneUrl(sample.url);
                  handleClone(sample.url);
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{sample.name}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {sample.desc}
                  </div>
                  <span className="badge badge-neutral" style={{ marginTop: "6px", fontSize: "10.5px" }}>
                    {sample.lang} • {sample.tag}
                  </span>
                </div>
                <ArrowRight size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloned Repositories Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800 }}>Cloned Repositories</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {repositories.length} {repositories.length === 1 ? "repository" : "repositories"} available in your local workspace.
            </p>
          </div>

          {repositories.length > 0 && (
            <div style={{ position: "relative", width: "240px" }}>
              <input
                type="text"
                className="input"
                placeholder="Filter repositories..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: "32px", fontSize: "12.5px" }}
              />
              <Search size={14} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            </div>
          )}
        </div>

        {loadingRepos ? (
          <div className="grid-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredRepos.length === 0 ? (
          repositories.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No Repositories Cloned Yet"
              description="Clone a GitHub repository using the input box above or choose a sample repository to start exploring AST symbols, code search, and security reviews."
              actionText="Clone Sample Repo (FastAPI)"
              onAction={() => handleClone("https://github.com/tiangolo/fastapi.git")}
            />
          ) : (
            <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No repositories match "{searchFilter}"
            </div>
          )
        ) : (
          <div className="grid-3">
            {filteredRepos.map((repo) => {
              const isActive = activeRepo?.name === repo.name || activeRepo?.path === repo.path;
              return (
                <div
                  key={repo.name}
                  className="card"
                  style={{
                    padding: "var(--space-5)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderColor: isActive ? "var(--primary)" : "var(--border-color)",
                    backgroundColor: isActive ? "var(--bg-surface)" : "var(--bg-card)",
                    boxShadow: isActive ? "0 0 0 1px var(--primary), var(--shadow-md)" : "var(--shadow-sm)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: isActive ? "var(--primary-light)" : "var(--bg-muted)",
                            color: isActive ? "var(--primary)" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FolderGit2 size={16} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>{repo.name}</h3>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                            {repo.files_count ? `${repo.files_count} source files` : "Indexed"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isActive ? (
                          <span className="badge badge-success" style={{ fontSize: "11px" }}>
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
                            Ready
                          </span>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepoToDelete(repo);
                          }}
                          title={`Remove ${repo.name}`}
                          style={{ color: "var(--text-subtle)", padding: "4px 6px" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", wordBreak: "break-all", marginBottom: "14px" }}>
                      {repo.path}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className={`btn ${isActive ? "btn-primary" : "btn-secondary"} btn-sm`}
                        style={{ flex: 1 }}
                        onClick={() => {
                          setActiveRepo(repo);
                          addToast(`Switched active repository to ${repo.name}`, "info");
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isActive ? "Active Workspace" : "Activate"}</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveRepo(repo);
                          navigate("/search");
                        }}
                        title="Search this repository"
                      >
                        <Search size={13} />
                        <span>Search</span>
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: "11.5px" }}
                        onClick={() => {
                          setActiveRepo(repo);
                          navigate("/review");
                        }}
                      >
                        <ShieldCheck size={12} />
                        <span>Review</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: "11.5px" }}
                        onClick={() => {
                          setActiveRepo(repo);
                          navigate("/graph");
                        }}
                      >
                        <GitGraph size={12} />
                        <span>Graph</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "#EF4444", fontSize: "11.5px", padding: "4px 8px" }}
                        onClick={() => setRepoToDelete(repo)}
                        title="Remove cloned repository"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {repoToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={() => !deleting && setRepoToDelete(null)}
        >
          <div
            className="card"
            style={{
              width: "440px",
              maxWidth: "92%",
              padding: "24px",
              boxShadow: "var(--shadow-xl)",
              animation: "scaleIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                  Remove Cloned Repository?
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  Are you sure you want to remove <strong style={{ color: "var(--text-main)" }}>{repoToDelete.name}</strong> from your local workspace? This will safely delete the local cloned files and indices.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                fontSize: "12px",
                fontFamily: "JetBrains Mono",
                color: "var(--text-muted)",
                wordBreak: "break-all",
                marginBottom: "20px",
              }}
            >
              {repoToDelete.path}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRepoToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{ backgroundColor: "#EF4444", color: "white", borderColor: "#EF4444" }}
                onClick={() => handleDeleteRepo(repoToDelete.name)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Repository</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}