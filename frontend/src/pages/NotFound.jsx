import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  FolderGit2,
  AlertTriangle,
  Terminal,
  Bot,
  Compass,
  Layers,
} from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      {/* Top Floating Brand Bar */}
      <header className="not-found-topbar">
        <div
          className="brand-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-icon">
            <Layers size={18} />
          </div>
          <span>CodeAware AI</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate("/")}
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>
      </header>

      {/* Background Animated Particle Grid */}
      <div className="not-found-grid-bg" />
      <div className="not-found-glow glow-1" />
      <div className="not-found-glow glow-2" />

      {/* Flank Floating Badges (Anchored to Outer Viewport Edges) */}
      <div className="not-found-floating-tags">
        <div className="floating-tag tag-top-left">
          <Terminal size={13} color="var(--primary)" />
          <span>AST.resolveRoute(null) → 404</span>
        </div>
        <div className="floating-tag tag-top-right">
          <AlertTriangle size={13} color="var(--warning)" />
          <span>UNRESOLVED_AST_NODE</span>
        </div>
        <div className="floating-tag tag-mid-left">
          <Bot size={13} color="var(--purple)" />
          <span>Multi-Agent advice: return home</span>
        </div>
        <div className="floating-tag tag-mid-right">
          <Compass size={13} color="var(--info)" />
          <span>blastRadius: 0 files affected</span>
        </div>
      </div>

      {/* Center Main 404 Card */}
      <div className="not-found-card">
        {/* Animated 404 Radar & Number */}
        <div className="not-found-hero">
          <div className="not-found-radar-sweep" />
          <h1 className="not-found-404-text">404</h1>
        </div>

        {/* Status Badge */}
        <div className="not-found-badge">
          <span className="not-found-badge-dot" />
          <span>Route Symbol Not Found in AST Graph</span>
        </div>

        {/* Heading & Subtitle */}
        <h2 className="not-found-title">You've reached an uncharted node</h2>
        <p className="not-found-desc">
          The requested route does not match any known endpoints, files, or agent controllers in this workspace graph.
        </p>

        {/* Code Snippet Box */}
        <div className="not-found-terminal-box">
          <div className="not-found-terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <span className="terminal-file">router_trace.ts</span>
          </div>
          <pre className="not-found-code">
            <code>
              <span className="code-kw">async function</span> <span className="code-fn">navigateRoute</span>(path: <span className="code-type">string</span>) &#123;{"\n"}
              {"  "}const node = <span className="code-kw">await</span> KnowledgeGraph.<span className="code-fn">lookup</span>(path);{"\n"}
              {"  "}<span className="code-kw">if</span> (!node) <span className="code-kw">throw new</span> <span className="code-type">RouteNotFoundError</span>(<span className="code-str">"{window.location.pathname}"</span>);{"\n"}
              &#125;
            </code>
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="not-found-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/")}
          >
            <LayoutDashboard size={16} />
            <span>Back to Dashboard</span>
          </button>

          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("/search")}
          >
            <Search size={16} />
            <span>Search Codebase</span>
          </button>

          <button
            className="btn btn-ghost btn-lg"
            onClick={() => navigate("/repos")}
          >
            <FolderGit2 size={16} />
            <span>Repositories</span>
          </button>
        </div>

        {/* Back Link */}
        <button
          className="not-found-back-link"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={13} />
          <span>Go back to previous page</span>
        </button>
      </div>
    </div>
  );
}
