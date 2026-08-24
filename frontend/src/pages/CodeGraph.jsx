import { useState, useEffect } from "react";
import {
  GitGraph,
  Search,
  RefreshCw,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCode,
  Box,
  Cpu,
  Loader2,
  GitFork,
  ArrowRight,
  Filter,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { buildGraph, getImpact } from "../api/graph";
import { useToast } from "../components/Toast";
import EmptyState from "../components/feedback/EmptyState";

export default function CodeGraph() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [nodeFilter, setNodeFilter] = useState("all"); // 'all' | 'file' | 'class' | 'function'
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchGraph = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await buildGraph(activeRepo.name);
      const graph = data?.graph || data;
      setGraphData(graph);
      if (graph?.nodes?.length > 0) {
        setSelectedNode(graph.nodes[0]);
      }
      addToast("Knowledge graph topology generated.", "info");
    } catch (err) {
      addToast(err.message || "Failed to load graph", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRepo) {
      fetchGraph();
    }
  }, [activeRepo]);

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={GitGraph}
          title="No Repository Active for Knowledge Graph"
          description="Connect or select a repository to explore cross-file relationships, inheritance trees, function call graphs, and module dependencies."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  const nodes = graphData?.nodes || [];
  const links = graphData?.links || [];
  const summary = graphData?.summary || {};

  const filteredNodes = nodes.filter((n) => {
    const matchesType = nodeFilter === "all" || n.type === nodeFilter;
    const matchesSearch = !searchSymbol.trim() || n.name.toLowerCase().includes(searchSymbol.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getNodeColor = (type) => {
    switch (type) {
      case "class":
        return { bg: "var(--purple-light)", border: "var(--purple-border)", text: "var(--purple-text)", color: "#8B5CF6" };
      case "function":
        return { bg: "var(--primary-light)", border: "var(--primary-border)", text: "var(--primary-text)", color: "#4F46E5" };
      case "file":
        return { bg: "var(--info-light)", border: "var(--info-border)", text: "var(--info-text)", color: "#3B82F6" };
      default:
        return { bg: "var(--success-light)", border: "var(--success-border)", text: "var(--success-text)", color: "#10B981" };
    }
  };

  return (
    <div className="page-container" style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "20px", fontWeight: 800 }}>
            Knowledge Graph & Architecture Topology
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Visual map of codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> showing how files, classes, functions, and routes depend on each other.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Rebuild Graph</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="card" style={{ padding: "10px 14px", marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", width: "220px" }}>
            <input
              type="text"
              className="input"
              placeholder="Filter symbols..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              style={{ paddingLeft: "30px", fontSize: "12px", height: "34px" }}
            />
            <Search size={13} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          </div>

          {/* Type filter */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["all", "file", "class", "function"].map((t) => (
              <button
                key={t}
                className={`btn ${nodeFilter === t ? "btn-primary" : "btn-ghost"} btn-sm`}
                onClick={() => setNodeFilter(t)}
                style={{ fontSize: "11.5px", padding: "3px 8px" }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))} title="Zoom Out">
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", width: "38px", textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))} title="Zoom In">
            <ZoomIn size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setZoomLevel(1)} title="Reset View">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Split */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-4)" }}>
        {/* Left: Graph Canvas */}
        <div
          className="card"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "var(--bg-subtle)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px" }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Synthesizing AST symbol topology...</span>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
              <GitGraph size={32} style={{ opacity: 0.4 }} />
              <span>No nodes match your current filters</span>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                padding: "24px",
                overflow: "auto",
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
                gap: "14px",
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease-out",
              }}
            >
              {filteredNodes.map((node, idx) => {
                const isSelected = selectedNode?.id === node.id || selectedNode?.name === node.name;
                const colors = getNodeColor(node.type);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: `1.5px solid ${isSelected ? "var(--primary)" : colors.border}`,
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                      boxShadow: isSelected ? "0 0 0 2px var(--primary), var(--shadow-md)" : "var(--shadow-xs)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      minWidth: "160px",
                      maxWidth: "220px",
                      transition: "var(--transition)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge" style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "10px", padding: "1px 6px" }}>
                        {node.type || "symbol"}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)", wordBreak: "break-all" }}>
                      {node.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {node.file_path || node.file || "Module"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Node Inspector */}
        <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {selectedNode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span className="badge badge-primary" style={{ fontSize: "11px", marginBottom: "6px" }}>
                  {selectedNode.type ? selectedNode.type.toUpperCase() : "SYMBOL"}
                </span>
                <h3 style={{ fontSize: "17px", fontWeight: 800, wordBreak: "break-all" }}>
                  {selectedNode.name}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginTop: "2px" }}>
                  {selectedNode.file_path || selectedNode.file || "Root directory"}
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Dependency Summary
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {selectedNode.summary || `AST Node defining ${selectedNode.name}. Maps incoming calls and downstream execution.`}
                </div>
              </div>

              {/* Inbound Callers */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Inbound References / Callers:
                </div>
                {selectedNode.callers && selectedNode.callers.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {selectedNode.callers.map((c, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: "11.5px", justifyContent: "flex-start" }}>
                        • {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No external callers mapped.</div>
                )}
              </div>

              {/* Outbound Dependencies */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Outbound Dependencies:
                </div>
                {selectedNode.dependencies && selectedNode.dependencies.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {selectedNode.dependencies.map((d, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: "11.5px", justifyContent: "flex-start" }}>
                        • {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No outbound dependencies.</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto 0" }}>
              <Info size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <div style={{ fontSize: "13px" }}>Click on any symbol node in the canvas to inspect its callers and dependencies.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
