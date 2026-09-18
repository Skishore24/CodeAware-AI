import { useState, useEffect } from "react";
import {
  GitCommit,
  GitBranch,
  Search,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  FileCode,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  FolderGit2,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { getCommits, getCommitDetails } from "../api/git";
import { useToast } from "../components/Toast";
import BranchSelector from "../components/git/BranchSelector";
import ButtonSpinner from "../components/common/ButtonSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function CommitsHistory() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [branch, setBranch] = useState("main");
  const [commits, setCommits] = useState([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  // Selected commit modal state
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDetails, setCommitDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCommits = async (targetBranch = branch) => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const res = await getCommits(activeRepo.name, {
        branch: targetBranch,
        limit: 100,
        search: searchQuery.trim() || undefined,
      });
      if (res?.success) {
        setCommits(res.commits || []);
        setTotalCommits(res.total_commits || 0);
        if (res.current_branch) {
          setBranch(res.current_branch);
        }
      } else {
        addToast(res?.error || "Failed to load commits", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to fetch Git commits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits(branch);
  }, [activeRepo?.name, branch]);

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    fetchCommits(newBranch);
  };

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenCommit = async (commit) => {
    setSelectedCommit(commit);
    setLoadingDetails(true);
    try {
      const res = await getCommitDetails(commit.hash, activeRepo.name);
      if (res?.success) {
        setCommitDetails(res);
      }
    } catch (err) {
      addToast("Failed to fetch commit diff details", "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Group commits by date (GitHub style: "Commits on Sep 17, 2026")
  const groupedCommits = commits.reduce((groups, commit) => {
    const groupKey = commit.date_group || "Recent Commits";
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(commit);
    return groups;
  }, {});

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={GitCommit}
          title="No Repository Active"
          description="Select or connect a Git repository to view branches, commit history, and code changes like on GitHub."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-primary" style={{ fontSize: "11px" }}>
              Git Version Control
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {activeRepo.name}
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            Commit History & Branches
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Inspect branches, commit messages, and full code diffs with GitHub-style tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Branch Selector */}
          <BranchSelector
            activeRepo={activeRepo}
            selectedBranch={branch}
            onSelectBranch={handleBranchChange}
          />

          <button
            className={`btn btn-secondary ${loading ? "btn-loading" : ""}`}
            onClick={() => fetchCommits(branch)}
            disabled={loading}
            title="Refresh commit history"
          >
            {loading ? <ButtonSpinner size={14} /> : <RefreshCw size={14} />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* GitHub-style Filters & Stats Bar */}
      <div
        className="card"
        style={{
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          backgroundColor: "var(--bg-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
            <GitCommit size={16} color="var(--primary)" />
            <span>{totalCommits}</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>commits on branch</span>
            <span style={{ fontFamily: "JetBrains Mono", color: "var(--primary)" }}>{branch}</span>
          </div>
        </div>

        {/* Search commits filter */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={14} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            className="input input-sm"
            placeholder="Search commit messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchCommits(branch);
            }}
            style={{ paddingLeft: "30px", fontSize: "12.5px" }}
          />
        </div>
      </div>

      {/* Commits Timeline Grouped by Date (GitHub style) */}
      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
          <ButtonSpinner size={24} />
          <div style={{ marginTop: "12px", fontSize: "13.5px", fontWeight: 600 }}>
            Fetching commits from Git repository...
          </div>
        </div>
      ) : commits.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <GitCommit size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Commits Found</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            No commits match the filter on branch <strong>{branch}</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(groupedCommits).map(([dateGroup, dateCommits]) => (
            <div key={dateGroup}>
              {/* Date Group Heading (GitHub style) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  paddingLeft: "4px",
                }}
              >
                <GitCommit size={14} color="var(--primary)" />
                <span>Commits on {dateGroup}</span>
              </div>

              {/* Commits Container */}
              <div
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                }}
              >
                {dateCommits.map((commit, idx) => {
                  const isLast = idx === dateCommits.length - 1;
                  const isCopied = copiedHash === commit.hash;

                  return (
                    <div
                      key={commit.hash}
                      style={{
                        padding: "14px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                      className="card-interactive"
                      onClick={() => handleOpenCommit(commit)}
                    >
                      {/* Left: Commit message & Author details */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0, flex: 1 }}>
                        {/* Author Circle */}
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary-text)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 800,
                            flexShrink: 0,
                            border: "1px solid var(--primary-border)",
                            marginTop: "2px",
                          }}
                        >
                          {commit.author_initials || "GH"}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          {/* Commit Headline */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-main)",
                                lineHeight: "1.4",
                              }}
                            >
                              {commit.message}
                            </span>

                            {commit.verified && (
                              <span
                                className="badge badge-success"
                                style={{
                                  fontSize: "10.5px",
                                  padding: "1px 6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <ShieldCheck size={11} />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          {/* Author & Timestamp info */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              marginTop: "4px",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {commit.author_name}
                            </span>
                            <span>committed {commit.date_relative}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & Short Hash */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {/* Copy Hash Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleCopyHash(commit.hash, e)}
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 8px",
                          }}
                          title="Copy commit SHA"
                        >
                          <span>{commit.short_hash}</span>
                          {isCopied ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-muted)" />}
                        </button>

                        {/* View Diff Button */}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenCommit(commit)}
                          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px" }}
                        >
                          <FileCode size={13} />
                          <span>View Diff</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commit Details & Diff Modal */}
      {selectedCommit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "20px",
          }}
          onClick={() => setSelectedCommit(null)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
              boxShadow: "var(--shadow-2xl)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: "var(--bg-subtle)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <GitCommit size={16} color="var(--primary)" />
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>
                    {selectedCommit.short_hash}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {selectedCommit.date}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  {selectedCommit.message}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Committed by <strong>{selectedCommit.author_name}</strong> ({selectedCommit.author_email})
                </div>
              </div>

              <button
                className="btn-icon"
                onClick={() => setSelectedCommit(null)}
                style={{ cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {loadingDetails ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  <ButtonSpinner size={20} />
                  <div style={{ marginTop: "8px", fontSize: "13px" }}>Loading commit diff & changed files...</div>
                </div>
              ) : commitDetails ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* File Stats Summary */}
                  {commitDetails.stats && (
                    <div
                      style={{
                        backgroundColor: "var(--bg-muted)",
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "12px",
                        color: "var(--text-main)",
                        whiteSpace: "pre-wrap",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {commitDetails.stats}
                    </div>
                  )}

                  {/* Unified Diff */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--text-main)" }}>
                      Unified Code Changes:
                    </div>
                    <pre
                      style={{
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "12px",
                        color: "var(--text-main)",
                        overflowX: "auto",
                        lineHeight: "1.5",
                        maxHeight: "380px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {commitDetails.diff ? (
                        commitDetails.diff.split("\n").map((line, lIdx) => {
                          let color = "var(--text-main)";
                          let bg = "transparent";
                          if (line.startsWith("+") && !line.startsWith("+++")) {
                            color = "var(--success)";
                            bg = "color-mix(in srgb, var(--success) 10%, transparent)";
                          } else if (line.startsWith("-") && !line.startsWith("---")) {
                            color = "var(--error)";
                            bg = "color-mix(in srgb, var(--error) 10%, transparent)";
                          } else if (line.startsWith("@@")) {
                            color = "var(--primary)";
                          }
                          return (
                            <div key={lIdx} style={{ color, backgroundColor: bg, padding: "1px 4px", borderRadius: "2px" }}>
                              {line}
                            </div>
                          );
                        })
                      ) : (
                        <div>No code diff recorded for this commit.</div>
                      )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)" }}>No details available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
