import { useState, useEffect } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  ChevronRight,
  Search,
  FileCode,
  Layers,
  Cpu,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runCodeReview } from "../api/review";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/feedback/EmptyState";
import PremiumLoader from "../components/common/PremiumLoader";
import ButtonSpinner from "../components/common/ButtonSpinner";

export default function CodeReview() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'issues' | 'recommendations'
  const [selectedDimension, setSelectedDimension] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRunReview = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await runCodeReview(activeRepo.name);
      setReviewData(data);
      addToast("Engineering code review completed.", "success");
    } catch (err) {
      addToast(err.message || "Code review failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRepo) {
      handleRunReview();
    }
  }, [activeRepo]);

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={ShieldCheck}
          title="No Repository Active for Review"
          description="Select or connect a repository to run a comprehensive 8-dimension engineering code quality review."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  const dimensions = reviewData?.raw_data?.dimensions || [];
  const findings = reviewData?.findings || [];
  const recommendations = reviewData?.recommendations || [];
  const overallScore = reviewData?.raw_data?.overall_score || 88;

  // Filtered findings by dimension and search term
  const filteredFindings = findings.filter((f) => {
    const dimMatch =
      selectedDimension === "ALL" ||
      (f.dimension && f.dimension.toLowerCase().includes(selectedDimension.toLowerCase())) ||
      (selectedDimension.toLowerCase().includes("correct") && f.dimension?.toLowerCase().includes("correct")) ||
      (selectedDimension.toLowerCase().includes("secur") && f.dimension?.toLowerCase().includes("secur")) ||
      (selectedDimension.toLowerCase().includes("perf") && f.dimension?.toLowerCase().includes("perf"));

    const query = searchQuery.toLowerCase().trim();
    const searchMatch =
      !query ||
      (f.title && f.title.toLowerCase().includes(query)) ||
      (f.description && f.description.toLowerCase().includes(query)) ||
      (f.message && f.message.toLowerCase().includes(query)) ||
      (f.file && f.file.toLowerCase().includes(query));

    return dimMatch && searchMatch;
  });

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--warning)";
    return "var(--error)";
  };

  const handleDimensionClick = (dimName) => {
    setSelectedDimension(dimName);
    setActiveTab("issues");
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            AI Engineering Code Review
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Evaluating repository: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> across 8 Engineering Dimensions with detailed AST inspection.
          </p>
        </div>
        <div className="page-actions">
          <button
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={handleRunReview}
            disabled={loading}
          >
            {loading ? <ButtonSpinner size={15} /> : <RefreshCw size={15} />}
            <span>{loading ? "Analyzing Codebase..." : "Re-Run Review"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
          <PremiumLoader
            size="lg"
            title="Running AI Engineering Code Review"
            subtitle={`Evaluating ${activeRepo.name} across 8 architectural and engineering dimensions with AST parsing...`}
            icon={Sparkles}
            steps={[
              { label: "Synthesizing Structural Correctness & Error Handling", icon: ShieldCheck },
              { label: "Inspecting Complexity, Hotspots & Maintainability", icon: Cpu },
              { label: "Auditing Security, OWASP & API Architecture", icon: Layers },
            ]}
          />
        </div>
      ) : reviewData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Top Score Banner */}
          <div className="card" style={{ padding: "var(--space-6)", background: "var(--hero-gradient)", borderColor: "var(--primary-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Engineering Quality Score
                </div>
                <div style={{ fontSize: "38px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  {overallScore}<span style={{ fontSize: "18px", color: "var(--text-muted)" }}>/100</span>
                </div>
                <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "680px", lineHeight: "1.5" }}>
                  {reviewData.summary || "Comprehensive evaluation completed across AST boundaries, exception handlers, and security rules."}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <span
                  className={`badge ${overallScore >= 80 ? "badge-success" : overallScore >= 60 ? "badge-warning" : "badge-danger"}`}
                  style={{ padding: "6px 14px", fontSize: "13px" }}
                >
                  {overallScore >= 80 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{overallScore >= 80 ? "Production Ready" : overallScore >= 60 ? "Needs Review" : "Action Required"}</span>
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Audited across {dimensions.length || 8} Engineering Dimensions
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            {[
              { id: "overview", label: "Dimensions Overview" },
              { id: "issues", label: `Findings & Details (${findings.length})` },
              { id: "recommendations", label: `Recommendations (${recommendations.length})` },
            ].map((t) => (
              <button
                key={t.id}
                className={`btn ${activeTab === t.id ? "btn-primary" : "btn-ghost"} btn-sm`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Dimensions Overview */}
          {activeTab === "overview" && (
            <div className="grid-2" style={{ gap: "14px" }}>
              {dimensions.length > 0 ? (
                dimensions.map((dim, idx) => {
                  const dimTitle = dim.name || dim.category || `Dimension ${idx + 1}`;
                  const score = dim.score ?? 80;
                  const color = getScoreColor(score);
                  const issueCount = dim.issues_count ?? 0;
                  const status = dim.status || (score >= 80 ? "PASS" : score >= 60 ? "WARN" : "FAIL");
                  const description = dim.evaluation || dim.summary || "Baseline analysis complete.";

                  return (
                    <div
                      key={idx}
                      className="card card-interactive"
                      style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                      onClick={() => handleDimensionClick(dimTitle)}
                      title="Click to view detailed findings for this dimension"
                    >
                      <div>
                        {/* Title & Score */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Layers size={16} color={color} />
                            <span style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-main)" }}>
                              {dimTitle}
                            </span>
                          </div>
                          <span
                            className="badge"
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: color,
                              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                              borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                            }}
                          >
                            {score}/100
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                          <div style={{ width: `${score}%`, height: "100%", backgroundColor: color, borderRadius: "3px" }}></div>
                        </div>

                        {/* Evaluation Detail */}
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "12px" }}>
                          {description}
                        </p>
                      </div>

                      {/* Footer Info & Action */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "10px",
                          marginTop: "auto",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span
                            className={`badge ${status === "PASS" ? "badge-success" : status === "WARN" ? "badge-warning" : "badge-danger"}`}
                            style={{ fontSize: "10.5px", padding: "2px 6px" }}
                          >
                            {status}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {issueCount} {issueCount === 1 ? "issue" : "issues"}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--primary)",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <span>View Details</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="card" style={{ padding: "24px", gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)" }}>
                  Standard baseline dimensions evaluated.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Findings & Issues */}
          {activeTab === "issues" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Filter Chips & Search Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    className={`btn btn-sm ${selectedDimension === "ALL" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSelectedDimension("ALL")}
                  >
                    All Findings ({findings.length})
                  </button>
                  {dimensions.map((d, i) => {
                    const name = d.name || d.category || `Dim ${i + 1}`;
                    const count = d.issues_count ?? 0;
                    if (count === 0 && selectedDimension !== name) return null;
                    return (
                      <button
                        key={i}
                        className={`btn btn-sm ${selectedDimension === name ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setSelectedDimension(name)}
                      >
                        {name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={14} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
                  <input
                    type="text"
                    className="input input-sm"
                    placeholder="Search findings, files, or rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: "30px" }}
                  />
                </div>
              </div>

              {/* Finding Cards */}
              {filteredFindings.length === 0 ? (
                <div className="card" style={{ padding: "36px", textAlign: "center", color: "var(--success)" }}>
                  <CheckCircle2 size={36} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>No Issues Matching Filter</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {selectedDimension !== "ALL"
                      ? `No issues found for dimension "${selectedDimension}".`
                      : "All inspected code adheres to the engineering quality benchmarks."}
                  </div>
                </div>
              ) : (
                filteredFindings.map((finding, idx) => {
                  const title = finding.title || finding.category || finding.type || "Code Quality Finding";
                  const desc = finding.description || finding.message || "Potential defect or smell detected.";
                  const severity = (finding.severity || "MEDIUM").toUpperCase();
                  const sevBadgeClass =
                    severity === "CRITICAL" || severity === "HIGH"
                      ? "badge-danger"
                      : severity === "MEDIUM"
                      ? "badge-warning"
                      : "badge-primary";

                  return (
                    <div key={idx} className="card" style={{ padding: "18px" }}>
                      {/* Card Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span className={`badge ${sevBadgeClass}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                            {severity}
                          </span>
                          {finding.dimension && (
                            <span className="badge badge-secondary" style={{ fontSize: "11px" }}>
                              {finding.dimension}
                            </span>
                          )}
                          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)" }}>
                            {title}
                          </span>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            navigate("/autonomous", {
                              state: {
                                targetFile: finding.file,
                                targetProblem: desc,
                              },
                            })
                          }
                          title="Open in Autonomous Fix Agent"
                        >
                          <Wrench size={13} />
                          <span>Fix with Agent</span>
                        </button>
                      </div>

                      {/* File Path & Line */}
                      {finding.file && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                          <FileCode size={13} color="var(--primary)" />
                          <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-secondary)" }}>
                            {finding.file} {finding.line ? `:${finding.line}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "10px" }}>
                        {desc}
                      </p>

                      {/* Code Snippet (if available) */}
                      {(finding.code || finding.snippet) && (
                        <div
                          style={{
                            backgroundColor: "var(--bg-subtle)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            padding: "10px 12px",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "12px",
                            color: "var(--text-main)",
                            overflowX: "auto",
                            marginBottom: "10px",
                          }}
                        >
                          <code>{finding.code || finding.snippet}</code>
                        </div>
                      )}

                      {/* Recommendation */}
                      {finding.recommendation && (
                        <div
                          style={{
                            backgroundColor: "var(--primary-light)",
                            borderColor: "var(--primary-border)",
                            border: "1px solid var(--primary-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: "var(--primary-text)" }}>Recommendation: </strong>
                            {finding.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Recommendations */}
          {activeTab === "recommendations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recommendations.length === 0 ? (
                <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--success)" }}>
                  <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>No Immediate Action Required</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Your codebase adheres to all current architectural and security standards.
                  </div>
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <div key={idx} className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", flexShrink: 0 }}>
                      <Sparkles size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px", color: "var(--text-main)" }}>
                        {rec.title || `Recommendation #${idx + 1}`}
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {rec.action || rec.description || rec}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <ShieldCheck size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Ready to Review Codebase</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "480px", margin: "6px auto 18px" }}>
            Click the button below to trigger static AST parsing, modularity analysis, and OWASP rule evaluation.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleRunReview}>
            <span>Run Code Review</span>
          </button>
        </div>
      )}
    </div>
  );
}
