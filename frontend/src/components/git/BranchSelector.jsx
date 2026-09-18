import { useState, useEffect, useRef } from "react";
import { GitBranch, Check, ChevronDown, Search, X, Loader2 } from "lucide-react";
import { getBranches, checkoutBranch } from "../../api/git";
import { useToast } from "../Toast";

export default function BranchSelector({ activeRepo, selectedBranch, onSelectBranch }) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(selectedBranch || "main");
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const fetchBranchesList = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const res = await getBranches(activeRepo.name, activeRepo.path);
      if (res?.success) {
        setBranches(res.branches || []);
        if (res.current_branch) {
          setCurrentBranch(res.current_branch);
          if (onSelectBranch && !selectedBranch) {
            onSelectBranch(res.current_branch);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchesList();
  }, [activeRepo?.name]);

  useEffect(() => {
    if (selectedBranch) {
      setCurrentBranch(selectedBranch);
    }
  }, [selectedBranch]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleBranchClick = async (branchName) => {
    if (branchName === currentBranch) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const res = await checkoutBranch(activeRepo.name, branchName);
      if (res?.success) {
        setCurrentBranch(branchName);
        if (onSelectBranch) {
          onSelectBranch(branchName);
        }
        addToast(`Switched to branch '${branchName}'`, "success");
        setIsOpen(false);
        fetchBranchesList();
      } else {
        addToast(res?.error || "Failed to switch branch", "error");
      }
    } catch (err) {
      addToast(err.message || "Branch checkout failed", "error");
    } finally {
      setSwitching(false);
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      {/* Trigger Button (GitHub style) */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && branches.length === 0) {
            fetchBranchesList();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-main)",
          fontSize: "12.5px",
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: "var(--radius-md)",
        }}
        title="Switch branches like on GitHub"
      >
        <GitBranch size={14} color="var(--primary)" />
        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{currentBranch}</span>
        <ChevronDown size={13} color="var(--text-muted)" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "300px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xl)",
            zIndex: 1100,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "var(--bg-subtle)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
              Switch branches
            </span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsOpen(false)}
              style={{ padding: "2px", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Search Box */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                color="var(--text-subtle)"
                style={{ position: "absolute", left: "9px", top: "9px" }}
              />
              <input
                type="text"
                className="input input-sm"
                placeholder="Find a branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ paddingLeft: "28px", fontSize: "12px" }}
              />
            </div>
          </div>

          {/* Branches List */}
          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            {loading || switching ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                <Loader2 size={16} className="spin" style={{ margin: "0 auto 6px" }} />
                <span>{switching ? "Switching branch..." : "Loading branches..."}</span>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No branches found matching "{search}"
              </div>
            ) : (
              filteredBranches.map((b) => {
                const isSelected = b.name === currentBranch;
                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleBranchClick(b.name)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <div style={{ width: "16px", display: "flex", justifyContent: "center" }}>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </div>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--primary-text)" : "var(--text-main)",
                          fontFamily: "JetBrains Mono, monospace",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {b.name}
                      </span>
                    </div>

                    {(b.name === "main" || b.name === "master") && (
                      <span
                        className="badge"
                        style={{
                          fontSize: "10px",
                          padding: "1px 5px",
                          backgroundColor: "var(--bg-muted)",
                          color: "var(--text-muted)",
                        }}
                      >
                        default
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
