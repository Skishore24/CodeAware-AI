import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bot,
  GitGraph,
  Wrench,
  FileCode,
  ShieldAlert,
  Sliders,
  CheckCircle,
  FolderGit2,
  Zap,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { repositories, setActiveRepo, activeRepo } = useRepo();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: "dashboard", name: "Overview Dashboard", icon: Zap, section: "Navigation", path: "/" },
    { id: "search", name: "Code Search", icon: Search, section: "Navigation", path: "/search" },
    { id: "review", name: "Code Review", icon: CheckCircle, section: "Navigation", path: "/review" },
    { id: "agent", name: "Agent Chat & Intelligence", icon: Bot, section: "Navigation", path: "/agent" },
    { id: "graph", name: "Knowledge Graph", icon: GitGraph, section: "Navigation", path: "/graph" },
    { id: "impact", name: "Impact & Blast Radius Analysis", icon: GitGraph, section: "Navigation", path: "/impact" },
    { id: "security", name: "Security & Vulnerability Scan", icon: ShieldAlert, section: "Navigation", path: "/security" },
    { id: "autonomous", name: "Autonomous Fix & Patching", icon: Wrench, section: "Navigation", path: "/autonomous" },
    { id: "tests", name: "Generate Unit Tests", icon: FileCode, section: "Navigation", path: "/tests" },
    { id: "repos", name: "Manage Repositories", icon: FolderGit2, section: "Navigation", path: "/repos" },
    { id: "settings", name: "System Settings", icon: Sliders, section: "Navigation", path: "/settings" },
  ];

  // Add repositories to searchable commands
  const repoCommands = repositories.map((r) => ({
    id: `repo-${r.name}`,
    name: `Switch Repo: ${r.name}`,
    icon: FolderGit2,
    section: "Repositories",
    action: () => {
      setActiveRepo(r);
      navigate("/");
    },
  }));

  const allItems = [...actions, ...repoCommands];
  const filtered = allItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  const handleSelect = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search">
          <Search size={18} color="#6B7280" />
          <input
            type="text"
            className="palette-input"
            placeholder="Type a command, search code, or switch repository..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="palette-badge">ESC</span>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`palette-item ${idx === selectedIndex ? "active" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </div>
                  <span className="palette-badge">{item.section}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
