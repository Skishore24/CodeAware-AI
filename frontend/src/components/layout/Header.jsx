import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Moon,
  Sun,
  FolderGit2,
  ChevronRight,
  ChevronDown,
  LogOut,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import { useRepo } from "../../context/RepoContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";

export default function Header({ onOpenPalette }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageMeta = (pathname) => {
    switch (pathname) {
      case "/":
        return { title: "Overview", group: "Product" };
      case "/repos":
        return { title: "Repositories", group: "Product" };
      case "/search":
        return { title: "Code Search", group: "Product" };
      case "/review":
        return { title: "Code Review", group: "Product" };
      case "/security":
        return { title: "Security Analysis", group: "Product" };
      case "/agent":
        return { title: "AI Assistant", group: "Intelligence" };
      case "/graph":
        return { title: "Knowledge Graph", group: "Intelligence" };
      case "/impact":
        return { title: "Impact Analysis", group: "Intelligence" };
      case "/autonomous":
        return { title: "Autonomous Fix", group: "Automation" };
      case "/tests":
        return { title: "Test Generator", group: "Automation" };
      case "/settings":
        return { title: "Settings & Users", group: "System" };
      default:
        return { title: "CodeAware AI", group: "Platform" };
    }
  };

  const currentMeta = getPageMeta(location.pathname);

  const handleLogout = () => {
    logout();
    addToast("Logged out successfully.", "info");
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="top-header">
      {/* Left: Breadcrumbs / Title */}
      <div className="header-left">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text-muted)" }}>
          <span>{currentMeta.group}</span>
          <ChevronRight size={13} />
          <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "13.5px" }}>
            {currentMeta.title}
          </span>
        </div>
      </div>

      {/* Center: Global Quick Search Button */}
      <div className="header-center">
        <button
          className="header-search-btn"
          onClick={onOpenPalette}
          title="Open Command Palette (Ctrl+K)"
        >
          <div className="header-search-left">
            <Search size={14} />
            <span>Search code, switch repos, or run commands...</span>
          </div>
          <span className="header-kbd">⌘K</span>
        </button>
      </div>

      {/* Right: Active Repo Badge, Theme Switcher & User Profile */}
      <div className="header-right">
        {/* Active Repository Chip */}
        <div
          className="header-repo-chip"
          onClick={() => navigate("/repos")}
          title="Click to manage or switch active repository"
        >
          <FolderGit2 size={13} />
          <span>{activeRepo ? activeRepo.name : "Select Repo"}</span>
          {activeRepo && (
            <span style={{ opacity: 0.7, fontSize: "11px" }}>
              • {activeRepo.files_count ? `${activeRepo.files_count} files` : "Indexed"}
            </span>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User Profile & Management Dropdown */}
        {isAuthenticated && user ? (
          <div style={{ position: "relative" }} ref={menuRef}>
            <div
              className="card card-interactive"
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px 4px 4px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-main)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
              <ChevronDown size={13} color="var(--text-subtle)" />
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: "220px",
                  padding: "8px",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 100,
                  animation: "fadeIn 0.15s ease-out",
                }}
              >
                <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>{user.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: "10px", marginTop: "4px", padding: "1px 6px" }}>
                    {user.role}
                  </span>
                </div>

                <div
                  className="palette-item"
                  onClick={() => {
                    navigate("/settings");
                    setMenuOpen(false);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={14} />
                    <span>User Management</span>
                  </div>
                </div>

                <div
                  className="palette-item"
                  onClick={() => {
                    navigate("/settings");
                    setMenuOpen(false);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <SettingsIcon size={14} />
                    <span>Workspace Settings</span>
                  </div>
                </div>

                <div
                  className="palette-item"
                  onClick={handleLogout}
                  style={{ color: "var(--error)", marginTop: "4px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/login")}>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
