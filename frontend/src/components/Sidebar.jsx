import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderGit2,
  Search,
  CheckCircle2,
  ShieldAlert,
  Bot,
  GitGraph,
  GitFork,
  Wrench,
  FileCode,
  Sliders,
  ChevronDown,
  Layers,
  Plus,
  Check,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

export default function Sidebar({ onOpenPalette }) {
  const navigate = useNavigate();
  const { activeRepo, repositories, setActiveRepo } = useRepo();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRepo = (repo) => {
    setActiveRepo(repo);
    setDropdownOpen(false);
    addToast(`Switched active repository to ${repo.name}`, "info");
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">
            <Layers size={16} />
          </div>
          <div>
            <span>CodeAware</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", marginLeft: "4px" }}>
              AI
            </span>
          </div>
        </div>

        {/* Repository Switcher Card & Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            className="repo-selector-card"
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Click to switch or select repository"
          >
            <div style={{ minWidth: 0 }}>
              <div className="repo-selector-title">Active Repository</div>
              <div className="repo-selector-name">
                <FolderGit2 size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{activeRepo ? activeRepo.name : "Select Repository"}</span>
              </div>
              <div className="repo-selector-meta">
                {activeRepo ? (
                  <>
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>● Indexed</span>
                    {activeRepo.files_count ? ` • ${activeRepo.files_count} files` : ""}
                  </>
                ) : (
                  <span style={{ color: "var(--warning)", fontWeight: 600 }}>Click to select repo</span>
                )}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
          </div>

          {/* Quick Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="card"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                padding: "8px",
                boxShadow: "var(--shadow-xl)",
                zIndex: 100,
                maxHeight: "280px",
                overflowY: "auto",
                animation: "fadeIn 0.15s ease-out",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "4px 8px 6px" }}>
                Switch Workspace Repository
              </div>

              {repositories && repositories.length > 0 ? (
                repositories.map((r) => {
                  const isSelected = activeRepo?.name === r.name || activeRepo?.path === r.path;
                  return (
                    <div
                      key={r.name}
                      className={`palette-item ${isSelected ? "active" : ""}`}
                      onClick={() => handleSelectRepo(r)}
                      style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <FolderGit2 size={14} color={isSelected ? "var(--primary)" : "var(--text-muted)"} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                            {r.files_count ? `${r.files_count} files` : "Indexed"}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="var(--primary)" />}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "12px 8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                  No repositories cloned yet.
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "6px", paddingTop: "6px" }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/repos");
                  }}
                >
                  <Plus size={13} />
                  <span>Connect New Repository</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav">
        {/* PRODUCT */}
        <div className="nav-section-label">Product</div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end>
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/repos" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <FolderGit2 size={16} />
          <span>Repositories</span>
          {repositories?.length > 0 && (
            <span className="nav-item-badge">{repositories.length}</span>
          )}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Search size={16} />
          <span>Code Search</span>
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <CheckCircle2 size={16} />
          <span>Code Review</span>
        </NavLink>
        <NavLink to="/security" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <ShieldAlert size={16} />
          <span>Security</span>
        </NavLink>

        {/* INTELLIGENCE */}
        <div className="nav-section-label">Intelligence</div>
        <NavLink to="/agent" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Bot size={16} />
          <span>AI Assistant</span>
        </NavLink>
        <NavLink to="/graph" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <GitGraph size={16} />
          <span>Knowledge Graph</span>
        </NavLink>
        <NavLink to="/impact" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <GitFork size={16} />
          <span>Impact Analysis</span>
        </NavLink>

        {/* AUTOMATION */}
        <div className="nav-section-label">Automation</div>
        <NavLink to="/autonomous" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Wrench size={16} />
          <span>Autonomous Fix</span>
        </NavLink>
        <NavLink to="/tests" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <FileCode size={16} />
          <span>Test Generator</span>
        </NavLink>

        {/* SYSTEM */}
        <div className="nav-section-label">System</div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Sliders size={16} />
          <span>Settings & Users</span>
        </NavLink>
      </div>

      {/* Sidebar Footer: User Info & Command Palette CTA */}
      <div className="sidebar-footer">
        <div
          onClick={() => navigate("/settings")}
          style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", minWidth: 0 }}
          title="Manage user account and team"
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user ? user.name.charAt(0) : "U"}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user ? user.name : "Guest"}
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
          style={{ padding: "3px 7px", fontSize: "11px", color: "var(--text-muted)" }}
        >
          ⌘K
        </button>
      </div>
    </aside>
  );
}
