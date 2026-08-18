import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { healthCheck } from "../api/repositories";
import { useRepo } from "../context/RepoContext";
import {
  LayoutDashboard,
  FolderGit2,
  Search,
  Bot,
  Wrench,
  Network,
  Brain,
  Settings,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/",           icon: LayoutDashboard, label: "Dashboard"      },
  { to: "/repos",      icon: FolderGit2,      label: "Repositories"  },
  { to: "/search",     icon: Search,          label: "Code Search"   },
  { to: "/agent",      icon: Bot,             label: "Agent Chat"    },
  { to: "/autonomous", icon: Wrench,          label: "Auto Fix"      },
  { to: "/graph",      icon: Network,         label: "Code Graph"    },
];

export default function Sidebar() {
  const [healthy, setHealthy] = useState(null);
  const { activeRepo, clearRepo } = useRepo();

  useEffect(() => {
    healthCheck()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
  }, []);

  const statusColor =
    healthy === null
      ? "var(--color-yellow)"
      : healthy
      ? "var(--color-green)"
      : "var(--color-red)";

  const statusLabel =
    healthy === null
      ? "Checking…"
      : healthy
      ? "Backend online"
      : "Backend offline";

  // Short display name from path or name
  const repoDisplayName = activeRepo
    ? activeRepo.name ||
      activeRepo.path?.split(/[\\/]/).pop() ||
      "Active Repo"
    : null;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">
            <Brain size={20} color="#c4b5fd" />
          </div>
          <div>
            <div className="sidebar-brand-name">CodeAware</div>
            <div className="sidebar-brand-version">v1.0 · AI</div>
          </div>
        </div>

        {/* Active repo badge */}
        {repoDisplayName && (
          <div className="sidebar-repo-badge" title={activeRepo?.path}>
            <div className="sidebar-repo-badge-label">Active Repo</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {repoDisplayName}
              </span>
              <button
                onClick={clearRepo}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }}
                title="Clear active repo"
              >
                <X size={11} color="var(--color-text-muted)" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="nav-icon">
                <Icon size={17} />
              </span>
              {item.label}
            </NavLink>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>System</div>
        <NavLink
          to="/settings"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="nav-icon">
            <Settings size={17} />
          </span>
          Settings
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span
            className="status-dot"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          {statusLabel}
        </div>
      </div>
    </aside>
  );
}
