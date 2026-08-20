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
  AlertTriangle,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { buildGraph, getImpact } from "../api/graph";
import { useToast } from "../components/Toast";

export default function CodeGraph() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [nodeFilter, setNodeFilter] = useState("all"); // 'all' | 'file' | 'class' | 'function'
  const [impactData, setImpactData] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const fetchGraph = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await buildGraph(activeRepo.name);
      setGraphData(data?.graph || data);
      addToast("Knowledge graph generated successfully.", "info");
    } catch (err) {
      addToast(err.message || "Failed to load graph", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activeRepo]);

  const handleInspectSymbol = async (symbolName) => {
    if (!symbolName || !activeRepo) return;
    setLoadingImpact(true);
    try {
      const data = await getImpact(activeRepo.name, symbolName);
      setImpactData(data);
    } catch (err) {
      addToast(err.message || "Impact calculation failed", "error");
    } finally {
      setLoadingImpact(false);
    }
  };

  const nodes = graphData?.nodes || [];
  const links = graphData?.links || [];
  const summary = graphData?.summary || {};

  const filteredNodes = nodes.filter((n) => {
    const matchesType = nodeFilter === "all" || n.type === nodeFilter;
    const matchesSearch = !searchSymbol.trim() || n.name.toLowerCase().includes(searchSymbol.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-3)" }}>
        <div>
          <h1 className="page-title">Knowledge Graph & Topology</h1>
          <p className="page-subtitle">
            Topological relationships between modules, classes, functions, and cross-file dependencies.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Rebuild Graph</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="card" style={{ padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", width: "240px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search symbol..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              style={{ paddingLeft: "30px", height: "32px", fontSize: "12.5px" }}
            />
            <Search size={14} color="var(--text-subtle)" style={{ position: "absolute", left: "9px", top: "9px" }} />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["all", "file", "class", "function"].map((type) => (
              <button
                key={type}
                className={`btn btn-sm ${nodeFilter === type ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setNodeFilter(type)}
                style={{ textTransform: "capitalize", fontSize: "11.5px", padding: "4px 8px" }}
              >
                {type === "all" ? "All Nodes" : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
          <span><b>{nodes.length}</b> Nodes</span>
          <span>•</span>
          <span><b>{links.length}</b> Edges</span>
        </div>
      </div>

      {/* Main Split Explorer */}
      <div style={{ flex: 1, display: "flex", gap: "var(--space-4)", minHeight: 0 }}>
        {/* Left: Nodes Grid Explorer */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", backgroundColor: "var(--bg-subtle)" }}>
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "var(--text-muted)" }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: "13.5px", fontWeight: 500 }}>Generating graph topology and symbol edges...</span>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
              <GitGraph size={36} color="var(--border-hover)" />
              <span>No nodes matching the current filter criteria.</span>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {filteredNodes.slice(0, 100).map((node, i) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedNode(node);
                        handleInspectSymbol(node.name);
                      }}
                      className="card card-interactive"
                      style={{
                        padding: "10px 12px",
                        backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                        borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                        boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            backgroundColor: node.type === "file" ? "var(--primary-light)" : node.type === "class" ? "var(--info-light)" : "var(--success-light)",
                            color: node.type === "file" ? "var(--primary)" : node.type === "class" ? "var(--info)" : "var(--success)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {node.type === "file" ? <FileCode size={13} /> : node.type === "class" ? <Box size={13} /> : <Cpu size={13} />}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: isSelected ? "var(--primary)" : "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {node.name}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
                        <span className="badge badge-neutral" style={{ fontSize: "10px", padding: "1px 5px", textTransform: "capitalize" }}>
                          {node.type}
                        </span>
                        {node.line && <span>Line {node.line}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Inspector & Blast Radius Drawer */}
        <div className="card" style={{ width: "400px", display: "flex", flexDirection: "column", padding: "var(--space-4)", overflowY: "auto" }}>
          <h2 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
            <Layers size={17} color="var(--primary)" />
            <span>Topological Inspector</span>
          </h2>

          {selectedNode || impactData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Selected Node Summary Box */}
              <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>
                  {impactData?.symbol || selectedNode?.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                  {selectedNode?.file || selectedNode?.path || "Workspace symbol"}
                </div>
              </div>

              {loadingImpact ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <span style={{ fontSize: "13px" }}>Calculating callers & dependencies...</span>
                </div>
              ) : impactData ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Blast Radius Score:</span>
                    <span className={`badge ${impactData.blast_radius_score === "HIGH" ? "badge-danger" : impactData.blast_radius_score === "MEDIUM" ? "badge-warning" : "badge-success"}`}>
                      Score: {impactData.blast_radius_score}
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", backgroundColor: "var(--bg-surface)", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                    {impactData.summary}
                  </div>

                  {/* Direct Callers */}
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
                      Direct Callers ({impactData.direct_callers?.length || 0}):
                    </div>
                    {impactData.direct_callers?.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No direct callers found.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {impactData.direct_callers.slice(0, 6).map((c, i) => (
                          <div key={i} style={{ fontSize: "12px", padding: "6px 8px", backgroundColor: "var(--bg-subtle)", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                            <span style={{ fontWeight: 600 }}>{c.name}</span> in <code style={{ fontSize: "11px" }}>{c.path}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Affected APIs */}
                  {impactData.affected_apis?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--error)", marginBottom: "6px" }}>
                        Affected API Endpoints ({impactData.affected_apis.length}):
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {impactData.affected_apis.map((api, i) => (
                          <div key={i} style={{ fontSize: "12px", padding: "6px 8px", backgroundColor: "var(--error-light)", borderRadius: "4px", color: "var(--error)", border: "1px solid var(--error-border)" }}>
                            {api.name} ({api.path})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "50px 10px", fontSize: "13px" }}>
              <GitFork size={36} color="var(--border-hover)" style={{ margin: "0 auto 10px" }} />
              <div>Click any node in the topology grid to inspect callers, callees, and blast radius.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
