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
  MapPin,
  FileCode,
  Copy,
  Check,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runSecurityScan } from "../api/security";
import { useToast } from "../components/Toast";
import SourceViewer from "../components/SourceViewer";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/feedback/EmptyState";
import { CardSkeleton } from "../components/feedback/Skeleton";
import PremiumLoader from "../components/common/PremiumLoader";
import ButtonSpinner from "../components/common/ButtonSpinner";

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

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
  const criticalCount = rawData.critical ?? findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = rawData.high ?? findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = rawData.medium ?? findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = rawData.low ?? findings.filter((f) => f.severity === "LOW").length;

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (f.message || f.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.file || f.file_path || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.type || f.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.evidence || f.code || "").toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleCopyOffendingCode = (codeStr) => {
    if (!codeStr) return;
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
          <button
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={handleRunScan}
            disabled={loading}
          >
            {loading ? <ButtonSpinner size={15} /> : <RefreshCw size={15} />}
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
            placeholder="Search findings or files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "30px", fontSize: "12.5px" }}
          />
          <Search size={13} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
        </div>
      </div>

      {/* Main Content Split */}
      {loading ? (
        <div className="card" style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
          <PremiumLoader
            size="lg"
            title="Scanning Codebase for Security Vulnerabilities"
            subtitle={`Scanning ${activeRepo?.name || 'repository'} against OWASP Top 10, hardcoded secrets, and unsafe execution...`}
            icon={ShieldAlert}
            steps={[
              { label: "Checking Hardcoded API Keys & Auth Secrets", icon: ShieldAlert },
              { label: "Auditing SQL Injection & Command Execution", icon: AlertOctagon },
              { label: "Validating CORS, Insecure Transports & Deprecations", icon: ShieldCheck },
            ]}
          />
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
        <div className="responsive-split-view" style={{ flex: 1, minHeight: 0, alignItems: "stretch" }}>
          {/* Findings List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "calc(100vh - 280px)", minHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredFindings.map((finding, idx) => {
              const isSelected = selectedFinding === finding;
              const findingLine = finding.line || finding.line_number || "N/A";
              return (
                <div
                  key={idx}
                  className="card card-interactive"
                  onClick={() => setSelectedFinding(finding)}
                  style={{
                    padding: "14px",
                    borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                    backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    {getSeverityBadge(finding.severity)}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPin size={11} /> Line {findingLine}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                    {finding.type || finding.message || "Security Finding"}
                  </h4>

                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", wordBreak: "break-all" }}>
                    {finding.file || finding.file_path}
                  </div>

                  {(finding.evidence || finding.code) && (
                    <div
                      style={{
                        marginTop: "6px",
                        padding: "4px 8px",
                        backgroundColor: "#0B0F19",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "#94A3B8",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        borderLeft: "2px solid var(--primary)",
                      }}
                    >
                      {finding.evidence || finding.code}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Finding Details & Source Viewer */}
          <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "calc(100vh - 280px)", minHeight: "450px", overflowY: "auto" }}>
            {selectedFinding ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ marginBottom: "6px" }}>{getSeverityBadge(selectedFinding.severity)}</div>
                    <h3 style={{ fontSize: "17px", fontWeight: 800 }}>
                      {selectedFinding.type || selectedFinding.message}
                    </h3>
                    <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FileCode size={14} />
                      <span>{selectedFinding.file || selectedFinding.file_path}</span>
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>: Line {selectedFinding.line || selectedFinding.line_number}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      navigate("/autonomous", {
                        state: {
                          targetFile: selectedFinding.file || selectedFinding.file_path,
                          targetProblem: `Fix security issue at line ${selectedFinding.line || selectedFinding.line_number} in ${selectedFinding.file || selectedFinding.file_path}: ${selectedFinding.message || selectedFinding.type}. Code: ${selectedFinding.evidence || selectedFinding.code || ''}. ${selectedFinding.recommendation || ''}`,
                        },
                      })
                    }
                  >
                    <Wrench size={13} />
                    <span>Fix with Autonomous Agent</span>
                  </button>
                </div>

                {/* Prominent Exact Location & Offending Code Card */}
                <div
                  style={{
                    padding: "14px",
                    backgroundColor:
                      selectedFinding.severity === "CRITICAL" || selectedFinding.severity === "HIGH"
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(245, 158, 11, 0.08)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${
                      selectedFinding.severity === "CRITICAL" || selectedFinding.severity === "HIGH"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(245, 158, 11, 0.3)"
                    }`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color:
                          selectedFinding.severity === "CRITICAL" || selectedFinding.severity === "HIGH"
                            ? "var(--error)"
                            : "var(--warning)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertTriangle size={14} /> Exact Error Location In Repo
                    </span>

                    <span
                      style={{
                        fontSize: "11.5px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--text-main)",
                        backgroundColor: "var(--bg-card)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPin size={11} color="var(--primary)" />
                      {activeRepo.name} &gt; {selectedFinding.file || selectedFinding.file_path} : <strong>Line {selectedFinding.line || selectedFinding.line_number}</strong>
                    </span>
                  </div>

                  {(selectedFinding.evidence || selectedFinding.code) && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                          Offending Code on Line {selectedFinding.line || selectedFinding.line_number}:
                        </span>
                        <button
                          onClick={() => handleCopyOffendingCode(selectedFinding.evidence || selectedFinding.code)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "1px 6px", fontSize: "10.5px", height: "auto" }}
                        >
                          {copiedCode ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                          <span>{copiedCode ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: "10px 14px",
                          backgroundColor: "#0B0F19",
                          color:
                            selectedFinding.severity === "CRITICAL" || selectedFinding.severity === "HIGH"
                              ? "#FCA5A5"
                              : "#FDE68A",
                          borderRadius: "6px",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "12.5px",
                          overflowX: "auto",
                          borderLeft: `4px solid ${
                            selectedFinding.severity === "CRITICAL" || selectedFinding.severity === "HIGH"
                              ? "#EF4444"
                              : "#F59E0B"
                          }`,
                          lineHeight: "1.5",
                        }}
                      >
                        <code>{selectedFinding.evidence || selectedFinding.code}</code>
                      </pre>
                    </div>
                  )}
                </div>

                <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Why It Matters
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                    {selectedFinding.message || "Vulnerabilities of this nature can lead to unauthorized code execution, data exposure, or privilege escalation."}
                  </p>
                </div>

                {selectedFinding.recommendation && (
                  <div style={{ padding: "12px", backgroundColor: "var(--success-light)", borderRadius: "var(--radius-md)", border: "1px solid var(--success-border)" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--success-text)", textTransform: "uppercase", marginBottom: "4px" }}>
                      Recommended Remediation
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--success-text)", lineHeight: "1.5", margin: 0 }}>
                      {selectedFinding.recommendation}
                    </p>
                  </div>
                )}

                {/* Source Viewer with Auto-Scroll & Error Highlighting */}
                <div style={{ flex: 1, minHeight: "260px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <SourceViewer
                    repositoryName={activeRepo.name}
                    filePath={selectedFinding.file || selectedFinding.file_path}
                    targetLine={selectedFinding.line || selectedFinding.line_number}
                    highlightLines={[Number(selectedFinding.line || selectedFinding.line_number || 1)]}
                    severity={selectedFinding.severity}
                    issueMessage={selectedFinding.message || selectedFinding.type}
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
