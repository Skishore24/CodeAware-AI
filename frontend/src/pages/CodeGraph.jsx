import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GitGraph,
  Search,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Loader2,
  Info,
  Network,
  GitFork,
  LayoutGrid,
  Layers,
  FolderGit2,
  FileCode,
  Box,
  Cpu,
  Move,
  Lock,
  Unlock,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { buildGraph } from "../api/graph";
import { useToast } from "../components/Toast";
import EmptyState from "../components/feedback/EmptyState";

export default function CodeGraph() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [nodeFilter, setNodeFilter] = useState("all"); // 'all' | 'file' | 'class' | 'function'
  const [layoutMode, setLayoutMode] = useState("network"); // 'network' | 'tree' | 'grid'
  const [physicsLocked, setPhysicsLocked] = useState(false);
  const [isSectionMaximized, setIsSectionMaximized] = useState(false);

  // Canvas Transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 50, y: 40, scale: 0.95 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Node state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const canvasCardRef = useRef(null);

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

  // Native fullscreen toggle for canvas section card
  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      if (canvasCardRef.current?.requestFullscreen) {
        canvasCardRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const rawNodes = useMemo(() => graphData?.nodes || [], [graphData]);
  const rawLinks = useMemo(() => graphData?.links || [], [graphData]);

  // Node Colors & Icons by AST symbol type
  const getNodeMeta = useCallback((type) => {
    switch (type) {
      case "repository":
        return {
          color: "#4F46E5",
          bg: "rgba(79, 70, 229, 0.15)",
          border: "#6366F1",
          glow: "rgba(99, 102, 241, 0.4)",
          radius: 28,
          icon: FolderGit2,
          label: "Repository",
        };
      case "class":
        return {
          color: "#8B5CF6",
          bg: "rgba(139, 92, 246, 0.15)",
          border: "#A78BFA",
          glow: "rgba(139, 92, 246, 0.35)",
          radius: 22,
          icon: Box,
          label: "Class",
        };
      case "function":
        return {
          color: "#06B6D4",
          bg: "rgba(6, 182, 212, 0.15)",
          border: "#22D3EE",
          glow: "rgba(6, 182, 212, 0.35)",
          radius: 18,
          icon: Cpu,
          label: "Function",
        };
      case "file":
        return {
          color: "#3B82F6",
          bg: "rgba(59, 130, 246, 0.15)",
          border: "#60A5FA",
          glow: "rgba(59, 130, 246, 0.35)",
          radius: 24,
          icon: FileCode,
          label: "File",
        };
      default:
        return {
          color: "#10B981",
          bg: "rgba(16, 185, 129, 0.15)",
          border: "#34D399",
          glow: "rgba(16, 185, 129, 0.35)",
          radius: 18,
          icon: Layers,
          label: "Symbol",
        };
    }
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((n) => {
      const matchesType = nodeFilter === "all" || n.type === nodeFilter;
      const matchesSearch =
        !searchSymbol.trim() ||
        n.name.toLowerCase().includes(searchSymbol.toLowerCase()) ||
        (n.file && n.file.toLowerCase().includes(searchSymbol.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [rawNodes, nodeFilter, searchSymbol]);

  // Active node IDs map for fast lookup
  const activeNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id || n.name));
  }, [filteredNodes]);

  // Filtered links where both source and target exist
  const filteredLinks = useMemo(() => {
    return rawLinks.filter((l) => {
      const srcId = typeof l.source === "object" ? l.source.id : l.source;
      const dstId = typeof l.target === "object" ? l.target.id : l.target;
      return activeNodeIds.has(srcId) && activeNodeIds.has(dstId);
    });
  }, [rawLinks, activeNodeIds]);

  // Compute Layout Positions (Force / Tree)
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    if (filteredNodes.length === 0) return;

    const width = 960;
    const height = 680;
    const positions = {};

    if (layoutMode === "tree") {
      // Hierarchical Layout (Root -> Files -> Functions/Classes)
      const layers = { repository: [], file: [], class: [], function: [], other: [] };
      filteredNodes.forEach((n) => {
        const type = n.type || "other";
        if (layers[type]) layers[type].push(n);
        else layers.other.push(n);
      });

      const layerKeys = Object.keys(layers).filter((k) => layers[k].length > 0);
      layerKeys.forEach((key, layerIdx) => {
        const layerNodes = layers[key];
        const layerX = 140 + layerIdx * 220;
        const total = layerNodes.length;
        layerNodes.forEach((node, idx) => {
          const spacing = Math.min(70, (height - 140) / Math.max(1, total));
          const startY = height / 2 - ((total - 1) * spacing) / 2;
          positions[node.id || node.name] = {
            x: layerX,
            y: startY + idx * spacing,
            vx: 0,
            vy: 0,
          };
        });
      });
    } else {
      // Force / Radial Network Layout
      const rootNode = filteredNodes.find((n) => n.type === "repository") || filteredNodes[0];
      const otherNodes = filteredNodes.filter((n) => n !== rootNode);

      if (rootNode) {
        positions[rootNode.id || rootNode.name] = {
          x: width / 2,
          y: height / 2,
          vx: 0,
          vy: 0,
        };
      }

      // Group by file for clean clustering
      const fileNodes = otherNodes.filter((n) => n.type === "file");
      const symbolNodes = otherNodes.filter((n) => n.type !== "file");

      // Orbit 1: File nodes in a circle
      const fileRadius = Math.min(280, Math.max(150, fileNodes.length * 26));
      fileNodes.forEach((node, i) => {
        const angle = (i / Math.max(1, fileNodes.length)) * 2 * Math.PI - Math.PI / 2;
        positions[node.id || node.name] = {
          x: width / 2 + Math.cos(angle) * fileRadius,
          y: height / 2 + Math.sin(angle) * fileRadius,
          vx: 0,
          vy: 0,
        };
      });

      // Orbit 2: Symbol nodes radiating around their parent files
      const symbolRadius = fileRadius + 150;
      symbolNodes.forEach((node, i) => {
        const angle = (i / Math.max(1, symbolNodes.length)) * 2 * Math.PI;
        const r = symbolRadius + (i % 3) * 38;
        positions[node.id || node.name] = {
          x: width / 2 + Math.cos(angle) * r,
          y: height / 2 + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      });
    }

    setNodePositions(positions);
    setTransform({ x: 50, y: 40, scale: 0.95 });
  }, [filteredNodes, layoutMode]);

  // Interactive Dragging on Node
  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    const nodeId = node.id || node.name;
    setDraggedNodeId(nodeId);

    const pos = nodePositions[nodeId] || { x: 0, y: 0 };
    setDragOffset({
      x: (e.clientX - transform.x) / transform.scale - pos.x,
      y: (e.clientY - transform.y) / transform.scale - pos.y,
    });
    setSelectedNode(node);
  };

  // Interactive Canvas Panning
  const handleCanvasMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === "svg" || e.target.classList.contains("canvas-bg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggedNodeId && !physicsLocked) {
      const newX = (e.clientX - transform.x) / transform.scale - dragOffset.x;
      const newY = (e.clientY - transform.y) / transform.scale - dragOffset.y;
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: { ...prev[draggedNodeId], x: newX, y: newY },
      }));
    } else if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(2.8, Math.max(0.3, prev.scale * zoomFactor)),
    }));
  };

  const resetView = () => {
    setTransform({ x: 50, y: 40, scale: 0.95 });
  };

  // Connected Highlight calculations
  const connectedIds = useMemo(() => {
    const target = hoveredNode || selectedNode;
    if (!target) return new Set();

    const targetId = target.id || target.name;
    const ids = new Set([targetId]);

    rawLinks.forEach((link) => {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const dstId = typeof link.target === "object" ? link.target.id : link.target;
      if (srcId === targetId) ids.add(dstId);
      if (dstId === targetId) ids.add(srcId);
    });

    return ids;
  }, [hoveredNode, selectedNode, rawLinks]);

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

  return (
    <div
      className="page-container"
      style={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "20px", fontWeight: 800 }}>
            Knowledge Graph & Architecture Topology
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Interactive connected map of codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> showing direct and indirect dependency links.
          </p>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Rebuild Graph</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Controls Bar */}
      <div className="card" style={{ padding: "8px 14px", marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Symbol Search */}
          <div style={{ position: "relative", width: "200px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search symbols..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              style={{ paddingLeft: "30px", fontSize: "12px", height: "34px" }}
            />
            <Search size={13} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          </div>

          {/* Type Filters */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["all", "file", "class", "function"].map((t) => (
              <button
                key={t}
                className={`btn ${nodeFilter === t ? "btn-primary" : "btn-ghost"} btn-sm`}
                onClick={() => setNodeFilter(t)}
                style={{ fontSize: "11.5px", padding: "3px 8px", textTransform: "uppercase" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Switcher & View Controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Layout Mode Switcher */}
          <div style={{ display: "flex", backgroundColor: "var(--bg-muted)", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <button
              className={`btn btn-sm ${layoutMode === "network" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLayoutMode("network")}
              style={{ fontSize: "11.5px", padding: "4px 8px", gap: "5px" }}
              title="Force-Directed Connected Network"
            >
              <Network size={13} />
              <span>Network</span>
            </button>
            <button
              className={`btn btn-sm ${layoutMode === "tree" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLayoutMode("tree")}
              style={{ fontSize: "11.5px", padding: "4px 8px", gap: "5px" }}
              title="Hierarchical Tree Layout"
            >
              <GitFork size={13} />
              <span>Tree</span>
            </button>
            <button
              className={`btn btn-sm ${layoutMode === "grid" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLayoutMode("grid")}
              style={{ fontSize: "11.5px", padding: "4px 8px", gap: "5px" }}
              title="Flat Card Grid"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
          </div>

          {/* Physics Lock Toggle */}
          {layoutMode !== "grid" && (
            <button
              className={`btn btn-sm ${physicsLocked ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setPhysicsLocked(!physicsLocked)}
              title={physicsLocked ? "Positions Locked (Click to Unlock Drag)" : "Node Dragging Enabled"}
              style={{ padding: "4px 8px" }}
            >
              {physicsLocked ? <Lock size={13} color="var(--warning)" /> : <Unlock size={13} />}
            </button>
          )}

          {/* Zoom Controls */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.3, prev.scale - 0.15) }))}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", width: "38px", textAlign: "center", fontFamily: "JetBrains Mono" }}>
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(2.8, prev.scale + 0.15) }))}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={resetView} title="Reset Center View">
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Section Maximize / Expand Toggle */}
          <button
            className={`btn btn-sm ${isSectionMaximized ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setIsSectionMaximized(!isSectionMaximized)}
            title={isSectionMaximized ? "Restore Inspector Panel" : "Maximize Canvas (Hide Inspector)"}
            style={{ gap: "5px", padding: "4px 10px", fontWeight: 600 }}
          >
            {isSectionMaximized ? (
              <>
                <PanelRightOpen size={13} />
                <span>Show Inspector</span>
              </>
            ) : (
              <>
                <PanelRightClose size={13} />
                <span>Maximize Canvas</span>
              </>
            )}
          </button>

          {/* Native Fullscreen on Section Card */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleNativeFullscreen}
            title="Browser Fullscreen Canvas"
            style={{ padding: "4px 8px" }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Split */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: isSectionMaximized ? "1fr" : "1fr 340px",
          gap: "var(--space-4)",
          transition: "grid-template-columns 0.2s ease",
        }}
      >
        {/* Left: Interactive Connected Graph Canvas */}
        <div
          ref={canvasCardRef}
          className="card"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "var(--bg-subtle)",
            display: "flex",
            flexDirection: "column",
            userSelect: "none",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px" }}>
              <Loader2 size={36} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-muted)" }}>
                Parsing AST symbols & constructing topological graph...
              </span>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
              <GitGraph size={36} style={{ opacity: 0.4 }} />
              <span>No nodes match your current search / type filters</span>
            </div>
          ) : layoutMode === "grid" ? (
            /* Traditional Flat Grid View */
            <div
              style={{
                flex: 1,
                padding: "20px",
                overflow: "auto",
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
                gap: "12px",
                transform: `scale(${transform.scale})`,
                transformOrigin: "top left",
              }}
            >
              {filteredNodes.map((node, idx) => {
                const isSelected = selectedNode?.id === node.id || selectedNode?.name === node.name;
                const meta = getNodeMeta(node.type);
                const Icon = meta.icon;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedNode(node)}
                    className="card card-interactive"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border-color)"}`,
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                      boxShadow: isSelected ? "0 0 0 2px var(--primary), var(--shadow-md)" : "var(--shadow-xs)",
                      minWidth: "160px",
                      maxWidth: "220px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span className="badge" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: "10px", padding: "1px 6px" }}>
                        {node.type || "symbol"}
                      </span>
                      <Icon size={14} color={meta.color} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)", wordBreak: "break-all" }}>
                      {node.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {node.file || "Module"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Connected SVG Interactive Graph Canvas */
            <svg
              ref={svgRef}
              style={{
                width: "100%",
                height: "100%",
                cursor: isPanning ? "grabbing" : draggedNodeId ? "grabbing" : "grab",
                backgroundColor: "var(--bg-app)",
              }}
            >
              {/* Definitions: Arrow Markers & Glow Filters */}
              <defs>
                <marker
                  id="graph-arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--text-subtle)" opacity="0.7" />
                </marker>
                <marker
                  id="graph-arrow-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--primary)" />
                </marker>
                <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(99, 102, 241, 0.12)" />
                </pattern>
              </defs>

              {/* Background Interactive Rect for Drag-Panning */}
              <rect width="100%" height="100%" fill="url(#graph-grid)" className="canvas-bg" />

              {/* Transformed Canvas Container (Pan + Zoom) */}
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                {/* 1. Connecting Links Layer */}
                <g className="graph-links">
                  {filteredLinks.map((link, idx) => {
                    const srcId = typeof link.source === "object" ? link.source.id : link.source;
                    const dstId = typeof link.target === "object" ? link.target.id : link.target;

                    const srcPos = nodePositions[srcId];
                    const dstPos = nodePositions[dstId];
                    if (!srcPos || !dstPos) return null;

                    const isHighlighted =
                      connectedIds.has(srcId) && connectedIds.has(dstId) && (hoveredNode || selectedNode);

                    // Compute curved quadratic bezier
                    const dx = dstPos.x - srcPos.x;
                    const dy = dstPos.y - srcPos.y;
                    const midX = (srcPos.x + dstPos.x) / 2 - dy * 0.08;
                    const midY = (srcPos.y + dstPos.y) / 2 + dx * 0.08;

                    return (
                      <g key={`link-${idx}`}>
                        <path
                          d={`M ${srcPos.x} ${srcPos.y} Q ${midX} ${midY} ${dstPos.x} ${dstPos.y}`}
                          fill="none"
                          stroke={isHighlighted ? "var(--primary)" : "var(--border-color)"}
                          strokeWidth={isHighlighted ? 2.5 : 1.2}
                          strokeDasharray={link.type === "imports" ? "4,4" : "none"}
                          opacity={isHighlighted ? 1 : hoveredNode ? 0.2 : 0.65}
                          markerEnd={isHighlighted ? "url(#graph-arrow-active)" : "url(#graph-arrow)"}
                          style={{ transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s" }}
                        />
                        {/* Optional link label */}
                        {isHighlighted && link.type && (
                          <text
                            x={midX}
                            y={midY}
                            fill="var(--primary)"
                            fontSize="9px"
                            fontWeight="600"
                            textAnchor="middle"
                            fontFamily="JetBrains Mono"
                            style={{
                              backgroundColor: "var(--bg-card)",
                              padding: "2px",
                            }}
                          >
                            {link.type}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* 2. Connected Nodes Layer */}
                <g className="graph-nodes">
                  {filteredNodes.map((node, idx) => {
                    const nodeId = node.id || node.name;
                    const pos = nodePositions[nodeId];
                    if (!pos) return null;

                    const isSelected = selectedNode?.id === node.id || selectedNode?.name === node.name;
                    const isHovered = hoveredNode?.id === node.id || hoveredNode?.name === node.name;
                    const isConnected = connectedIds.has(nodeId);
                    const isDimmed = (hoveredNode || selectedNode) && !isConnected;

                    const meta = getNodeMeta(node.type);
                    const Icon = meta.icon;
                    const isRepo = node.type === "repository";

                    return (
                      <g
                        key={`node-${idx}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onMouseDown={(e) => handleNodeMouseDown(e, node)}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedNode(node)}
                        style={{
                          cursor: "pointer",
                          opacity: isDimmed ? 0.3 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        {/* Outer Pulsing Aura when selected or hovered */}
                        {(isSelected || isHovered) && (
                          <circle
                            r={meta.radius + 8}
                            fill="none"
                            stroke={meta.color}
                            strokeWidth="2"
                            strokeDasharray="3,3"
                            opacity="0.7"
                          >
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0"
                              to="360"
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}

                        {/* Node Base Circle / Pill */}
                        <circle
                          r={meta.radius}
                          fill="var(--bg-card)"
                          stroke={isSelected ? "var(--primary)" : isConnected ? meta.color : meta.border}
                          strokeWidth={isSelected ? 3 : 2}
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 12px ${meta.glow})` : "none",
                            transition: "all 0.2s ease",
                          }}
                        />

                        {/* Node Type Color Accent Fill */}
                        <circle r={meta.radius - 3} fill={meta.bg} />

                        {/* Node Center Icon */}
                        <foreignObject
                          x={-10}
                          y={-10}
                          width={20}
                          height={20}
                          style={{ pointerEvents: "none" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
                            <Icon size={14} />
                          </div>
                        </foreignObject>

                        {/* Node Text Label */}
                        <text
                          y={meta.radius + 14}
                          textAnchor="middle"
                          fill="var(--text-main)"
                          fontSize={isRepo ? "12.5px" : "11px"}
                          fontWeight={isSelected || isRepo ? "700" : "600"}
                          fontFamily="'Plus Jakarta Sans', sans-serif"
                          style={{ pointerEvents: "none" }}
                        >
                          {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                        </text>

                        {/* Secondary Type Tag */}
                        <text
                          y={meta.radius + 26}
                          textAnchor="middle"
                          fill="var(--text-muted)"
                          fontSize="9px"
                          fontFamily="JetBrains Mono"
                          style={{ pointerEvents: "none" }}
                        >
                          {node.type || "symbol"}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          )}

          {/* Floating Canvas Quick Tips Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "5px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "11px",
              color: "var(--text-muted)",
              boxShadow: "var(--shadow-sm)",
              pointerEvents: "none",
            }}
          >
            <Move size={12} color="var(--primary)" />
            <span>Drag node to rearrange • Drag canvas to pan • Scroll to zoom</span>
          </div>
        </div>

        {/* Right: Selected Node Inspector & Call Graph */}
        {!isSectionMaximized && (
          <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {selectedNode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span className="badge badge-primary" style={{ fontSize: "11px" }}>
                      {selectedNode.type ? selectedNode.type.toUpperCase() : "SYMBOL"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                      AST Node
                    </span>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, wordBreak: "break-all" }}>
                    {selectedNode.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginTop: "2px" }}>
                    {selectedNode.file || selectedNode.path || "Root directory"}
                  </div>
                </div>

                <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Topology Context
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {selectedNode.summary || `AST Node defining ${selectedNode.name}. Maps incoming calls and downstream execution in the dependency tree.`}
                  </div>
                </div>

                {/* Inbound Callers */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Inbound References / Callers:
                  </div>
                  {(() => {
                    const targetId = selectedNode.id || selectedNode.name;
                    const inbound = rawLinks.filter((l) => {
                      const dstId = typeof l.target === "object" ? l.target.id : l.target;
                      return dstId === targetId;
                    });

                    return inbound.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {inbound.map((l, i) => {
                          const srcId = typeof l.source === "object" ? l.source.id : l.source;
                          const matchingNode = rawNodes.find((n) => (n.id || n.name) === srcId);
                          return (
                            <div
                              key={i}
                              className="badge badge-neutral card-interactive"
                              onClick={() => matchingNode && setSelectedNode(matchingNode)}
                              style={{ fontSize: "11.5px", padding: "5px 8px", justifyContent: "space-between", cursor: "pointer" }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                • {matchingNode ? matchingNode.name : srcId}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>
                                {l.type || "relies_on"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No external callers mapped.</div>
                    );
                  })()}
                </div>

                {/* Outbound Dependencies */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Outbound Dependencies:
                  </div>
                  {(() => {
                    const srcId = selectedNode.id || selectedNode.name;
                    const outbound = rawLinks.filter((l) => {
                      const lSrcId = typeof l.source === "object" ? l.source.id : l.source;
                      return lSrcId === srcId;
                    });

                    return outbound.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {outbound.map((l, i) => {
                          const dstId = typeof l.target === "object" ? l.target.id : l.target;
                          const matchingNode = rawNodes.find((n) => (n.id || n.name) === dstId);
                          return (
                            <div
                              key={i}
                              className="badge badge-neutral card-interactive"
                              onClick={() => matchingNode && setSelectedNode(matchingNode)}
                              style={{ fontSize: "11.5px", padding: "5px 8px", justifyContent: "space-between", cursor: "pointer" }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                • {matchingNode ? matchingNode.name : dstId}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>
                                {l.type || "calls"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No outbound dependencies.</div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto 0" }}>
                <Info size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <div style={{ fontSize: "13px" }}>Click on any node in the graph to inspect its callers and dependencies.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
