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
  Layers,
  Activity,
  AlertOctagon,
  Sparkles,
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

  const sampleSymbols = ["authenticate_user", "login", "handle_request", "process_data", "getUser"];

  const handleAnalyze = async (customSymbol) => {
    const s = (customSymbol || symbol).trim();
    if (!s) return;

    if (!activeRepo) {
      addToast("Please select a repository first.", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await getImpact(activeRepo.name, s);
      setImpactResult(data);
      if (data.count === 0) {
        addToast("No direct callers or dependents found for this symbol.", "info");
      } else {
        addToast(`Calculated blast radius for ${s}`, "success");
      }
    } catch (err) {
      addToast(err.message || "Failed to analyze impact", "error");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score) => {
    switch (score) {
      case "HIGH":
      case "CRITICAL":
        return <span className="badge badge-danger" style={{ fontSize: "13px", padding: "4px 10px" }}><AlertOctagon size={14} /> Risk: {score}</span>;
      case "MEDIUM":
        return <span className="badge badge-warning" style={{ fontSize: "13px", padding: "4px 10px" }}><AlertTriangle size={14} /> Risk: MEDIUM</span>;
      default:
        return <span className="badge badge-success" style={{ fontSize: "13px", padding: "4px 10px" }}><CheckCircle2 size={14} /> Risk: LOW</span>;
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

      {/* Search Input Card */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Enter symbol name (e.g. authenticate_user, UserService, handle_request, run_pipeline)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ paddingLeft: "34px", padding: "10px 14px 10px 34px" }}
            />
            <Search size={16} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "12px" }} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !symbol.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitFork size={16} />}
            <span>Calculate Impact</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Sample Symbols:
          </span>
          {sampleSymbols.map((sym, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              style={{ padding: "2px 8px", fontSize: "11px", borderRadius: "var(--radius-full)" }}
              onClick={() => {
                setSymbol(sym);
                handleAnalyze(sym);
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Impact Results */}
      {impactResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Summary Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title" style={{ fontSize: "18px" }}>
                  <Activity size={18} color="var(--primary)" />
                  <span>Blast Radius Report: <code>{impactResult.symbol}</code></span>
                </h2>
                <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {impactResult.summary}
                </div>
              </div>
              {getScoreBadge(impactResult.blast_radius_score)}
            </div>

            {/* Metrics Breakdown */}
            <div className="grid-4" style={{ marginTop: "var(--space-4)" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Direct Callers</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  {impactResult.direct_callers?.length || 0}
                </div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Indirect Callers</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  {impactResult.indirect_callers?.length || 0}
                </div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Affected APIs</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: impactResult.affected_apis?.length > 0 ? "var(--error)" : "var(--text-main)", marginTop: "2px" }}>
                  {impactResult.affected_apis?.length || 0}
                </div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Dependent Files</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  {impactResult.dependent_files?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Details Lists */}
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
                <GitFork size={16} color="var(--primary)" />
                <span>Direct & Indirect Callers</span>
              </h3>
              {impactResult.direct_callers?.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No callers detected.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {impactResult.direct_callers.map((c, i) => (
                    <div key={i} style={{ padding: "8px 12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "13px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{c.name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontFamily: "monospace" }}>{c.path}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
                <FileCode size={16} color="var(--info)" />
                <span>Affected Dependent Files ({impactResult.dependent_files?.length || 0})</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                {impactResult.dependent_files?.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No dependent files.</div>
                ) : (
                  impactResult.dependent_files.map((f, i) => (
                    <div key={i} style={{ padding: "8px 12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12.5px", fontFamily: "monospace", border: "1px solid var(--border-color)" }}>
                      {f}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
