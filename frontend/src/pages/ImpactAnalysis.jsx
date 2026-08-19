import { useState } from "react";
import {
  GitFork,
  Search,
  ShieldAlert,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { getImpact } from "../api/graph";
import { useToast } from "../components/Toast";

export default function ImpactAnalysis() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [impactResult, setImpactResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || !activeRepo) return;

    setLoading(true);
    try {
      const data = await getImpact(activeRepo.name, symbol.trim());
      setImpactResult(data);
      if (data.count === 0) {
        addToast("No callers or dependents found for this symbol.", "info");
      }
    } catch (err) {
      addToast(err.message || "Failed to analyze impact", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Impact & Blast Radius Analysis</h1>
          <p className="page-subtitle">
            Calculate the exact blast radius, direct callers, indirect dependencies, and affected APIs before changing code.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <form onSubmit={handleAnalyze} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Enter symbol name to analyze (e.g. authenticate_user, UserService, handle_request)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ paddingLeft: "34px" }}
            />
            <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "10px", top: "11px" }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !symbol.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitFork size={16} />}
            <span>Calculate Impact</span>
          </button>
        </form>
      </div>

      {/* Impact Results */}
      {impactResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Summary Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Blast Radius Report: {impactResult.symbol}</h2>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {impactResult.summary}
                </div>
              </div>
              <span className={`badge ${impactResult.blast_radius_score === "HIGH" ? "badge-danger" : impactResult.blast_radius_score === "MEDIUM" ? "badge-warning" : "badge-success"}`}>
                Score: {impactResult.blast_radius_score}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid-4" style={{ marginTop: "var(--space-4)" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Direct Callers</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>
                  {impactResult.direct_callers?.length || 0}
                </div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Indirect Callers</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>
                  {impactResult.indirect_callers?.length || 0}
                </div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Affected APIs</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: impactResult.affected_apis?.length > 0 ? "var(--error)" : "var(--text-main)" }}>
                  {impactResult.affected_apis?.length || 0}
                </div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Dependent Files</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>
                  {impactResult.dependent_files?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Details Lists */}
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>Direct Callers</h3>
              {impactResult.direct_callers?.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No direct callers detected.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {impactResult.direct_callers.map((c, i) => (
                    <div key={i} style={{ padding: "8px 10px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{c.path}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>Affected Files & Test Suites</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {impactResult.dependent_files?.map((f, i) => (
                  <div key={i} style={{ padding: "8px 10px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12.5px", fontFamily: "monospace" }}>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
