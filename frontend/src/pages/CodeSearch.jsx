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
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { searchCode } from "../api/rag";
import { useToast } from "../components/Toast";

export default function CodeSearch() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  // Filters
  const [languageFilter, setLanguageFilter] = useState("");
  const [filePathFilter, setFilePathFilter] = useState("");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (!activeRepo) {
      addToast("Please select a repository first.", "warning");
      return;
    }

    setSearching(true);
    try {
      const filters = {};
      if (languageFilter) filters.language = languageFilter;
      if (filePathFilter) filters.file_path = filePathFilter;

      const data = await searchCode(activeRepo.name, query.trim(), filters);
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

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <h1 className="page-title">Code Search</h1>
          <p className="page-subtitle">
            Natural language and symbol-based code discovery with AST-aware relevance.
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="card" style={{ padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-4)" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Where is authentication implemented? / Find all SQL queries / authenticate_user"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: "34px", fontSize: "14px" }}
            />
            <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "10px", top: "11px" }} />
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
            placeholder="File path filter"
            value={filePathFilter}
            onChange={(e) => setFilePathFilter(e.target.value)}
            style={{ width: "160px" }}
          />

          <button type="submit" className="btn btn-primary" disabled={searching || !query.trim()}>
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Split Results Workspace */}
      <div style={{ flex: 1, display: "flex", gap: "var(--space-4)", minHeight: 0 }}>
        {/* Left Results List */}
        <div className="card" style={{ width: "420px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-subtle)", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>MATCHED CHUNKS ({results.length})</span>
            <span>RELEVANCE</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {results.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13.5px" }}>
                {searching ? "Searching codebase..." : "Enter a search query above to locate functions, classes, and logic."}
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
                      marginBottom: "4px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                      border: isSelected ? "1px solid var(--primary-border)" : "1px solid transparent",
                      transition: "var(--transition)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: isSelected ? "var(--primary)" : "var(--text-main)" }}>
                        {item.symbol || item.file.split("/").pop()}
                      </span>
                      <span className="badge badge-primary" style={{ fontSize: "10.5px" }}>
                        Score: {item.score}
                      </span>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.file}:{item.start_line}-{item.end_line}
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", background: isSelected ? "rgba(255,255,255,0.7)" : "var(--bg-subtle)", padding: "4px 6px", borderRadius: "4px" }}>
                      {item.why_matched}
                    </div>
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
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                    {selectedResult.file}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Lines {selectedResult.start_line}–{selectedResult.end_line} {selectedResult.symbol ? `• Symbol: ${selectedResult.symbol}` : ""}
                  </div>
                </div>
                <span className="badge badge-neutral">{selectedResult.language || "code"}</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#FFFFFF" }}>
                <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", lineHeight: "1.6", color: "#1F2937" }}>
                  <code>{selectedResult.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "10px" }}>
              <Code2 size={40} color="#D1D5DB" />
              <span>Select a search match on the left to preview source code and citations.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}