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
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { cloneAndIngest } from "../api/repositories";
import { useToast } from "../components/Toast";

export default function Repositories() {
  const { repositories, activeRepo, setActiveRepo, refreshRepositories, loadingRepos } = useRepo();
  const { addToast } = useToast();

  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneStage, setCloneStage] = useState(""); // Cloning, Scanning, Indexing, Graph Building, Ready
  const [filterQuery, setFilterQuery] = useState("");

  const handleClone = async (e) => {
    e.preventDefault();
    if (!cloneUrl.trim()) return;

    setCloning(true);
    setCloneStage("Cloning repository...");

    try {
      setCloneStage("Scanning files & building AST...");
      const res = await cloneAndIngest(cloneUrl.trim());
      if (res?.success) {
        addToast("Repository cloned and ingested successfully!", "success");
        setCloneUrl("");
        await refreshRepositories();
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
          <h1 className="page-title">Repositories</h1>
          <p className="page-subtitle">
            Manage, clone, and index codebases for local deterministic intelligence.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refreshRepositories} disabled={loadingRepos}>
            <RefreshCw size={14} className={loadingRepos ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Clone Input Card */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
          <Plus size={18} color="var(--primary)" />
          <span>Clone & Ingest New Repository</span>
        </h2>
        <form onSubmit={handleClone} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            className="input"
            placeholder="https://github.com/owner/repository.git"
            value={cloneUrl}
            onChange={(e) => setCloneUrl(e.target.value)}
            disabled={cloning}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={cloning || !cloneUrl.trim()}>
            {cloning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{cloneStage || "Ingesting..."}</span>
              </>
            ) : (
              <>
                <FolderGit2 size={16} />
                <span>Clone & Ingest</span>
              </>
            )}
          </button>
        </form>

        {cloning && (
          <div className="timeline" style={{ marginTop: "var(--space-4)" }}>
            <div className="timeline-step">
              <span className="timeline-dot completed"></span>
              <span>1. Validating GitHub Repository URL</span>
            </div>
            <div className="timeline-step">
              <span className="timeline-dot running"></span>
              <span>2. {cloneStage || "Executing clone and AST parsing..."}</span>
            </div>
            <div className="timeline-step">
              <span className="timeline-dot"></span>
              <span>3. Extracting Symbol Chunks & Building Knowledge Graph</span>
            </div>
          </div>
        )}
      </div>

      {/* Repository Filter & List */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <input
            type="text"
            className="input"
            placeholder="Filter repositories..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ paddingLeft: "34px" }}
          />
          <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "10px", top: "10px" }} />
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {filteredRepos.length} repository{filteredRepos.length === 1 ? "" : "ies"} available
        </span>
      </div>

      {/* Repositories Grid */}
      {filteredRepos.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <FolderGit2 size={40} color="#9CA3AF" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>No repositories found</h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Clone a public GitHub repository above to start indexing code.
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
                  boxShadow: isActive ? "0 0 0 2px var(--primary-light)" : "var(--shadow-sm)",
                }}
              >
                <div className="card-header" style={{ marginBottom: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FolderGit2 size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-main)" }}>
                      {repo.name}
                    </span>
                  </div>
                  {isActive && <span className="badge badge-primary">Active</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Files Indexed</span>
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{repo.files_count || "Indexed"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Status</span>
                    <span style={{ color: "var(--success)", fontWeight: 500 }}>Ready for Reasoning</span>
                  </div>
                </div>

                <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-primary"}`}
                    onClick={() => {
                      setActiveRepo(repo);
                      addToast(`Switched active repository to ${repo.name}`, "info");
                    }}
                  >
                    {isActive ? "Currently Active" : "Select Repository"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}