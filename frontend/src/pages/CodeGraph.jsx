import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GitGraph,
  Search,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
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
  Crosshair,
  Filter,
  Compass,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { buildGraph } from "../api/graph";
import { useToast } from "../components/Toast";
import EmptyState from "../components/feedback/EmptyState";
import PremiumLoader from "../components/common/PremiumLoader";
import ButtonSpinner from "../components/common/ButtonSpinner";

export default function CodeGraph() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  
  // Scope granularity: 'architecture' (clean: files + classes) | 'files' (high-level files) | 'all' (dense symbols)
  const [viewScope, setViewScope] = useState("architecture");
  const [nodeFilter, setNodeFilter] = useState("all"); // 'all' | 'file' | 'class' | 'function'
  const [selectedPackage, setSelectedPackage] = useState("all"); // 'all' | specific package/subsystem
  const [layoutMode, setLayoutMode] = useState("network"); // 'network' | 'tree' | 'grid'
  const [physicsLocked, setPhysicsLocked] = useState(false);
  const [isSectionMaximized, setIsSectionMaximized] = useState(false);

  // Canvas Transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 100, y: 80, scale: 0.85 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Node state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Stored Island Boundaries for Network Layout
  const [islandMeta, setIslandMeta] = useState([]);
  const [nodePositions, setNodePositions] = useState({});

  const svgRef = useRef(null);
  const canvasCardRef = useRef(null);

  const fetchGraph = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const data = await buildGraph(activeRepo.name);
      const graph = data?.graph || data;
      setGraphData(graph);
      // Start in calm resting state (no forced selection of repository root)
      setSelectedNode(null);
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

  // Extract canonical package/subsystem name from file path
  const getNodePackage = useCallback((node) => {
    if (!node) return "Core";
    if (node.type === "repository") return "Repository";
    const filePath = node.file || node.path || "";
    const clean = filePath.replace(/^file:/, "").replace(/\\/g, "/");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length <= 1) return "Root Files";

    // Test suites grouping
    if (parts[0] === "tests") {
      if (parts.length > 2 && parts[1] === "test_tutorial") {
        return parts[2].replace(/^test_/, "");
      }
      if (parts.length > 1) {
        return parts[1].replace(/^test_/, "");
      }
    }
    // Generic project structure (src, app, lib, packages)
    if (parts.length > 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return parts[0];
  }, []);

  // Compute available packages with file counts
  const packages = useMemo(() => {
    const counts = new Map();
    rawNodes.forEach((n) => {
      if (n.type === "file") {
        const pkg = getNodePackage(n);
        counts.set(pkg, (counts.get(pkg) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rawNodes, getNodePackage]);

  // Node Colors & Icons by AST symbol type
  const getNodeMeta = useCallback((type) => {
    switch (type) {
      case "repository":
        return {
          color: "#8B5CF6",
          bg: "rgba(139, 92, 246, 0.18)",
          border: "#A78BFA",
          glow: "rgba(139, 92, 246, 0.45)",
          radius: 32,
          icon: FolderGit2,
          label: "Repository",
        };
      case "class":
        return {
          color: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.18)",
          border: "#FBBF24",
          glow: "rgba(245, 158, 11, 0.4)",
          radius: 19,
          icon: Box,
          label: "Class",
        };
      case "function":
        return {
          color: "#06B6D4",
          bg: "rgba(6, 182, 212, 0.18)",
          border: "#22D3EE",
          glow: "rgba(6, 182, 212, 0.4)",
          radius: 14,
          icon: Cpu,
          label: "Function",
        };
      case "file":
        return {
          color: "#3B82F6",
          bg: "rgba(59, 130, 246, 0.18)",
          border: "#60A5FA",
          glow: "rgba(59, 130, 246, 0.4)",
          radius: 22,
          icon: FileCode,
          label: "File",
        };
      default:
        return {
          color: "#10B981",
          bg: "rgba(16, 185, 129, 0.18)",
          border: "#34D399",
          glow: "rgba(16, 185, 129, 0.4)",
          radius: 16,
          icon: Layers,
          label: "Module",
        };
    }
  }, []);

  // Filtered nodes based on viewScope, package, nodeFilter, and search query
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((n) => {
      // 1. Check Scope
      if (viewScope === "files") {
        if (n.type !== "repository" && n.type !== "file") return false;
      } else if (viewScope === "architecture") {
        if (!["repository", "file", "class"].includes(n.type)) return false;
      }

      // 2. Check Package / Subsystem filter
      if (selectedPackage !== "all") {
        if (n.type !== "repository") {
          const pkg = getNodePackage(n);
          if (pkg !== selectedPackage) return false;
        }
      }

      // 3. Check Specific Node Type Filter
      if (nodeFilter !== "all" && n.type !== nodeFilter) {
        return false;
      }

      // 4. Check Symbol / File Search
      if (searchSymbol.trim()) {
        const query = searchSymbol.toLowerCase();
        const matchesName = (n.name || "").toLowerCase().includes(query);
        const matchesFile = (n.file || "").toLowerCase().includes(query);
        if (!matchesName && !matchesFile) return false;
      }

      return true;
    });
  }, [rawNodes, viewScope, selectedPackage, nodeFilter, searchSymbol, getNodePackage]);

  // Active node IDs set for fast link filtering
  const activeNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id || n.name));
  }, [filteredNodes]);

  // Filtered links: omit trivial root containment links to prevent 374-line radial spoke starburst!
  const filteredLinks = useMemo(() => {
    return rawLinks.filter((l) => {
      const srcId = typeof l.source === "object" ? l.source.id : l.source;
      const dstId = typeof l.target === "object" ? l.target.id : l.target;
      if (!activeNodeIds.has(srcId) || !activeNodeIds.has(dstId)) return false;

      // CRITICAL FIX: Do NOT render root 'contains' spokes from repository to every single file.
      // This was the primary cause of the dense blue bicycle wheel mesh in the screenshot!
      if (l.type === "contains" && (srcId.startsWith("repository:") || dstId.startsWith("repository:"))) {
        return false;
      }

      return true;
    });
  }, [rawLinks, activeNodeIds]);

  // Connected highlight set (Spotlight mode)
  const connectedIds = useMemo(() => {
    const target = hoveredNode || selectedNode;
    if (!target) return new Set();

    const targetId = target.id || target.name;
    const ids = new Set([targetId]);

    filteredLinks.forEach((link) => {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const dstId = typeof link.target === "object" ? link.target.id : link.target;
      if (srcId === targetId) ids.add(dstId);
      if (dstId === targetId) ids.add(srcId);
    });

    return ids;
  }, [hoveredNode, selectedNode, filteredLinks]);

  // Compute Layout Positions (Spacious Module Islands / Hierarchy Tree)
  useEffect(() => {
    if (filteredNodes.length === 0) {
      setNodePositions({});
      setIslandMeta([]);
      return;
    }

    const positions = {};
    const islands = [];

    if (layoutMode === "tree") {
      // Clean Hierarchical Tree Layout: Repository -> Files -> Classes -> Functions
      const rootNode = filteredNodes.find((n) => n.type === "repository");
      const fileNodes = filteredNodes.filter((n) => n.type === "file");
      const classNodes = filteredNodes.filter((n) => n.type === "class");
      const functionNodes = filteredNodes.filter((n) => n.type === "function");
      const otherNodes = filteredNodes.filter(
        (n) => !["repository", "file", "class", "function"].includes(n.type) && n !== rootNode
      );

      const layers = [
        { key: "repo", nodes: rootNode ? [rootNode] : [], x: 120 },
        { key: "files", nodes: fileNodes, x: 440 },
        { key: "classes", nodes: classNodes, x: 780 },
        { key: "functions", nodes: functionNodes.length > 0 ? functionNodes : otherNodes, x: 1080 },
      ].filter((l) => l.nodes.length > 0);

      const totalHeight = Math.max(800, fileNodes.length * 48);

      layers.forEach((layer) => {
        const total = layer.nodes.length;
        const spacing = Math.max(38, Math.min(75, totalHeight / Math.max(1, total)));
        const startY = 80;

        layer.nodes.forEach((node, idx) => {
          positions[node.id || node.name] = {
            x: layer.x,
            y: startY + idx * spacing,
            vx: 0,
            vy: 0,
          };
        });
      });
      setIslandMeta([]);
    } else {
      // -------------------------------------------------------------
      // Spacious Module Islands Layout (Network Mode)
      // Groups files into cohesive subsystem islands with clear boundaries.
      // -------------------------------------------------------------
      const rootNode = filteredNodes.find((n) => n.type === "repository");
      const fileNodes = filteredNodes.filter((n) => n.type === "file");
      const childNodes = filteredNodes.filter((n) => n.type !== "file" && n.type !== "repository");

      // Group files by package
      const filesByPkg = new Map();
      fileNodes.forEach((f) => {
        const pkg = getNodePackage(f);
        if (!filesByPkg.has(pkg)) filesByPkg.set(pkg, []);
        filesByPkg.get(pkg).push(f);
      });

      // Quick lookup for matching child symbols (classes, functions) to parent file
      const fileByPath = new Map();
      fileNodes.forEach((f) => {
        if (f.file) fileByPath.set(f.file, f);
        if (f.id) fileByPath.set(f.id, f);
        if (f.name) fileByPath.set(f.name, f);
      });

      const childrenByFile = new Map();
      childNodes.forEach((child) => {
        let parentFile = null;
        if (child.file) {
          parentFile = fileByPath.get(child.file) || fileByPath.get(`file:${child.file}`);
        }
        const parentId = parentFile ? (parentFile.id || parentFile.name) : "__unassigned__";
        if (!childrenByFile.has(parentId)) childrenByFile.set(parentId, []);
        childrenByFile.get(parentId).push(child);
      });

      const pkgEntries = Array.from(filesByPkg.entries()).sort((a, b) => b[1].length - a[1].length);
      const centerX = 1200;
      const centerY = 900;

      // Position Root Repository Node centrally or at top
      if (rootNode) {
        positions[rootNode.id || rootNode.name] = {
          x: centerX,
          y: pkgEntries.length > 1 ? centerY - 160 : centerY - 280,
          vx: 0,
          vy: 0,
        };
      }

      // Distribute Island Centers via Golden Ratio Phyllotaxis Spiral (Zero spoke overlap)
      pkgEntries.forEach(([pkgName, pkgFiles], k) => {
        const fileCount = pkgFiles.length;
        const islandRadius = Math.max(90, Math.min(320, 50 + Math.sqrt(fileCount) * 44));

        let IX = centerX;
        let IY = centerY;

        if (pkgEntries.length > 1) {
          const R_k = 240 + Math.sqrt(k) * 380;
          const theta_k = k * 2.3999632; // golden angle in radians (~137.5 deg)
          IX = centerX + R_k * Math.cos(theta_k);
          IY = centerY + R_k * Math.sin(theta_k);
        }

        islands.push({
          name: pkgName,
          x: IX,
          y: IY,
          radius: islandRadius + 32,
          fileCount,
        });

        // Arrange files inside this island
        pkgFiles.forEach((fNode, fIdx) => {
          let fx, fy;
          if (fileCount === 1) {
            fx = IX;
            fy = IY;
          } else if (fileCount <= 8) {
            const fAngle = (fIdx / fileCount) * 2 * Math.PI - Math.PI / 2;
            const fDist = Math.min(islandRadius - 28, 48 + fileCount * 8);
            fx = IX + Math.cos(fAngle) * fDist;
            fy = IY + Math.sin(fAngle) * fDist;
          } else {
            // Balanced multi-ring spiral inside the island
            const innerR = Math.sqrt((fIdx + 1) / fileCount) * (islandRadius - 38);
            const innerAngle = fIdx * 2.3999632;
            fx = IX + Math.cos(innerAngle) * innerR;
            fy = IY + Math.sin(innerAngle) * innerR;
          }

          const fId = fNode.id || fNode.name;
          positions[fId] = { x: fx, y: fy, vx: 0, vy: 0 };

          // Position children (classes, functions) immediately around their parent file!
          const children = childrenByFile.get(fId) || [];
          if (children.length > 0) {
            const outAngle = Math.atan2(fy - IY, fx - IX) || 0;
            children.forEach((cNode, cIdx) => {
              const spread = Math.min(Math.PI * 0.8, Math.max(0.4, children.length * 0.3));
              const cAngle = outAngle + (cIdx - (children.length - 1) / 2) * (spread / Math.max(1, children.length));
              const cDist = 48 + (cIdx % 2) * 20;
              positions[cNode.id || cNode.name] = {
                x: fx + Math.cos(cAngle) * cDist,
                y: fy + Math.sin(cAngle) * cDist,
                vx: 0,
                vy: 0,
              };
            });
          }
        });
      });

      // Position any unassigned symbols cleanly near center with ample spacing
      const unassigned = childrenByFile.get("__unassigned__") || [];
      if (unassigned.length > 0) {
        const uRadius = 140;
        unassigned.forEach((uNode, uIdx) => {
          const uAngle = (uIdx / unassigned.length) * 2 * Math.PI;
          positions[uNode.id || uNode.name] = {
            x: centerX + Math.cos(uAngle) * uRadius,
            y: centerY + 180 + Math.sin(uAngle) * uRadius,
            vx: 0,
            vy: 0,
          };
        });
      }

      setIslandMeta(islands);
    }

    setNodePositions(positions);

    // Automatically fit graph to canvas view
    setTimeout(() => {
      const keys = Object.keys(positions);
      if (keys.length === 0) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      keys.forEach((k) => {
        const p = positions[k];
        if (p) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      });

      const cardEl = canvasCardRef.current;
      const cW = cardEl ? cardEl.clientWidth : 900;
      const cH = cardEl ? cardEl.clientHeight : 600;

      const graphW = Math.max(250, maxX - minX + 220);
      const graphH = Math.max(250, maxY - minY + 220);

      const scale = Math.max(0.12, Math.min(1.0, Math.min((cW - 40) / graphW, (cH - 40) / graphH)));
      const cX = (minX + maxX) / 2;
      const cY = (minY + maxY) / 2;

      setTransform({
        x: cW / 2 - cX * scale,
        y: cH / 2 - cY * scale,
        scale,
      });
    }, 60);
  }, [filteredNodes, layoutMode, getNodePackage]);

  // Fit to View helper
  const fitToView = useCallback(() => {
    const keys = Object.keys(nodePositions);
    if (keys.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    keys.forEach((k) => {
      const p = nodePositions[k];
      if (p) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    });

    const cardEl = canvasCardRef.current;
    const cW = cardEl ? cardEl.clientWidth : 900;
    const cH = cardEl ? cardEl.clientHeight : 600;

    const graphW = Math.max(250, maxX - minX + 220);
    const graphH = Math.max(250, maxY - minY + 220);

    const scale = Math.max(0.12, Math.min(1.0, Math.min((cW - 40) / graphW, (cH - 40) / graphH)));
    const cX = (minX + maxX) / 2;
    const cY = (minY + maxY) / 2;

    setTransform({
      x: cW / 2 - cX * scale,
      y: cH / 2 - cY * scale,
      scale,
    });
  }, [nodePositions]);

  // Center on specific node
  const centerOnNode = useCallback((node) => {
    if (!node) return;
    const id = node.id || node.name;
    const pos = nodePositions[id];
    if (!pos) return;

    const cardEl = canvasCardRef.current;
    const cW = cardEl ? cardEl.clientWidth : 900;
    const cH = cardEl ? cardEl.clientHeight : 600;

    setTransform({
      x: cW / 2 - pos.x * 1.15,
      y: cH / 2 - pos.y * 1.15,
      scale: 1.15,
    });
    setSelectedNode(node);
  }, [nodePositions]);

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
    setSelectedNode((prev) => (prev?.id === node.id ? prev : node));
  };

  // Interactive Canvas Panning
  const handleCanvasMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === "svg" || e.target.classList.contains("canvas-bg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      // Clicking empty canvas resets node selection back to balanced overview
      setSelectedNode(null);
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
      scale: Math.min(2.8, Math.max(0.12, prev.scale * zoomFactor)),
    }));
  };

  const resetView = () => {
    fitToView();
  };

  // Link styling helper based on architectural relationship type
  const getLinkStyle = useCallback((type, isHighlighted) => {
    switch (type) {
      case "defines":
        return {
          stroke: isHighlighted ? "#10B981" : "rgba(16, 185, 129, 0.4)",
          dash: "none",
          marker: isHighlighted ? "url(#arrow-defines-active)" : "url(#arrow-defines)",
          label: "defines",
        };
      case "inherits":
        return {
          stroke: isHighlighted ? "#F59E0B" : "rgba(245, 158, 11, 0.5)",
          dash: "none",
          marker: isHighlighted ? "url(#arrow-inherits-active)" : "url(#arrow-inherits)",
          label: "inherits",
        };
      case "imports":
        return {
          stroke: isHighlighted ? "#38BDF8" : "rgba(56, 189, 248, 0.4)",
          dash: "4,4",
          marker: isHighlighted ? "url(#arrow-imports-active)" : "url(#arrow-imports)",
          label: "imports",
        };
      case "calls":
        return {
          stroke: isHighlighted ? "#A855F7" : "rgba(168, 85, 247, 0.45)",
          dash: "none",
          marker: isHighlighted ? "url(#arrow-calls-active)" : "url(#arrow-calls)",
          label: "calls",
        };
      default:
        return {
          stroke: isHighlighted ? "var(--primary)" : "var(--border-color)",
          dash: "none",
          marker: isHighlighted ? "url(#graph-arrow-active)" : "url(#graph-arrow)",
          label: type || "relies_on",
        };
    }
  }, []);

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
        height: "calc(100vh - 105px)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "20px", fontWeight: 800 }}>
            Knowledge Graph & Architecture Topology
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Modular architecture map: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> • Showing {filteredNodes.length} nodes and {filteredLinks.length} dependencies.
          </p>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn btn-secondary btn-sm ${loading ? "btn-loading" : ""}`}
            onClick={fetchGraph}
            disabled={loading}
          >
            {loading ? <ButtonSpinner size={13} /> : <RefreshCw size={13} />}
            <span>{loading ? "Rebuilding Graph..." : "Rebuild Graph"}</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Controls Bar */}
      <div className="card" style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Symbol Search */}
          <div style={{ position: "relative", width: "180px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search symbols..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              style={{ paddingLeft: "30px", fontSize: "12px", height: "32px" }}
            />
            <Search size={13} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "9px" }} />
          </div>

          {/* Scope Selector: Architecture vs Files Only vs All Symbols */}
          <div style={{ display: "flex", backgroundColor: "var(--bg-muted)", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <button
              className={`btn btn-sm ${viewScope === "architecture" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewScope("architecture")}
              style={{ fontSize: "11px", padding: "3px 8px", fontWeight: 600 }}
              title="Architecture View: Files and Core Classes (Cleanest & Recommended)"
            >
              Architecture
            </button>
            <button
              className={`btn btn-sm ${viewScope === "files" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewScope("files")}
              style={{ fontSize: "11px", padding: "3px 8px", fontWeight: 600 }}
              title="Files Only: High-level Directory & Module Containment"
            >
              Files Only
            </button>
            <button
              className={`btn btn-sm ${viewScope === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewScope("all")}
              style={{ fontSize: "11px", padding: "3px 8px", fontWeight: 600 }}
              title="All Symbols: Full AST functions, classes, and methods"
            >
              All Symbols
            </button>
          </div>

          {/* Package / Subsystem Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Module:
            </span>
            <select
              className="input"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              style={{
                fontSize: "11.5px",
                height: "32px",
                padding: "0 8px",
                maxWidth: "200px",
                backgroundColor: "var(--bg-card)",
                cursor: "pointer",
              }}
              title="Filter by package / subsystem"
            >
              <option value="all">All Modules ({packages.length})</option>
              {packages.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} ({pkg.count})
                </option>
              ))}
            </select>
            {selectedPackage !== "all" && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedPackage("all")}
                style={{ fontSize: "11px", padding: "2px 6px", height: "28px" }}
                title="Reset to All Modules"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: "flex", gap: "3px" }}>
            {["all", "file", "class", "function"].map((t) => (
              <button
                key={t}
                className={`btn ${nodeFilter === t ? "btn-primary" : "btn-ghost"} btn-sm`}
                onClick={() => setNodeFilter(t)}
                style={{ fontSize: "11px", padding: "2px 7px", textTransform: "uppercase" }}
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
              style={{ fontSize: "11px", padding: "3px 8px", gap: "4px" }}
              title="Module Islands Network Topology"
            >
              <Network size={12} />
              <span>Islands</span>
            </button>
            <button
              className={`btn btn-sm ${layoutMode === "tree" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLayoutMode("tree")}
              style={{ fontSize: "11px", padding: "3px 8px", gap: "4px" }}
              title="Hierarchical Tree Layout"
            >
              <GitFork size={12} />
              <span>Tree</span>
            </button>
            <button
              className={`btn btn-sm ${layoutMode === "grid" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLayoutMode("grid")}
              style={{ fontSize: "11px", padding: "3px 8px", gap: "4px" }}
              title="Flat Card Grid"
            >
              <LayoutGrid size={12} />
              <span>Grid</span>
            </button>
          </div>

          {/* Physics Lock Toggle */}
          {layoutMode !== "grid" && (
            <button
              className={`btn btn-sm ${physicsLocked ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setPhysicsLocked(!physicsLocked)}
              title={physicsLocked ? "Positions Locked" : "Node Dragging Enabled"}
              style={{ padding: "3px 7px" }}
            >
              {physicsLocked ? <Lock size={12} color="var(--warning)" /> : <Unlock size={12} />}
            </button>
          )}

          {/* Zoom Controls & Fit View */}
          <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.12, prev.scale - 0.15) }))}
              title="Zoom Out"
              style={{ padding: "3px 6px" }}
            >
              <ZoomOut size={12} />
            </button>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", width: "34px", textAlign: "center", fontFamily: "JetBrains Mono" }}>
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(2.8, prev.scale + 0.15) }))}
              title="Zoom In"
              style={{ padding: "3px 6px" }}
            >
              <ZoomIn size={12} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={fitToView} title="Fit Entire Graph to Canvas" style={{ fontSize: "11px", padding: "3px 7px", gap: "4px" }}>
              <Crosshair size={12} />
              <span>Fit</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={resetView} title="Reset View" style={{ padding: "3px 6px" }}>
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Section Maximize / Expand Toggle */}
          <button
            className={`btn btn-sm ${isSectionMaximized ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setIsSectionMaximized(!isSectionMaximized)}
            title={isSectionMaximized ? "Restore Inspector Panel" : "Maximize Canvas (Hide Inspector)"}
            style={{ gap: "4px", padding: "3px 8px", fontSize: "11px", fontWeight: 600 }}
          >
            {isSectionMaximized ? (
              <>
                <PanelRightOpen size={12} />
                <span>Inspector</span>
              </>
            ) : (
              <>
                <PanelRightClose size={12} />
                <span>Maximize</span>
              </>
            )}
          </button>

          {/* Native Fullscreen */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleNativeFullscreen}
            title="Browser Fullscreen Canvas"
            style={{ padding: "3px 6px" }}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Split */}
      <div
        className={`graph-workspace-grid ${isSectionMaximized ? "maximized" : ""}`}
        style={{
          flex: 1,
          minHeight: 0,
          height: "100%",
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
            height: "100%",
            width: "100%",
            userSelect: "none",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PremiumLoader
                size="lg"
                title="Synthesizing Knowledge Graph Topology"
                subtitle="Parsing AST symbols, resolving call hierarchies & module relationships..."
                icon={GitGraph}
                steps={[
                  { label: "Scanning AST Files & Classes", icon: FileCode },
                  { label: "Resolving Cross-Module Imports", icon: Layers },
                  { label: "Building Module Island Topology", icon: GitGraph },
                ]}
              />
            </div>
          ) : filteredNodes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
              <GitGraph size={36} style={{ opacity: 0.4 }} />
              <span>No nodes match your current filters</span>
              {selectedPackage !== "all" && (
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPackage("all")}>
                  Clear Module Filter
                </button>
              )}
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
                      width: "180px",
                      padding: "12px",
                      borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                      cursor: "pointer",
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
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--text-subtle)" opacity="0.4" />
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
                <marker
                  id="arrow-defines"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" opacity="0.5" />
                </marker>
                <marker
                  id="arrow-defines-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
                </marker>
                <marker
                  id="arrow-inherits"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" opacity="0.6" />
                </marker>
                <marker
                  id="arrow-inherits-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
                </marker>
                <marker
                  id="arrow-imports"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" opacity="0.5" />
                </marker>
                <marker
                  id="arrow-imports-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
                </marker>
                <marker
                  id="arrow-calls"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#A855F7" opacity="0.6" />
                </marker>
                <marker
                  id="arrow-calls-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#A855F7" />
                </marker>
                <pattern id="graph-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(99, 102, 241, 0.08)" />
                </pattern>
              </defs>

              {/* Background Interactive Rect for Drag-Panning & Click-to-Deselect */}
              <rect width="100%" height="100%" fill="url(#graph-grid)" className="canvas-bg" />

              {/* Transformed Canvas Container (Pan + Zoom) */}
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                {/* 1. Module Island Boundaries (Subtle Architectural Hulls) */}
                {layoutMode === "network" && islandMeta.length > 0 && (
                  <g className="graph-islands">
                    {islandMeta.map((island, idx) => {
                      const isSelected = selectedPackage === island.name;
                      const pillWidth = Math.max(80, island.name.length * 8 + 28);

                      return (
                        <g key={`island-${idx}`} style={{ pointerEvents: "none" }}>
                          {/* Soft Island Boundary Ring */}
                          <circle
                            cx={island.x}
                            cy={island.y}
                            r={island.radius}
                            fill={isSelected ? "rgba(99, 102, 241, 0.07)" : "rgba(99, 102, 241, 0.02)"}
                            stroke={isSelected ? "var(--primary)" : "rgba(99, 102, 241, 0.16)"}
                            strokeWidth={isSelected ? 1.8 : 1}
                            strokeDasharray="6,6"
                          />
                          {/* Island Header Tag */}
                          <g transform={`translate(${island.x}, ${island.y - island.radius - 8})`}>
                            <rect
                              x={-(pillWidth / 2)}
                              y={-11}
                              width={pillWidth}
                              height={22}
                              rx={11}
                              fill="var(--bg-card)"
                              stroke={isSelected ? "var(--primary)" : "var(--border-color)"}
                              strokeWidth={isSelected ? 1.5 : 1}
                              opacity="0.95"
                            />
                            <text
                              y={1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? "var(--primary)" : "var(--text-secondary)"}
                              fontSize="10.5px"
                              fontWeight="700"
                              fontFamily="JetBrains Mono, Inter, sans-serif"
                            >
                              📦 {island.name} ({island.fileCount})
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 2. Connecting Links Layer */}
                <g className="graph-links">
                  {filteredLinks.map((link, idx) => {
                    const srcId = typeof link.source === "object" ? link.source.id : link.source;
                    const dstId = typeof link.target === "object" ? link.target.id : link.target;

                    const srcPos = nodePositions[srcId];
                    const dstPos = nodePositions[dstId];
                    if (!srcPos || !dstPos) return null;

                    const activeTarget = hoveredNode || selectedNode;
                    const targetId = activeTarget ? (activeTarget.id || activeTarget.name) : null;
                    const isDirectlyConnected = targetId && (srcId === targetId || dstId === targetId);

                    const styleMeta = getLinkStyle(link.type, isDirectlyConnected);

                    // Compute curved quadratic bezier
                    const dx = dstPos.x - srcPos.x;
                    const dy = dstPos.y - srcPos.y;
                    const midX = (srcPos.x + dstPos.x) / 2 - dy * 0.05;
                    const midY = (srcPos.y + dstPos.y) / 2 + dx * 0.05;

                    return (
                      <g key={`link-${idx}`}>
                        <path
                          d={`M ${srcPos.x} ${srcPos.y} Q ${midX} ${midY} ${dstPos.x} ${dstPos.y}`}
                          fill="none"
                          stroke={styleMeta.stroke}
                          strokeWidth={isDirectlyConnected ? 2.5 : 1.2}
                          strokeDasharray={styleMeta.dash}
                          opacity={isDirectlyConnected ? 1 : targetId ? 0.04 : 0.3}
                          markerEnd={styleMeta.marker}
                          style={{ transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s" }}
                        />
                        {/* Interactive Link Badge on Spotlight Highlight */}
                        {isDirectlyConnected && (
                          <g>
                            <rect
                              x={midX - 24}
                              y={midY - 9}
                              width={48}
                              height={18}
                              rx={4}
                              fill="var(--bg-card)"
                              stroke={styleMeta.stroke}
                              strokeWidth="1.2"
                            />
                            <text
                              x={midX}
                              y={midY + 3.5}
                              fill={styleMeta.stroke}
                              fontSize="9.5px"
                              fontWeight="700"
                              textAnchor="middle"
                              fontFamily="JetBrains Mono"
                            >
                              {styleMeta.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* 3. Connected Nodes Layer */}
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

                    // Smart Label Visibility: Always show repository, files in focused package, or when hovered/selected
                    const shouldShowLabel =
                      isRepo ||
                      isSelected ||
                      isHovered ||
                      isConnected ||
                      selectedPackage !== "all" ||
                      filteredNodes.length <= 45 ||
                      transform.scale >= 1.15 ||
                      (searchSymbol && (node.name || "").toLowerCase().includes(searchSymbol.toLowerCase()));

                    const truncatedName =
                      node.name && node.name.length > 22
                        ? node.name.slice(0, 20) + "…"
                        : node.name || "Symbol";

                    const labelWidth = Math.max(32, truncatedName.length * 7);

                    return (
                      <g
                        key={`node-${idx}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onMouseDown={(e) => handleNodeMouseDown(e, node)}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        style={{
                          cursor: "pointer",
                          opacity: isDimmed ? 0.08 : 1,
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
                            opacity="0.85"
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

                        {/* Node Base Circle */}
                        <circle
                          r={meta.radius}
                          fill="var(--bg-card)"
                          stroke={isSelected ? "var(--primary)" : isConnected ? meta.color : meta.border}
                          strokeWidth={isSelected ? 3 : 2}
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 14px ${meta.glow})` : "none",
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
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, height: "100%" }}>
                            <Icon size={isRepo ? 18 : 14} />
                          </div>
                        </foreignObject>

                        {/* Smart Label with Clean Backdrop Pill */}
                        {shouldShowLabel && (
                          <g style={{ pointerEvents: "none" }}>
                            <rect
                              x={-(labelWidth / 2 + 6)}
                              y={meta.radius + 4}
                              width={labelWidth + 12}
                              height={19}
                              rx={5}
                              fill="var(--bg-card)"
                              stroke={isSelected ? "var(--primary)" : "var(--border-color)"}
                              strokeWidth={isSelected ? 1.3 : 0.8}
                              opacity="0.95"
                            />
                            <text
                              y={meta.radius + 17}
                              textAnchor="middle"
                              fill={isSelected ? "var(--primary)" : "var(--text-main)"}
                              fontSize={isRepo ? "12px" : "10.5px"}
                              fontWeight={isRepo || isSelected ? "700" : "600"}
                              fontFamily="JetBrains Mono, Inter, sans-serif"
                            >
                              {truncatedName}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          )}

          {/* Floating Canvas Legend & Tips Bar */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "11px",
              color: "var(--text-muted)",
              boxShadow: "var(--shadow-sm)",
              pointerEvents: "none",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3B82F6" }} />
              <span>File</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }} />
              <span>Class</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#06B6D4" }} />
              <span>Function</span>
            </div>
            <span style={{ color: "var(--border-color)" }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "2px", backgroundColor: "#10B981" }} />
              <span>Defines</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "2px", backgroundColor: "#F59E0B" }} />
              <span>Inherits</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "2px", borderTop: "2px dashed #38BDF8" }} />
              <span>Imports</span>
            </div>
            <span style={{ color: "var(--border-color)" }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Move size={12} color="var(--primary)" />
              <span>Click node to spotlight • Drag node • Pan & scroll zoom</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Node Inspector & Call Graph */}
        {!isSectionMaximized && (
          <div
            className="card"
            style={{
              padding: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "100%",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {selectedNode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span className="badge badge-primary" style={{ fontSize: "11px" }}>
                      {selectedNode.type ? selectedNode.type.toUpperCase() : "SYMBOL"}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => centerOnNode(selectedNode)}
                        title="Center Canvas View on this Node"
                        style={{ fontSize: "11px", padding: "2px 7px", gap: "3px" }}
                      >
                        <Crosshair size={11} />
                        <span>Focus</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedNode(null)}
                        title="Deselect Node"
                        style={{ fontSize: "11px", padding: "2px 6px" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, wordBreak: "break-all", color: "var(--text-main)" }}>
                    {selectedNode.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", marginTop: "2px", wordBreak: "break-all" }}>
                    {selectedNode.file || selectedNode.path || "Root directory"}
                  </div>
                </div>

                {/* Subsystem & Module metadata */}
                <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Subsystem Island
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", fontFamily: "JetBrains Mono" }}>
                      📦 {getNodePackage(selectedNode)}
                    </span>
                    {selectedNode.type !== "repository" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedPackage(getNodePackage(selectedNode))}
                        style={{ fontSize: "10.5px", padding: "1px 6px", height: "24px" }}
                        title="Isolate this module on canvas"
                      >
                        Filter Island
                      </button>
                    )}
                  </div>
                </div>

                {/* Repository Specific Summary */}
                {selectedNode.type === "repository" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Repository Subsystems ({packages.length} Modules):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "320px", overflowY: "auto" }}>
                      {packages.map((pkg, i) => (
                        <div
                          key={i}
                          className="badge badge-neutral card-interactive"
                          onClick={() => setSelectedPackage(pkg.name)}
                          style={{
                            fontSize: "11px",
                            padding: "6px 9px",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>📦 {pkg.name}</span>
                          <span className="badge badge-primary" style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {pkg.count} files
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inbound Callers / References */}
                {selectedNode.type !== "repository" && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Inbound References / Callers:
                    </div>
                    {(() => {
                      const targetId = selectedNode.id || selectedNode.name;
                      const inbound = rawLinks.filter((l) => {
                        const dstId = typeof l.target === "object" ? l.target.id : l.target;
                        const srcId = typeof l.source === "object" ? l.source.id : l.source;
                        return dstId === targetId && !srcId.startsWith("repository:");
                      });

                      return inbound.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "200px", overflowY: "auto" }}>
                          {inbound.map((l, i) => {
                            const srcId = typeof l.source === "object" ? l.source.id : l.source;
                            const matchingNode = rawNodes.find((n) => (n.id || n.name) === srcId);
                            return (
                              <div
                                key={i}
                                className="badge badge-neutral card-interactive"
                                onClick={() => matchingNode && centerOnNode(matchingNode)}
                                style={{
                                  fontSize: "11px",
                                  padding: "5px 8px",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                                  • {matchingNode ? matchingNode.name : srcId}
                                </span>
                                <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
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
                )}

                {/* Outbound Dependencies */}
                {selectedNode.type !== "repository" && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Outbound Dependencies / Imports:
                    </div>
                    {(() => {
                      const srcId = selectedNode.id || selectedNode.name;
                      const outbound = rawLinks.filter((l) => {
                        const lSrcId = typeof l.source === "object" ? l.source.id : l.source;
                        return lSrcId === srcId;
                      });

                      return outbound.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "260px", overflowY: "auto" }}>
                          {outbound.map((l, i) => {
                            const dstId = typeof l.target === "object" ? l.target.id : l.target;
                            const matchingNode = rawNodes.find((n) => (n.id || n.name) === dstId);
                            return (
                              <div
                                key={i}
                                className="badge badge-neutral card-interactive"
                                onClick={() => matchingNode && centerOnNode(matchingNode)}
                                style={{
                                  fontSize: "11px",
                                  padding: "5px 8px",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                                  • {matchingNode ? matchingNode.name : dstId}
                                </span>
                                <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                                  {l.type || "calls"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No outbound dependencies mapped.</div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto 0", padding: "20px" }}>
                <Compass size={32} style={{ margin: "0 auto 8px", opacity: 0.5, color: "var(--primary)" }} />
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                  Architecture Explorer
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  Click on any file or class node in the graph to spotlight its dependency web, callers, and defined symbols.
                </div>
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", textAlign: "left" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Quick Tip
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Use the <strong>Module</strong> dropdown in the toolbar to isolate specific subsystems or explore the entire codebase cleanly across Module Islands.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
