import { useState, useEffect } from "react";
import {
  Bug as BugIcon,
  CheckCircle2,
  RefreshCw,
  Filter,
  Wrench,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileCode,
} from "lucide-react";
import { scanBugs, listBugs } from "../api/bugs";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import SourceViewer from "../components/SourceViewer";
import ButtonSpinner from "../components/common/ButtonSpinner";
import PremiumLoader from "../components/common/PremiumLoader";

export default function Bugs() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [expandedBugIdx, setExpandedBugIdx] = useState(null);

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const res = await listBugs({ repository_name: activeRepo?.name });
      if (res && res.success) {
        setBugs(res.bugs || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    addToast("Scanning repository for syntax, logic, and runtime bugs...", "info");
    try {
      const res = await scanBugs({
        repository_path: activeRepo?.path || ".",
        repository_name: activeRepo?.name || "default",
      });
      if (res && res.success) {
        setBugs(res.findings || []);
        addToast(`Scan complete. Found ${res.findings?.length || 0} issues.`, "success");
      }
    } catch (err) {
      addToast(err.message || "Bug scan failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [activeRepo]);

  const filteredBugs = bugs.filter((b) => {
    if (filterSeverity === "ALL") return true;
    return (b.severity || "").toUpperCase() === filterSeverity;
  });

  const toggleExpand = (idx) => {
    setExpandedBugIdx(expandedBugIdx === idx ? null : idx);
  };

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>Bug Detection &amp; Classification</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            Deterministic AST checking and rule-based diagnostic analysis across source code.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`btn btn-secondary ${loading ? "btn-loading" : ""}`}
            onClick={fetchBugs}
            disabled={loading}
          >
            {loading ? <ButtonSpinner size={14} /> : <RefreshCw size={15} />}
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? <ButtonSpinner size={14} /> : <BugIcon size={15} />}
            <span>{loading ? "Scanning for Bugs..." : "Run Bug Scan"}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <Filter size={15} color="var(--text-muted)" />
        <span style={{ fontSize: "12.5px", fontWeight: 600 }}>Filter Severity:</span>
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
          <button
            key={sev}
            className={`badge ${filterSeverity === sev ? "badge-primary" : "badge-neutral"}`}
            style={{ cursor: "pointer" }}
            onClick={() => setFilterSeverity(sev)}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Bugs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div className="card" style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
            <PremiumLoader
              size="md"
              title="Scanning Codebase for Bugs"
              subtitle={`Executing AST checks and diagnostic static analysis across ${activeRepo?.name || 'repository'}...`}
              icon={BugIcon}
              steps={[
                { label: "Parsing AST Syntax & Error Handlers", icon: FileCode },
                { label: "Validating Control Flow & Invariants", icon: CheckCircle2 },
                { label: "Classifying Diagnostic Bugs by Severity", icon: BugIcon },
              ]}
            />
          </div>
        ) : filteredBugs.length > 0 ? (
          filteredBugs.map((bug, idx) => {
            const isExpanded = expandedBugIdx === idx;
            const targetLineNum = Number(bug.line || bug.line_number || 1);
            const filePath = bug.file || bug.file_path;

            return (
              <div key={idx} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className={`badge ${bug.severity === "CRITICAL" ? "badge-danger" : bug.severity === "HIGH" ? "badge-warning" : "badge-neutral"}`}>
                      {bug.severity || "MEDIUM"}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>
                      {bug.type || bug.bug_type || "Defect"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-main)",
                        fontFamily: "'JetBrains Mono', monospace",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "var(--bg-subtle)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <MapPin size={11} color="var(--primary)" />
                      {filePath} : <strong style={{ color: "var(--primary)" }}>Line {targetLineNum}</strong>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleExpand(idx)}
                      style={{ fontSize: "11.5px", padding: "4px 8px" }}
                    >
                      <FileCode size={13} />
                      <span>{isExpanded ? "Hide Code" : "Inspect Code"}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        navigate("/autonomous", {
                          state: {
                            targetFile: filePath,
                            targetProblem: `Fix bug at line ${targetLineNum} in ${filePath}: ${bug.message || bug.type}. ${bug.recommendation || ''}`,
                          },
                        })
                      }
                      style={{ fontSize: "11.5px", padding: "4px 10px" }}
                    >
                      <Wrench size={13} />
                      <span>Fix</span>
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "13.5px", color: "var(--text-main)", margin: "0 0 10px", lineHeight: "1.5" }}>
                  {bug.message}
                </p>

                {bug.code && !isExpanded && (
                  <div
                    style={{
                      backgroundColor: "#0B0F19",
                      color: "#FCA5A5",
                      borderLeft: "3px solid #EF4444",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      marginBottom: "10px",
                      overflowX: "auto",
                    }}
                  >
                    <code>Line {targetLineNum}: {bug.code}</code>
                  </div>
                )}

                {bug.recommendation && (
                  <div style={{ fontSize: "12.5px", color: "var(--primary)", fontWeight: 500, marginBottom: isExpanded ? "12px" : 0 }}>
                    💡 Recommendation: {bug.recommendation}
                  </div>
                )}

                {isExpanded && activeRepo && filePath && (
                  <div style={{ marginTop: "12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <SourceViewer
                      repositoryName={activeRepo.name}
                      filePath={filePath}
                      targetLine={targetLineNum}
                      highlightLines={[targetLineNum]}
                      severity={bug.severity}
                      issueMessage={bug.message || bug.type}
                      maxHeight="320px"
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle2 size={36} color="var(--success)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
              No Active Bugs Detected
            </div>
            <p style={{ fontSize: "12.5px", margin: "6px 0 0" }}>
              The current codebase passed syntax and exception handling inspection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
