import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { healthCheck } from "../api/repositories";

const NAV_ITEMS = [
  { to: "/",          icon: "⚡", label: "Dashboard"    },
  { to: "/repos",     icon: "📦", label: "Repositories" },
  { to: "/search",    icon: "🔍", label: "Code Search"  },
  { to: "/agent",     icon: "🤖", label: "Agent Chat"   },
  { to: "/graph",     icon: "🕸️", label: "Code Graph"  },
];

export default function Sidebar() {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    healthCheck()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">🧠</div>
          <div>
            <div className="sidebar-brand-name">CodeAware</div>
            <div className="sidebar-brand-version">v0.1.0 · AI</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span
            className="status-dot"
            style={{
              background: healthy === null
                ? "var(--color-yellow)"
                : healthy
                  ? "var(--color-green)"
                  : "var(--color-red)",
              boxShadow: `0 0 6px ${healthy === null
                ? "var(--color-yellow)"
                : healthy
                  ? "var(--color-green)"
                  : "var(--color-red)"}`,
            }}
          />
          {healthy === null
            ? "Checking backend…"
            : healthy
              ? "Backend online"
              : "Backend offline"}
        </div>
      </div>
    </aside>
  );
}
