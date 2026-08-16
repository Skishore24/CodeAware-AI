import { useState } from "react";
import { buildGraph, getGraphSummary, getImpact } from "../api/graph";
import { useToast } from "../components/Toast";

export default function CodeGraph() {
  const toast = useToast();
  const [repoName, setRepoName]       = useState("");
  const [loadingBuild, setLoadingBuild]   = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [summary, setSummary]           = useState(null);
  const [graph, setGraph]               = useState(null);
  const [symbolName, setSymbolName]     = useState("");
  const [impactResult, setImpactResult] = useState(null);

  async function handleBuild() {
    if (!repoName.trim()) return;
    setLoadingBuild(true);
    setGraph(null);
    setSummary(null);
    try {
      const data = await buildGraph(repoName.trim());
      setGraph(data.graph);
      toast("success", "Graph built", `${data.graph.nodes?.length ?? 0} nodes, ${data.graph.edges?.length ?? 0} edges`);
    } catch (err) {
      toast("error", "Build failed", err.message);
    } finally {
      setLoadingBuild(false);
    }
  }

  async function handleSummary() {
    if (!repoName.trim()) return;
    setLoadingSummary(true);
    setSummary(null);
    try {
      const data = await getGraphSummary(repoName.trim());
      setSummary(data.graph);
      toast("success", "Summary ready", "Graph summary loaded.");
    } catch (err) {
      toast("error", "Summary failed", err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleImpact(e) {
    e.preventDefault();
    if (!repoName.trim() || !symbolName.trim()) return;
    setLoadingImpact(true);
    setImpactResult(null);
    try {
      const data = await getImpact(repoName.trim(), symbolName.trim());
      setImpactResult(data);
      toast("success", "Impact analysis done", `Symbol: ${symbolName}`);
    } catch (err) {
      toast("error", "Impact failed", err.message);
    } finally {
      setLoadingImpact(false);
    }
  }

  const TYPE_ICONS = {
    file: "📄", class: "🏛️", function: "⚙️",
    method: "🔧", module: "📦", symbol: "🔗",
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🕸️ Code Graph</h1>
        <p className="page-subtitle">
          Build a knowledge graph of your codebase and analyse symbol impact.
        </p>
      </div>

      {/* Repo selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Repository</div>
        <div className="input-row">
          <input
            className="input"
            placeholder="Repository name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleSummary}
            disabled={loadingSummary || !repoName.trim()}
          >
            {loadingSummary ? <><span className="spinner" /> Loading…</> : "📊 Summary"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleBuild}
            disabled={loadingBuild || !repoName.trim()}
          >
            {loadingBuild ? <><span className="spinner" /> Building…</> : "🔨 Build Graph"}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="section">
          <div className="section-title">📊 Graph Summary</div>
          <div className="card">
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-label">Total Nodes</div>
                <div className="stat-value">{summary.nodes}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Edges</div>
                <div className="stat-value">{summary.edges}</div>
              </div>
            </div>

            {summary.node_types && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ fontSize: 13 }}>Node Types</div>
                <div className="graph-grid">
                  {Object.entries(summary.node_types).map(([type, count]) => (
                    <div key={type} className="graph-node-type">
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{TYPE_ICONS[type] ?? "🔵"}</div>
                      <div className="graph-node-count">{count}</div>
                      <div className="graph-node-label">{type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.relationship_types && (
              <div>
                <div className="section-title" style={{ fontSize: 13 }}>Relationship Types</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(summary.relationship_types).map(([rel, count]) => (
                    <div
                      key={rel}
                      className="badge badge-info"
                      style={{ fontSize: 12 }}
                    >
                      {rel} × {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full graph */}
      {graph && (
        <div className="section">
          <div className="section-title">
            🗺️ Full Graph
            <span className="badge badge-info" style={{ marginLeft: 8 }}>
              {graph.nodes?.length} nodes · {graph.edges?.length} edges
            </span>
          </div>
          <div className="card">
            <pre className="code-block" style={{ maxHeight: 300 }}>
              {JSON.stringify(graph, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Impact analysis */}
      <div className="section">
        <div className="section-title">🎯 Impact Analysis</div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">What breaks if this symbol changes?</div>
          <form onSubmit={handleImpact}>
            <div className="input-row">
              <input
                className="input"
                placeholder="Symbol name — e.g. authenticate_user"
                value={symbolName}
                onChange={(e) => setSymbolName(e.target.value)}
                disabled={loadingImpact}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loadingImpact || !repoName.trim() || !symbolName.trim()}
              >
                {loadingImpact ? <><span className="spinner" /> Analysing…</> : "🎯 Analyse Impact"}
              </button>
            </div>
          </form>
        </div>

        {impactResult && (
          <div className="card">
            <pre className="code-block" style={{ maxHeight: 320 }}>
              {JSON.stringify(impactResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
