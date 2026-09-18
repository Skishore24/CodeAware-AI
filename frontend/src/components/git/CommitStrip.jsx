import { useState, useEffect } from "react";
import { GitCommit, ShieldCheck, Clock, Copy, Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getCommits } from "../../api/git";

export default function CommitStrip({ activeRepo, branch = "main" }) {
  const [latestCommit, setLatestCommit] = useState(null);
  const [totalCommits, setTotalCommits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeRepo) return;
    setLoading(true);
    getCommits(activeRepo.name, { branch, limit: 1 })
      .then((res) => {
        if (res?.success && res.commits?.length > 0) {
          setLatestCommit(res.commits[0]);
          setTotalCommits(res.total_commits || res.commits.length);
        }
      })
      .catch((err) => console.warn("Could not load latest commit:", err))
      .finally(() => setLoading(false));
  }, [activeRepo?.name, branch]);

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "var(--bg-subtle)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-muted)",
          fontSize: "12.5px",
        }}
      >
        <GitCommit size={15} className="spin" color="var(--primary)" />
        <span>Loading latest repository commit...</span>
      </div>
    );
  }

  if (!latestCommit) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        backgroundColor: "var(--bg-subtle)",
        borderColor: "var(--border-color)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Left side: Author & Commit Message */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        {/* Author Avatar circle */}
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 800,
            flexShrink: 0,
            border: "1px solid var(--primary-border)",
          }}
          title={latestCommit.author_email || latestCommit.author_name}
        >
          {latestCommit.author_initials || "GH"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
            {latestCommit.author_name}
          </span>

          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              fontWeight: 500,
              maxWidth: "460px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={latestCommit.message}
          >
            {latestCommit.message}
          </span>

          {latestCommit.verified && (
            <span
              className="badge badge-success"
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Verified commit signature"
            >
              <ShieldCheck size={11} />
              <span>Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Right side: Commit Hash, Timestamp, and Commits counter */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* Short Hash & Copy */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={(e) => handleCopyHash(latestCommit.hash, e)}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
            color: "var(--text-secondary)",
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            backgroundColor: "var(--bg-muted)",
            borderRadius: "var(--radius-sm)",
          }}
          title="Copy full commit SHA"
        >
          <span>{latestCommit.short_hash}</span>
          {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-muted)" />}
        </button>

        {/* Relative Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
          <Clock size={12} />
          <span>{latestCommit.date_relative}</span>
        </div>

        {/* Total Commits Link (GitHub style) */}
        <Link
          to="/commits"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12.5px",
            fontWeight: 700,
            color: "var(--primary)",
            textDecoration: "none",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--primary-light)",
            border: "1px solid var(--primary-border)",
            transition: "all 0.15s ease",
          }}
          title="View all Git commit history like GitHub"
        >
          <GitCommit size={14} />
          <span>{totalCommits} commits</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
