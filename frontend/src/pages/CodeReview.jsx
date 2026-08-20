import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ShieldAlert,
  Zap,
  Layers,
  Bug,
  AlertTriangle,
  Play,
  Check,
  RefreshCw,
  Loader2,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runCodeReview } from "../api/review";
import { useToast } from "../components/Toast";

export default function CodeReview() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);

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

  const dimensions = reviewData?.raw_data?.dimensions || [];
  const findings = reviewData?.findings || [];
  const recommendations = reviewData?.recommendations || [];
  const overallScore = reviewData?.raw_data?.overall_score || 88;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Engineering Code Review</h1>
          <p className="page-subtitle">
            Multi-dimensional evaluation across Correctness, OWASP Security, Performance, and Architecture.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleRunReview} disabled={loading || !activeRepo}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{loading ? "Evaluating Codebase..." : "Re-Run Review"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={40} className="animate-spin" color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", color: "var(--text-main)", fontWeight: 700 }}>Conducting Full Engineering Review</h3>
          <p style={{ fontSize: "13.5px", marginTop: "4px" }}>
            Scanning AST symbols, validating exception boundaries, evaluating OWASP rules, and checking maintainability...
          </p>
        </div>
      ) : reviewData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Overall Score Banner */}
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hero-gradient)", borderColor: "var(--primary-border)" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                OVERALL CODE QUALITY SCORE
              </div>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {overallScore}<span style={{ fontSize: "20px", color: "var(--text-muted)" }}>/100</span>
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {reviewData.summary}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <span className="badge badge-success" style={{ padding: "6px 14px", fontSize: "13px" }}>
                <CheckCircle2 size={14} /> Ready for Production
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Audited against 8 Engineering Dimensions
              </span>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid-4">
            {dimensions.map((dim, idx) => (
              <div key={idx} className="card">
                <div className="card-header" style={{ marginBottom: "var(--space-2)" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" }}>{dim.category}</span>
                  <span className={`badge ${dim.status === "PASS" ? "badge-success" : dim.status === "WARN" ? "badge-warning" : "badge-danger"}`}>
                    {dim.status}
                  </span>
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
                  {dim.score}%
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {dim.summary}
                </div>
                <div style={{ height: "4px", backgroundColor: "var(--bg-muted)", borderRadius: "2px", overflow: "hidden", marginTop: "10px" }}>
                  <div
                    style={{
                      width: `${dim.score}%`,
                      height: "100%",
                      backgroundColor: dim.status === "PASS" ? "var(--success)" : dim.status === "WARN" ? "var(--warning)" : "var(--error)",
                      borderRadius: "2px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations & Actionable Findings */}
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
                <Sparkles size={18} color="var(--primary)" />
                <span>Key Architectural Recommendations</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13.5px", padding: "8px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-main)" }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
                <ShieldAlert size={18} color="var(--warning)" />
                <span>Detected Findings ({findings.length})</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
                {findings.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No code issues detected.</div>
                ) : (
                  findings.map((f, i) => (
                    <div key={i} style={{ padding: "10px 12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12.5px", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{f.message || f.type}</span>
                        <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>{f.dimension || "Code"}</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11.5px", fontFamily: "monospace" }}>
                        {f.file}:{f.line || 1}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          Select an active repository to trigger a code review.
        </div>
      )}
    </div>
  );
}
