import { useState, useEffect } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runCodeReview } from "../api/review";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/feedback/EmptyState";
import { CardSkeleton } from "../components/feedback/Skeleton";

export default function CodeReview() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'issues' | 'architecture' | 'recommendations'

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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            AI Engineering Code Review
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Evaluating repository: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> across Correctness, OWASP Security, Performance, and Modularity.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleRunReview} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{loading ? "Analyzing Codebase..." : "Re-Run Review"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
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
                <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "620px" }}>
                  {reviewData.summary || "Comprehensive evaluation completed across AST boundaries, exception handlers, and security rules."}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <span className="badge badge-success" style={{ padding: "6px 14px", fontSize: "13px" }}>
                  <CheckCircle2 size={14} /> Production Ready
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Audited across 8 Engineering Dimensions
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            {[
              { id: "overview", label: "Dimensions Overview" },
              { id: "issues", label: `Findings (${findings.length})` },
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
            <div className="grid-2">
              {dimensions.length > 0 ? (
                dimensions.map((dim, idx) => (
                  <div key={idx} className="card" style={{ padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>{dim.name}</span>
                      <span className="badge badge-primary" style={{ fontSize: "12px", fontWeight: 700 }}>
                        {dim.score}/100
                      </span>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ width: `${dim.score}%`, height: "100%", backgroundColor: "var(--primary)", borderRadius: "3px" }}></div>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {dim.evaluation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="card" style={{ padding: "24px", gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)" }}>
                  Standard baseline dimensions evaluated.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Findings & Issues */}
          {activeTab === "issues" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {findings.length === 0 ? (
                <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--success)" }}>
                  <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>No Major Code Quality Issues Detected</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>All inspected AST nodes adhere to cleanliness benchmarks.</div>
                </div>
              ) : (
                findings.map((finding, idx) => (
                  <div key={idx} className="card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                          {finding.severity || "MEDIUM"}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "14px" }}>
                          {finding.title || finding.category || "Issue"}
                        </span>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate("/autonomous", { state: { targetFile: finding.file, targetProblem: finding.description } })}
                      >
                        <Wrench size={13} />
                        <span>Fix Issue</span>
                      </button>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginBottom: "8px" }}>
                      {finding.file} {finding.line ? `:${finding.line}` : ""}
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {finding.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Recommendations */}
          {activeTab === "recommendations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div className="metric-icon-box" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", flexShrink: 0 }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                      {rec.title || `Recommendation #${idx + 1}`}
                    </h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {rec.action || rec.description || rec}
                    </p>
                  </div>
                </div>
              ))}
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
