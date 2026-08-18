import { useState, useEffect } from "react";
import { Search, HelpCircle, FileCode, Hash, Clock, X, FolderGit2, CheckCircle2 } from "lucide-react";
import client from "../api/client";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";

const MAX_HISTORY = 6;

export default function CodeSearch() {
  const { activeRepo, setActiveRepo, repositories } = useRepo();
  const toast = useToast();

  const [repositoryPath, setRepositoryPath] = useState(() => activeRepo?.path || "");
  const [query, setQuery]  = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ca_search_history") || "[]"); }
    catch { return []; }
  });

  // Auto-fill repo path from context whenever activeRepo changes
  useEffect(() => {
    if (activeRepo?.path) {
      setRepositoryPath(activeRepo.path);
    }
  }, [activeRepo]);

  const saveToHistory = (q) => {
    const next = [q, ...history.filter((h) => h !== q)].slice(0, MAX_HISTORY);
    setHistory(next);
    try { localStorage.setItem("ca_search_history", JSON.stringify(next)); } catch {}
  };

  const clearError = () => setError("");

  const searchCode = async () => {
    if (!repositoryPath.trim()) { setError("Enter or select a repository path."); return; }
    if (!query.trim())          { setError("Enter a search query."); return; }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const data = await client.post("/code-search/search", {
        repository_path: repositoryPath,
        query,
        top_k: 10,
      });

      if (!data.success) throw new Error(data.error || "Search failed.");

      setResults(data.results || []);
      saveToHistory(query);
      toast("success", "Search complete", `${(data.results || []).length} results`);
    } catch (err) {
      setError(err.message || "Unable to search code.");
      toast("error", "Search failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") searchCode(); };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Code Intelligence</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={26} color="var(--color-accent)" /> Code Search
        </h1>
        <p className="page-subtitle">
          Ask questions about your repository in natural language — powered by hybrid TF-IDF retrieval.
        </p>
      </div>

      {/* Search card */}
      <section className="search-card">
        {/* Available Repositories Quick Picker */}
        {repositories.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-text-muted)", marginBottom: 8 }}>
              Select Cloned Repository
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {repositories.map((rep) => {
                const isSelected = repositoryPath === rep.path || activeRepo?.path === rep.path;
                return (
                  <button
                    key={rep.path}
                    type="button"
                    onClick={() => {
                      setRepositoryPath(rep.path);
                      setActiveRepo(rep);
                      clearError();
                    }}
                    style={{
                      background: isSelected ? "var(--color-accent-soft)" : "var(--color-surface)",
                      border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 12px",
                      fontSize: 12,
                      color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "JetBrains Mono, monospace",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <FolderGit2 size={13} />
                    <strong>{rep.name}</strong>
                    {isSelected && <CheckCircle2 size={12} color="var(--color-accent)" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Repo path */}
        <div className="form-group">
          <label>Repository Path</label>
          <input
            className="search-input"
            value={repositoryPath}
            onChange={(e) => { setRepositoryPath(e.target.value); clearError(); }}
            placeholder="C:\...\repository   or   repo-name"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          />
        </div>

        {/* Query */}
        <div className="search-row">
          <input
            className="search-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); clearError(); }}
            onKeyDown={handleKey}
            placeholder='Where is authentication implemented?'
            disabled={loading}
          />
          <button
            onClick={searchCode}
            disabled={loading}
            className="search-button"
          >
            {loading ? <><span className="spinner spinner-sm" /> Searching…</> : <><Search size={15} /> Search</>}
          </button>
        </div>

        {/* Search history */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 12, marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={11} /> Recent searches
            </div>
            <div className="search-history">
              {history.map((h) => (
                <button key={h} className="search-history-chip" onClick={() => setQuery(h)}>
                  {h}
                </button>
              ))}
              <button
                className="search-history-chip"
                style={{ color: "var(--color-red)" }}
                onClick={() => { setHistory([]); localStorage.removeItem("ca_search_history"); }}
              >
                <X size={10} style={{ marginRight: 3 }} /> Clear
              </button>
            </div>
          </div>
        )}

        {error && <div className="search-error"><Hash size={13} style={{ flexShrink: 0 }} /> {error}</div>}
      </section>

      {/* Results section */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <FileCode size={17} color="var(--color-accent)" />
            Relevant Code
          </div>
          {results.length > 0 && (
            <span className="badge badge-info">{results.length} results</span>
          )}
        </div>

        {loading && (
          <div className="empty-state">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span className="spinner spinner-lg" />
            </div>
            <div className="empty-state-text">Searching your codebase…</div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HelpCircle size={36} color="var(--color-accent)" style={{ opacity: 0.4 }} />
            </div>
            <div className="empty-state-title">Ask your repository</div>
            <div className="empty-state-text">
              Try: "Where is authentication implemented?" or "Find all database queries"
            </div>
          </div>
        )}

        <div className="result-list">
          {results.map((result, index) => (
            <article className="code-result" key={index}>
              <div className="code-result-header">
                <div>
                  <span className="result-label">File</span>
                  <h3>{result.file}</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(result.start_line || result.end_line) && (
                    <span className="badge badge-info" style={{ fontSize: 10 }}>
                      L{result.start_line || "?"}–{result.end_line || "?"}
                    </span>
                  )}
                  <span className="score">
                    {Number(result.score || 0).toFixed(3)}
                  </span>
                </div>
              </div>
              <pre>{result.content}</pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}