import { useState } from "react";
import {
  GitFork,
  Search,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { getImpact } from "../api/graph";
import { useToast } from "../components/Toast";
import EmptyState from "../components/feedback/EmptyState";

export default function ImpactAnalysis() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [impactResult, setImpactResult] = useState(null);

  const sampleSymbols = ["authenticate_user", "login", "handle_request", "process_data", "getUser", "verify_token"];

  const handleAnalyze = async (customSymbol) => {
    const s = (customSymbol || symbol).trim();
    if (!s) return;

    if (!activeRepo) {
      addToast("Please connect or select a repository first.", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await getImpact(activeRepo.name, s);
      setImpactResult(data);
      if (data.count === 0) {
        addToast("No direct callers found for this symbol.", "info");
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
        return <span className="badge badge-danger" style={{ fontSize: "12px", padding: "4px 10px" }}><AlertOctagon size={13} /> Risk: {score}</span>;
      case "MEDIUM":
        return <span className="badge badge-warning" style={{ fontSize: "12px", padding: "4px 10px" }}><AlertTriangle size={13} /> Risk: MEDIUM</span>;
      default:
        return <span className="badge badge-success" style={{ fontSize: "12px", padding: "4px 10px" }}><CheckCircle2 size={13} /> Risk: LOW</span>;
    }
  };

  // Safely extract a display name from a caller object or raw string
  const getCallerName = (caller) => {
    if (!caller) return "Unknown";
    if (typeof caller === "string") return caller;
    return caller.name || caller.id || caller.path || JSON.stringify(caller);
  };

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={GitFork}
          title="No Repository Active for Impact Analysis"
          description="Select or connect a repository to trace call graphs, dependent routes, and potential regression risks before modifying code."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  const directCallers = impactResult?.direct_callers || [];
  const indirectCallers = impactResult?.indirect_callers || [];
  // Backend may return either key; support both
  const affectedFiles = impactResult?.dependent_files || impactResult?.affected_files || [];
  const riskScore = impactResult?.risk_level || (directCallers.length > 3 ? "HIGH" : directCallers.length > 0 ? "MEDIUM" : "LOW");

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            What will break if I change this?
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Trace inbound callers, dependent endpoints, and potential regression risks across codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong>.
          </p>
        </div>
      </div>

      {/* Input Search Card */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Enter symbol name (e.g. authenticate_user, UserService, process_payment, handle_request)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ paddingLeft: "34px", height: "42px" }}
            />
            <Search size={15} color="var(--text-subtle)" style={{ position: "absolute", left: "12px", top: "13px" }} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !symbol.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitFork size={16} />}
            <span>Calculate Impact</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
            Try analyzing:
          </span>
          {sampleSymbols.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSymbol(s);
                handleAnalyze(s);
              }}
              style={{
                fontSize: "11.5px",
                padding: "2px 8px",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Impact Results */}
      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Calculating Dependency Blast Radius</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Tracing cross-file references, callers, and affected endpoint routes...
          </p>
        </div>
      ) : impactResult ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Top Risk Banner */}
          <div className="card" style={{ padding: "var(--space-5)", background: "var(--hero-gradient)", borderColor: "var(--primary-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                  Calculated Blast Radius
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginTop: "2px" }}>
                  Modifying <code style={{ color: "var(--primary)" }}>{impactResult.symbol_name || symbol}</code>
                </h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Changing this symbol directly affects <strong>{directCallers.length}</strong> callers across <strong>{affectedFiles.length}</strong> files.
                </p>
              </div>
              <div>{getScoreBadge(riskScore)}</div>
            </div>
          </div>

          {/* 3-Column Blast Radius Flow */}
          <div className="grid-3">
            {/* Direct Callers */}
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div className="card-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700 }}>Direct Callers ({directCallers.length})</h4>
              </div>
              {directCallers.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No direct callers detected.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {directCallers.map((c, i) => (
                    <div key={i} className="badge badge-neutral" style={{ padding: "6px 8px", fontSize: "12px", justifyContent: "flex-start" }}>
                      <ArrowRight size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getCallerName(c)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Affected Files */}
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div className="card-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700 }}>Affected Files ({affectedFiles.length})</h4>
              </div>
              {affectedFiles.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No files affected.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {affectedFiles.map((f, i) => (
                    <div key={i} style={{ fontSize: "12px", fontFamily: "JetBrains Mono", color: "var(--text-main)", padding: "4px 6px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                      <FileCode size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {typeof f === "string" ? f : (f.path || f.name || JSON.stringify(f))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safe Modification Checklist */}
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div className="card-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700 }}>Safety Recommendations</h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Verify signature compatibility for all direct callers.</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Run unit test generator to create regression assertions before committing.</span>
                </div>
                {indirectCallers.length > 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{indirectCallers.length} indirect callers may also be affected transitively.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
