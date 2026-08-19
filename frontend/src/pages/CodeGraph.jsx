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
  const [impactData, setImpactData] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const fetchGraph = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await buildGraph(activeRepo.name);
      setGraphData(data?.graph || data);
      addToast("Knowledge graph generated.", "info");
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

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-3)" }}>
        <div>
          <h1 className="page-title">Knowledge Graph</h1>
          <p className="page-subtitle">
            Repository relationships between files, classes, functions, and import dependencies.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Rebuild Graph</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="card" style={{ padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", width: "260px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search symbol (e.g. authenticate_user)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInspectSymbol(searchSymbol)}
              style={{ paddingLeft: "30px", height: "32px", fontSize: "13px" }}
            />
            <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: "8px", top: "9px" }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => handleInspectSymbol(searchSymbol)}>
            Inspect Symbol
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span><b>{nodes.length}</b> Nodes</span>
          <span><b>{links.length}</b> Edges</span>
        </div>
      </div>

      {/* Graph Visualizer & Inspector Split */}
      <div style={{ flex: 1, display: "flex", gap: "var(--space-4)", minHeight: 0 }}>
        {/* Graph Workspace Canvas */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", position: "relative", backgroundColor: "#F9FAFB" }}>
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "var(--text-muted)" }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
              <span>Parsing AST and generating dependency topology...</span>
            </div>
          ) : nodes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No graph data available. Rebuild graph above.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {nodes.slice(0, 80).map((node, i) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedNode(node);
                        handleInspectSymbol(node.name);
                      }}
                      className="card"
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "var(--primary-light)" : "#FFFFFF",
                        borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        {node.type === "file" && <FileCode size={15} color="var(--primary)" />}
                        {node.type === "class" && <Box size={15} color="var(--info)" />}
                        {node.type === "function" && <Cpu size={15} color="var(--success)" />}
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {node.name}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Type: <span className="badge badge-neutral" style={{ fontSize: "10px", padding: "1px 4px" }}>{node.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector & Blast Radius Pane */}
        <div className="card" style={{ width: "380px", display: "flex", flexDirection: "column", padding: "var(--space-4)", overflowY: "auto" }}>
          <h2 className="card-title" style={{ marginBottom: "var(--space-3)" }}>
            <Layers size={17} color="var(--primary)" />
            <span>Symbol Inspector</span>
          </h2>

          {selectedNode || impactData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "10px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)" }}>
                  {impactData?.symbol || selectedNode?.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {selectedNode?.file || "Target Symbol"}
                </div>
              </div>

              {loadingImpact ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <span>Calculating blast radius...</span>
                </div>
              ) : impactData ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>Blast Radius Score:</span>
                    <span className={`badge ${impactData.blast_radius_score === "HIGH" ? "badge-danger" : impactData.blast_radius_score === "MEDIUM" ? "badge-warning" : "badge-success"}`}>
                      {impactData.blast_radius_score}
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {impactData.summary}
                  </div>

                  {impactData.direct_callers?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>
                        Direct Callers ({impactData.direct_callers.length}):
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {impactData.direct_callers.slice(0, 5).map((c, i) => (
                          <div key={i} style={{ fontSize: "12px", padding: "4px 8px", backgroundColor: "#FFFFFF", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                            <b>{c.name}</b> in <code>{c.path}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {impactData.affected_apis?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--error)", marginBottom: "4px" }}>
                        Affected API Endpoints ({impactData.affected_apis.length}):
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {impactData.affected_apis.map((api, i) => (
                          <div key={i} style={{ fontSize: "12px", padding: "4px 8px", backgroundColor: "var(--error-light)", borderRadius: "4px", color: "var(--error)" }}>
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
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 10px", fontSize: "13px" }}>
              Click any node on the left or search a symbol above to analyze blast radius and callers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
