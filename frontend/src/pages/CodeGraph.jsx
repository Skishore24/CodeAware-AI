import { useState, useEffect, useRef } from "react";
import { buildGraph, getGraphSummary, getImpact } from "../api/graph";
import { useToast } from "../components/Toast";
import { useRepo } from "../context/RepoContext";
import {
  Network, BarChart3, Hammer, Target, FileCode,
  Landmark, Settings, Wrench, Box, Link, Code2, GitBranch,
} from "lucide-react";

const TYPE_COLORS = {
  file:     "#6366f1",
  class:    "#a855f7",
  function: "#06b6d4",
  method:   "#f59e0b",
  module:   "#10b981",
  symbol:   "#ec4899",
};

function typeIcon(type, size = 16) {
  const color = TYPE_COLORS[type] || "var(--color-accent)";
  switch (type) {
    case "file":     return <FileCode  size={size} color={color} />;
    case "class":    return <Landmark  size={size} color={color} />;
    case "function": return <Settings  size={size} color={color} />;
    case "method":   return <Wrench    size={size} color={color} />;
    case "module":   return <Box       size={size} color={color} />;
    case "symbol":   return <Link      size={size} color={color} />;
    default:         return <Code2     size={size} color={color} />;
  }
}

/** Simple force-directed mini-graph on canvas */
function GraphCanvas({ nodes, edges }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    // Sample max 80 nodes for performance
    const sample = nodes.slice(0, 80);
    const idSet  = new Set(sample.map((n) => n.id ?? n.name ?? n));

    const pts = sample.map((n, i) => ({
      id:    n.id ?? n.name ?? String(i),
      label: n.label ?? n.name ?? n.id ?? String(i),
      type:  n.type ?? "file",
      x:     W * 0.1 + Math.random() * W * 0.8,
      y:     H * 0.1 + Math.random() * H * 0.8,
      vx: 0, vy: 0,
    }));

    const ptMap = Object.fromEntries(pts.map((p) => [p.id, p]));
    const validEdges = (edges || []).filter(
      (e) => ptMap[e.source ?? e.from] && ptMap[e.target ?? e.to]
    ).slice(0, 200);

    const K = 0.015, REST = 80, REPEL = 3000, DAMP = 0.85;

    function tick() {
      // Repulsion
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[i].x;
          const dy = pts[j].y - pts[i].y;
          const d2 = dx * dx + dy * dy + 1;
          const f  = REPEL / d2;
          pts[i].vx -= f * dx; pts[i].vy -= f * dy;
          pts[j].vx += f * dx; pts[j].vy += f * dy;
        }
      }
      // Attraction
      for (const e of validEdges) {
        const s = ptMap[e.source ?? e.from];
        const t = ptMap[e.target ?? e.to];
        const dx = t.x - s.x, dy = t.y - s.y;
        const d  = Math.sqrt(dx * dx + dy * dy) + 1;
        const f  = K * (d - REST);
        s.vx += f * dx / d; s.vy += f * dy / d;
        t.vx -= f * dx / d; t.vy -= f * dy / d;
      }
      // Center pull
      for (const p of pts) {
        p.vx += (W / 2 - p.x) * 0.001;
        p.vy += (H / 2 - p.y) * 0.001;
        p.vx *= DAMP; p.vy *= DAMP;
        p.x = Math.max(8, Math.min(W - 8, p.x + p.vx));
        p.y = Math.max(8, Math.min(H - 8, p.y + p.vy));
      }

      ctx.clearRect(0, 0, W, H);

      // Draw edges
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      for (const e of validEdges) {
        const s = ptMap[e.source ?? e.from];
        const t = ptMap[e.target ?? e.to];
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const p of pts) {
        const color = TYPE_COLORS[p.type] || "#6366f1";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default function CodeGraph() {
  const toast = useToast();
  const { activeRepo, setActiveRepo, repositories } = useRepo();
  const [repoName, setRepoName]       = useState(() => activeRepo?.name || "");
  const [loadingBuild, setLoadingBuild]     = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingImpact, setLoadingImpact]   = useState(false);
  const [summary, setSummary]         = useState(null);
  const [graph, setGraph]             = useState(null);
  const [symbolName, setSymbolName]   = useState("");
  const [impactResult, setImpactResult] = useState(null);
  const [showCanvas, setShowCanvas]   = useState(false);

  // Auto-fill from context
  useEffect(() => {
    if (activeRepo?.name) setRepoName(activeRepo.name);
    else if (activeRepo?.path) setRepoName(activeRepo.path);
  }, [activeRepo]);

  async function handleBuild() {
    if (!repoName.trim() || loadingBuild) return;
    setLoadingBuild(true);
    setGraph(null);
    try {
      const data = await buildGraph(repoName.trim());
      setGraph(data.graph);
      toast("success", "Graph built", `${data.graph.nodes?.length ?? 0} nodes · ${data.graph.edges?.length ?? 0} edges`);
    } catch (err) {
      toast("error", "Build failed", err.message);
    } finally {
      setLoadingBuild(false);
    }
  }

  async function handleSummary() {
    if (!repoName.trim() || loadingSummary) return;
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

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Knowledge Graph</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Network size={26} color="var(--color-accent)" /> Code Graph
        </h1>
        <p className="page-subtitle">
          Build a dependency knowledge graph of your codebase and analyse symbol impact.
        </p>
      </div>

      {/* Repo selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Available Repositories Quick Picker */}
        {repositories.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-text-muted)", marginBottom: 8 }}>
              Select Cloned Repository
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {repositories.map((rep) => {
                const isSelected = repoName === rep.name || repoName === rep.path || activeRepo?.name === rep.name;
                return (
                  <button
                    key={rep.path}
                    type="button"
                    onClick={() => {
                      setRepoName(rep.name);
                      setActiveRepo(rep);
                    }}
                    style={{
                      background: isSelected ? "var(--color-accent-soft)" : "var(--color-surface)",
                      border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 12px",
                      fontSize: 12,
                      color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "JetBrains Mono, monospace",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Code2 size={13} />
                    <strong>{rep.name}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="card-title">Repository Name or Path</div>
        <div className="input-row">
          <input
            className="input"
            placeholder="Repository name or path (e.g. BUS)"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleSummary}
            disabled={loadingSummary || !repoName.trim()}
          >
            {loadingSummary ? <><span className="spinner" /> Loading…</> : <><BarChart3 size={15} /> Summary</>}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleBuild}
            disabled={loadingBuild || !repoName.trim()}
          >
            {loadingBuild ? <><span className="spinner" /> Building…</> : <><Hammer size={15} /> Build Graph</>}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="section">
          <div className="section-title">
            <BarChart3 size={17} color="var(--color-accent)" /> Graph Summary
          </div>
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
                <div className="section-title" style={{ fontSize: 12, marginBottom: 10 }}>Node Types</div>
                <div className="graph-grid">
                  {Object.entries(summary.node_types).map(([type, count]) => (
                    <div key={type} className="graph-node-type">
                      <div style={{ marginBottom: 5 }}>{typeIcon(type, 18)}</div>
                      <div className="graph-node-count">{count}</div>
                      <div className="graph-node-label">{type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.relationship_types && (
              <div>
                <div className="section-title" style={{ fontSize: 12, marginBottom: 10 }}>Relationship Types</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(summary.relationship_types).map(([rel, count]) => (
                    <span key={rel} className="badge badge-info" style={{ fontSize: 11.5 }}>
                      {rel} × {count}
                    </span>
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
          <div className="section-title" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GitBranch size={17} color="var(--color-accent)" /> Full Graph
              <span className="badge badge-info">
                {graph.nodes?.length} nodes · {graph.edges?.length} edges
              </span>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCanvas((v) => !v)}
            >
              {showCanvas ? "Show Table" : "Show Visual"}
            </button>
          </div>

          <div className="card">
            {showCanvas ? (
              <>
                <div className="graph-canvas-wrapper" style={{ marginBottom: 12 }}>
                  {graph.nodes?.length > 0 ? (
                    <GraphCanvas nodes={graph.nodes} edges={graph.edges} />
                  ) : (
                    <div className="graph-canvas-empty">
                      <Network size={32} style={{ opacity: 0.3 }} />
                      <span>No nodes to display</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
                  Force-directed layout · showing up to 80 nodes
                </div>
              </>
            ) : (
              <>
                {/* Nodes table */}
                <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 14 }}>
                  <table className="node-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>ID / Name</th>
                        <th>Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(graph.nodes || []).slice(0, 100).map((n, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              {typeIcon(n.type, 13)}
                              <span style={{ fontSize: 10, textTransform: "uppercase", color: TYPE_COLORS[n.type] || "var(--color-accent)" }}>
                                {n.type ?? "—"}
                              </span>
                            </span>
                          </td>
                          <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.id ?? n.name ?? "—"}
                          </td>
                          <td style={{ color: "var(--color-text-subtle)" }}>{n.label ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Impact analysis */}
      <div className="section">
        <div className="section-title">
          <Target size={17} color="var(--color-accent)" /> Impact Analysis
        </div>
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
                {loadingImpact
                  ? <><span className="spinner" /> Analysing…</>
                  : <><Target size={15} /> Analyse Impact</>}
              </button>
            </div>
          </form>
        </div>

        {impactResult && (
          <div className="card">
            {/* Summary */}
            {impactResult.impacted_files && (
              <div style={{ marginBottom: 16 }}>
                <div className="card-title">Impacted Files</div>
                <div className="file-list">
                  {impactResult.impacted_files.map((f, i) => (
                    <div className="file-row" key={i}>
                      <FileCode size={12} color="var(--color-accent)" />
                      <span>{typeof f === "string" ? f : f.file ?? JSON.stringify(f)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON fallback */}
            {!impactResult.impacted_files && (
              <pre className="code-block" style={{ maxHeight: 320 }}>
                {JSON.stringify(impactResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
