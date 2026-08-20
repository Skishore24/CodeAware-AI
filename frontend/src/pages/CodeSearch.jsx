import { useState } from "react";
import {
  Search,
  FileCode,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Code2,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Filter,
  Terminal,
  Layers,
  GitFork,
  Bot,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { searchCode } from "../api/rag";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function CodeSearch() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filters
  const [languageFilter, setLanguageFilter] = useState("");
  const [filePathFilter, setFilePathFilter] = useState("");

  const quickSearchPresets = [
    "Where is authentication or login handled?",
    "Find all database query operations",
    "List API route endpoints and handlers",
    "Find exception handling and error blocks",
  ];

  const handleSearch = async (targetQuery) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    if (!activeRepo) {
      addToast("Please select a repository first.", "warning");
      return;
    }

    setSearching(true);
    try {
      const filters = {};
      if (languageFilter) filters.language = languageFilter;
      if (filePathFilter) filters.file_path = filePathFilter;

      const data = await searchCode(activeRepo.name, q, filters);
      const items = data?.results || [];
      setResults(items);
      setSelectedResult(items[0] || null);

      if (items.length === 0) {
        addToast("No matching code locations found.", "info");
      }
    } catch (err) {
      addToast(err.message || "Search failed.", "error");
    } finally {
      setSearching(false);
    }
  };

  const copySnippet = () => {
    if (!selectedResult?.content) return;
    navigator.clipboard.writeText(selectedResult.content);
    setCopied(true);
    addToast("Code snippet copied to clipboard", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <h1 className="page-title">Code Search & Discovery</h1>
          <p className="page-subtitle">
            Natural language and symbol-based hybrid search with AST-aware relevance scoring.
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="card" style={{ padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-3)" }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Where is token verification implemented? / Find all SQL queries / authenticate_user"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: "34px", fontSize: "14px" }}
            />
            <Search size={16} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "11px" }} />
          </div>

          <input
            type="text"
            className="input"
            placeholder="Language (py, js, ts)"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            style={{ width: "160px" }}
          />

          <input
            type="text"
            className="input"
            placeholder="Path filter (e.g. api/)"
            value={filePathFilter}
            onChange={(e) => setFilePathFilter(e.target.value)}
            style={{ width: "160px" }}
          />

          <button type="submit" className="btn btn-primary" disabled={searching || !query.trim()}>
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>Search</span>
          </button>
        </form>

        {/* Quick query chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Suggestions:
          </span>
          {quickSearchPresets.map((preset, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              style={{ padding: "2px 8px", fontSize: "11px", borderRadius: "var(--radius-full)" }}
              onClick={() => {
                setQuery(preset);
                handleSearch(preset);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Split Results Workspace */}
      <div style={{ flex: 1, display: "flex", gap: "var(--space-4)", minHeight: 0 }}>
        {/* Left Results List */}
        <div className="card" style={{ width: "440px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-subtle)", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>MATCHED CODE CHUNKS ({results.length})</span>
            <span>RELEVANCE SCORE</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {results.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13.5px" }}>
                <Search size={32} color="var(--text-subtle)" style={{ margin: "0 auto 8px" }} />
                <div>{searching ? "Scanning codebase & computing hybrid scores..." : "Enter a search query or click a suggestion above."}</div>
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = selectedResult === item;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedResult(item)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "6px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                      border: isSelected ? "1px solid var(--primary-border)" : "1px solid var(--border-color)",
                      boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                      transition: "var(--transition)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileCode size={14} color={isSelected ? "var(--primary)" : "var(--text-muted)"} />
                        <span style={{ fontWeight: 700, fontSize: "13px", color: isSelected ? "var(--primary)" : "var(--text-main)" }}>
                          {item.symbol || item.file.split("/").pop()}
                        </span>
                      </div>
                      <span className={`badge ${isSelected ? "badge-primary" : "badge-neutral"}`} style={{ fontSize: "10.5px" }}>
                        {item.score}
                      </span>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "monospace" }}>
                      {item.file}:{item.start_line}-{item.end_line}
                    </div>

                    {item.why_matched && (
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", background: isSelected ? "rgba(255,255,255,0.7)" : "var(--bg-subtle)", padding: "3px 6px", borderRadius: "4px", marginTop: "2px" }}>
                        {item.why_matched}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Preview Pane */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          {selectedResult ? (
            <>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileCode size={16} color="var(--primary)" />
                    <span>{selectedResult.file}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Lines {selectedResult.start_line}–{selectedResult.end_line} {selectedResult.symbol ? `• Symbol: ${selectedResult.symbol}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="badge badge-primary">{selectedResult.language || "code"}</span>
                  <button className="btn btn-secondary btn-sm" onClick={copySnippet} title="Copy code">
                    {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/impact`)}
                    title="Analyze impact of this file"
                  >
                    <GitFork size={13} />
                    <span>Blast Radius</span>
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#FFFFFF" }}>
                <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: "1.6", color: "#1F2937" }}>
                  <code>{selectedResult.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "10px" }}>
              <Code2 size={44} color="var(--border-hover)" />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Select a search match on the left to preview source code and citations.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}