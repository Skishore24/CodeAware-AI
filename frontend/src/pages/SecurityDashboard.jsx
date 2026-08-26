import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runSecurityScan } from "../api/security";
import { useToast } from "../components/Toast";
import SourceViewer from "../components/SourceViewer";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/feedback/EmptyState";
import { CardSkeleton } from "../components/feedback/Skeleton";

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRunScan = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await runSecurityScan(activeRepo.name);
      setSecurityData(data);
      if (data?.findings?.length > 0) {
        setSelectedFinding(data.findings[0]);
      }
      addToast("OWASP security audit completed.", "success");
    } catch (err) {
      addToast(err.message || "Security scan failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRepo) {
      handleRunScan();
    }
  }, [activeRepo]);

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={ShieldAlert}
          title="No Repository Active for Security Audit"
          description="Select or connect a repository to run static OWASP vulnerability checks, secret scans, and injection audits."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  const findings = securityData?.findings || [];
  const rawData = securityData?.raw_data || {};
  const criticalCount = rawData.critical || findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = rawData.high || findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = rawData.medium || findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = rawData.low || findings.filter((f) => f.severity === "LOW").length;

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (f.message || f.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.file || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.type || f.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="badge badge-danger"><AlertOctagon size={12} /> CRITICAL</span>;
      case "HIGH":
        return <span className="badge badge-danger"><AlertTriangle size={12} /> HIGH</span>;
      case "MEDIUM":
        return <span className="badge badge-warning"><AlertTriangle size={12} /> MEDIUM</span>;
      default:
        return <span className="badge badge-info"><ShieldCheck size={12} /> LOW</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            Security & Vulnerability Audit
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Auditing codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> for OWASP Top 10 vulnerabilities, injection flaws, and leaked credentials.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleRunScan} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{loading ? "Auditing Codebase..." : "Re-Scan Security"}</span>
          </button>
        </div>
      </div>

      {/* Top Severity Summary Cards */}
      <div className="grid-4">
        <div className="metric-card" style={{ borderColor: criticalCount > 0 ? "var(--error-border)" : "var(--border-color)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--error)" }}>CRITICAL SEVERITY</div>
          <div className="metric-value" style={{ color: criticalCount > 0 ? "var(--error)" : "var(--text-main)" }}>
            {criticalCount}
          </div>
          <div className="metric-sub">RCE, SQL injection, secrets</div>
        </div>

        <div className="metric-card" style={{ borderColor: highCount > 0 ? "var(--warning-border)" : "var(--border-color)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--warning)" }}>HIGH SEVERITY</div>
          <div className="metric-value" style={{ color: highCount > 0 ? "var(--warning)" : "var(--text-main)" }}>
            {highCount}
          </div>
          <div className="metric-sub">Unsafe deserialization, auth bypass</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--info)" }}>MEDIUM SEVERITY</div>
          <div className="metric-value">{mediumCount}</div>
          <div className="metric-sub">Missing sanitization, bare exceptions</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)" }}>LOW / ADVISORY</div>
          <div className="metric-value">{lowCount}</div>
          <div className="metric-sub">Code style, debug flags</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginRight: "4px" }}>Filter:</span>
          {["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              className={`btn ${severityFilter === sev ? "btn-primary" : "btn-ghost"} btn-sm`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: "240px" }}>
          <input
            type="text"
            className="input"
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "30px", fontSize: "12.5px" }}
          />
          <Search size={13} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
        </div>
      </div>

      {/* Main Content Split */}
      {loading ? (
        <div className="grid-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : findings.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--success)" }}>
          <ShieldCheck size={40} style={{ margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Zero Vulnerabilities Detected</h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
            The scanned codebase contains no known OWASP Top 10 vulnerabilities or exposed secrets.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "var(--space-4)" }}>
          {/* Findings List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto" }}>
            {filteredFindings.map((finding, idx) => {
              const isSelected = selectedFinding === finding;
              return (
                <div
                  key={idx}
                  className="card card-interactive"
                  onClick={() => setSelectedFinding(finding)}
                  style={{
                    padding: "14px",
                    borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                    backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    {getSeverityBadge(finding.severity)}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                      Line {finding.line || finding.line_number || "N/A"}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                    {finding.type || finding.message || "Security Finding"}
                  </h4>

                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", wordBreak: "break-all" }}>
                    {finding.file || finding.file_path}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Finding Details & Source Viewer */}
          <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "16px" }}>
            {selectedFinding ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ marginBottom: "6px" }}>{getSeverityBadge(selectedFinding.severity)}</div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800 }}>
                      {selectedFinding.type || selectedFinding.message}
                    </h3>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginTop: "2px" }}>
                      {selectedFinding.file || selectedFinding.file_path} {selectedFinding.line ? `:${selectedFinding.line}` : ""}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      navigate("/autonomous", {
                        state: {
                          targetFile: selectedFinding.file || selectedFinding.file_path,
                          targetProblem: `Fix security issue: ${selectedFinding.message || selectedFinding.type}. ${selectedFinding.recommendation || ''}`,
                        },
                      })
                    }
                  >
                    <Wrench size={13} />
                    <span>Generate Fix</span>
                  </button>
                </div>

                <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Why It Matters
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {selectedFinding.message || "Vulnerabilities of this nature can lead to unauthorized code execution, data exposure, or privilege escalation."}
                  </p>
                </div>

                {selectedFinding.recommendation && (
                  <div style={{ padding: "12px", backgroundColor: "var(--success-light)", borderRadius: "var(--radius-md)", border: "1px solid var(--success-border)" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--success-text)", textTransform: "uppercase", marginBottom: "4px" }}>
                      Recommended Remediation
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--success-text)", lineHeight: "1.5" }}>
                      {selectedFinding.recommendation}
                    </p>
                  </div>
                )}

                {/* Source Viewer */}
                <div style={{ flex: 1, minHeight: "220px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <SourceViewer
                    repositoryName={activeRepo.name}
                    filePath={selectedFinding.file || selectedFinding.file_path}
                    targetLine={selectedFinding.line || selectedFinding.line_number}
                  />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                Select a finding on the left to view detailed risk analysis and code.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
