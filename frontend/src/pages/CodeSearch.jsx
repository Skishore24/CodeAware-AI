import { useState } from "react";
import { searchRAG } from "../api/rag";
import { useToast } from "../components/Toast";

export default function CodeSearch() {
  const toast = useToast();
  const [repoName, setRepoName] = useState("");
  const [query, setQuery]       = useState("");
  const [topK, setTopK]         = useState(8);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!repoName.trim() || !query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await searchRAG(repoName.trim(), query.trim(), topK);
      setResult(data.result);
      toast("success", "Search complete", `Found ${data.result.results?.length ?? 0} chunks.`);
    } catch (err) {
      toast("error", "Search failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Code Search</h1>
        <p className="page-subtitle">
          Search your repository with natural language using hybrid TF-IDF + keyword retrieval.
        </p>
      </div>

      {/* Search form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Search Parameters</div>
        <form onSubmit={handleSearch}>
          <div className="input-group">
            <label className="input-label">Repository Name</label>
            <input
              className="input"
              placeholder="e.g. my-repo"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Query</label>
            <input
              className="input"
              placeholder="e.g. Where is authentication implemented?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label className="input-label" style={{ whiteSpace: "nowrap" }}>Top-K results</label>
              <input
                className="input"
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{ width: 70 }}
                disabled={loading}
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !repoName.trim() || !query.trim()}
            >
              {loading ? <><span className="spinner" /> Searching…</> : "🔍 Search"}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="section">
          <div className="section-title">
            Search Results
            <span className="badge badge-info" style={{ marginLeft: 8 }}>
              {result.results?.length ?? 0} chunks · {result.total_documents} docs indexed
            </span>
          </div>

          {/* Context block */}
          {result.context && (
            <div style={{ marginBottom: 20 }}>
              <div className="answer-block">
                <div className="answer-block-label">🧠 Retrieved Context</div>
                <div className="answer-text" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5 }}>
                  {result.context}
                </div>
              </div>
            </div>
          )}

          {/* Individual chunks */}
          <div className="result-list">
            {(result.results ?? []).map((item, i) => (
              <div key={item.id ?? i} className="result-item">
                <div className="result-item-header">
                  <span className="result-file">📄 {item.file}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {item.keyword_score > 0 && (
                      <span className="badge badge-warning">
                        KW: {item.keyword_score.toFixed(3)}
                      </span>
                    )}
                    {item.vector_score > 0 && (
                      <span className="badge badge-info">
                        Vec: {item.vector_score.toFixed(3)}
                      </span>
                    )}
                    <span className="result-score">
                      Score: {(item.retrieval_score ?? 0).toFixed(3)}
                    </span>
                  </div>
                </div>
                <pre className="code-block" style={{ maxHeight: 200 }}>
                  {item.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
