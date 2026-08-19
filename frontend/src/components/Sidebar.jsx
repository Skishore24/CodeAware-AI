import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderGit2,
  Search,
  CheckCircle2,
  Bot,
  GitGraph,
  GitFork,
  Wrench,
  FileCode,
  Sliders,
  ChevronDown,
  Layers,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";

export default function Sidebar({ onOpenPalette }) {
  const navigate = useNavigate();
  const { activeRepo, backendStatus } = useRepo();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <div className="brand-icon">
            <Layers size={16} />
          </div>
          <span>CodeAware</span>
        </div>

        {/* Compact Repository Selector */}
        <div
          className="repo-selector"
          onClick={() => navigate("/repos")}
          title="Click to switch or clone repository"
        >
          <div className="repo-selector-info">
            <span className="repo-selector-name">
              {activeRepo ? activeRepo.name : "Select Repository"}
            </span>
            <span className="repo-selector-meta">
              {activeRepo ? (activeRepo.files_count ? `${activeRepo.files_count} files` : "Indexed") : "No repository active"}
            </span>
          </div>
          <ChevronDown size={14} color="#9CA3AF" />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav">
        {/* Workspace */}
        <div className="nav-section-label">Workspace</div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end>
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/repos" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <FolderGit2 size={16} />
          <span>Repositories</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Search size={16} />
          <span>Code Search</span>
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <CheckCircle2 size={16} />
          <span>Code Review</span>
        </NavLink>

        {/* Intelligence */}
        <div className="nav-section-label">Intelligence</div>
        <NavLink to="/agent" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Bot size={16} />
          <span>Agent Chat</span>
        </NavLink>
        <NavLink to="/graph" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <GitGraph size={16} />
          <span>Knowledge Graph</span>
        </NavLink>
        <NavLink to="/impact" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <GitFork size={16} />
          <span>Impact Analysis</span>
        </NavLink>

        {/* Automation */}
        <div className="nav-section-label">Automation</div>
        <NavLink to="/autonomous" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Wrench size={16} />
          <span>Autonomous Fix</span>
        </NavLink>
        <NavLink to="/tests" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <FileCode size={16} />
          <span>Test Generator</span>
        </NavLink>

        {/* System */}
        <div className="nav-section-label">System</div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Sliders size={16} />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* Footer Status */}
      <div className="sidebar-footer">
        <div className="status-badge">
          <span className={`status-dot ${backendStatus}`}></span>
          <span style={{ fontSize: "12px", color: "#4B5563" }}>
            Backend {backendStatus === "healthy" ? "Connected" : backendStatus === "degraded" ? "Degraded" : "Offline"}
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
          style={{ padding: "3px 7px", fontSize: "11px", color: "#6B7280" }}
        >
          ⌘K
        </button>
      </div>
    </aside>
  );
}
