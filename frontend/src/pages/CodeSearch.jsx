import { useState, useEffect } from "react";
import {
  Search,
  FileCode,
  Code2,
  Loader2,
  FileText,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { searchCode } from "../api/rag";
import { useToast } from "../components/Toast";
import { useSearchParams } from "react-router-dom";
import SourceViewer from "../components/SourceViewer";
import EmptyState from "../components/feedback/EmptyState";
import { SearchResultSkeleton } from "../components/feedback/Skeleton";

export default function CodeSearch() {
  const [searchParams] = useSearchParams();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);


  const searchPresets = [
    "Where is authentication implemented?",
    "Find database queries and models",
    "Show API endpoints and route handlers",
    "Where is error handling and exception logging?",
    "Find configuration loading and environment variables",
  ];

  const handleSearch = async (targetQuery) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    if (!activeRepo) {
      addToast("Please connect or select a repository first.", "warning");
      return;
    }

    setSearching(true);
    try {
      const data = await searchCode(activeRepo.name, q, {});
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

  useEffect(() => {
    const initialQ = searchParams.get("q");
    if (initialQ && activeRepo) {
      setQuery(initialQ);
      handleSearch(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRepo, searchParams]);

  // Normalize result fields: backend returns { file, symbol, start_line, end_line, score, content }
  const getResultFile = (item) => item.file || item.file_path || "";
  const getResultSymbol = (item) => item.symbol || item.symbol_name || item.name || "";
  const getResultType = (item) => item.symbol_type || item.type || "code";
  const getResultSnippet = (item) => item.content || item.snippet || item.raw_code || "";
  const getResultLine = (item) => item.start_line || item.line_number || item.line || null;

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Search}
          title="No Repository Active for Search"
          description="Connect or select a repository to search across functions, AST symbols, API endpoints, and source code using natural language."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-2)" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "20px", fontWeight: 800 }}>
            Natural Language Code Search
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Searching codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> with AST symbol ranking and semantic citations.
          </p>
        </div>
      </div>

      {/* Large Search Box */}
      <div className="card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-3)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Ask anything about your codebase (e.g. Where is authentication handled?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: "36px", paddingRight: "12px", fontSize: "14px", height: "42px" }}
            />
            <Search
              size={16}
              color="var(--text-subtle)"
              style={{ position: "absolute", left: "12px", top: "13px" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={searching || !query.trim()}
          >
            {searching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
            Try asking:
          </span>
          {searchPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQuery(preset);
                handleSearch(preset);
              }}
              style={{
                fontSize: "11.5px",
                padding: "3px 8px",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results & Source Viewer Split */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "var(--space-4)" }}>
        {/* Left Column: Results List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "10px 14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>
              Search Results {results.length > 0 && `(${results.length})`}
            </div>
            {results.length > 0 && (
              <span className="badge badge-primary" style={{ fontSize: "11px" }}>
                Ranked by AST Relevance
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {searching ? (
              <SearchResultSkeleton />
            ) : results.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <FileCode size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
                  No search query entered
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  Type a natural language question or pick a suggested prompt above.
                </div>
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = selectedResult === item;
                const filePath = getResultFile(item);
                const symbolName = getResultSymbol(item);
                const symbolType = getResultType(item);
                const snippet = getResultSnippet(item);
                const lineNum = getResultLine(item);

                return (
                  <div
                    key={idx}
                    className="card card-interactive"
                    onClick={() => setSelectedResult(item)}
                    style={{
                      padding: "10px 12px",
                      borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Code2 size={14} color="var(--primary)" />
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
                          {symbolName || (filePath ? filePath.split("/").pop() : "Symbol")}
                        </span>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>
                        {symbolType}
                      </span>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontFamily: "JetBrains Mono", wordBreak: "break-all" }}>
                      {filePath}{lineNum ? `:${lineNum}` : ""}
                    </div>

                    {snippet && (
                      <div
                        style={{
                          marginTop: "6px",
                          padding: "6px 8px",
                          backgroundColor: "var(--bg-code)",
                          color: "#E2E8F0",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "11px",
                          fontFamily: "JetBrains Mono",
                          maxHeight: "60px",
                          overflow: "hidden",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {snippet.slice(0, 200)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Source Code Inspector */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedResult ? (
            <SourceViewer
              repositoryName={activeRepo.name}
              filePath={getResultFile(selectedResult)}
              startLine={getResultLine(selectedResult) || 1}
              highlightLines={
                getResultLine(selectedResult)
                  ? [getResultLine(selectedResult), (selectedResult.end_line || getResultLine(selectedResult)) + 5]
                  : []
              }
            />
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
              <FileText size={32} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: "13px" }}>Select a search result on the left to inspect its code</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}