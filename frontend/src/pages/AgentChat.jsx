import { useState, useRef, useEffect, useCallback } from "react";
import { runAgent } from "../api/agents";
import { useToast } from "../components/Toast";
import { useRepo } from "../context/RepoContext";
import {
  Bot, User, Sparkles, Send, Brain, CheckCircle2,
  XCircle, Copy, Check, Trash2, ChevronDown,
} from "lucide-react";

const INTENT_COLORS = {
  code_search:          "#6366f1",
  code_explanation:     "#a855f7",
  repository_analysis:  "#10b981",
  impact_analysis:      "#f59e0b",
  bug_analysis:         "#ef4444",
  security_analysis:    "#ec4899",
  test_generation:      "#06b6d4",
  fix_request:          "#f97316",
  documentation:        "#84cc16",
};

const INTENT_LABELS = {
  code_search:          "Code Search",
  code_explanation:     "Code Explanation",
  repository_analysis:  "Repo Analysis",
  impact_analysis:      "Impact Analysis",
  bug_analysis:         "Bug Analysis",
  security_analysis:    "Security Analysis",
  test_generation:      "Test Generation",
  fix_request:          "Fix Request",
  documentation:        "Documentation",
};

const EXAMPLE_TASKS = [
  "Where is authentication implemented?",
  "What technologies does this project use?",
  "Find potential security vulnerabilities",
  "Generate tests for the main functions",
  "What will break if I change authenticate_user?",
  "Explain the repository structure",
  "Find all database queries",
  "Analyse code quality and bugs",
];

/** Minimal markdown renderer: converts **bold**, `code`, and ```blocks``` */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let codeBlock = null;
  let codeLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (codeBlock !== null) {
        // end code block
        elements.push(
          <CodeBlockWithCopy key={i} code={codeLines.join("\n")} lang={codeBlock} />
        );
        codeBlock = null;
        codeLines = [];
      } else {
        codeBlock = line.slice(3) || "text";
      }
    } else if (codeBlock !== null) {
      codeLines.push(line);
    } else {
      const inlined = inlineMarkdown(line);
      elements.push(<p key={i} style={{ margin: "4px 0", lineHeight: 1.7 }}>{inlined}</p>);
    }
    i++;
  }

  return <>{elements}</>;
}

function inlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} style={{ background: "rgba(0,0,0,0.4)", padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace", fontSize: "0.9em" }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

function CodeBlockWithCopy({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="chat-code-block">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", background: "rgba(99,102,241,0.08)", borderRadius: "4px 4px 0 0", borderBottom: "1px solid var(--color-border)", fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
        {lang}
        <button className="chat-copy-btn" onClick={copy} title="Copy">
          {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre style={{ borderRadius: "0 0 4px 4px", margin: 0 }}>{code}</pre>
    </div>
  );
}

const STORAGE_KEY = "ca_chat_messages";

export default function AgentChat() {
  const toast = useToast();
  const { activeRepo, setActiveRepo, repositories } = useRepo();

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });
  const [task, setTask]       = useState("");
  const [repoName, setRepoName] = useState(() => activeRepo?.name || "");
  const [repoPath, setRepoPath] = useState(() => activeRepo?.path || "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-fill from context
  useEffect(() => {
    if (activeRepo?.name) setRepoName(activeRepo.name);
    if (activeRepo?.path) setRepoPath(activeRepo.path);
  }, [activeRepo]);

  // Persist messages
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); }
    catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    const userMessage = { role: "user", content: task };
    setMessages((prev) => [...prev, userMessage]);
    const currentTask = task;
    setTask("");
    setLoading(true);

    try {
      const inputData = {};
      if (repoName.trim()) inputData.repository_name = repoName.trim();
      if (repoPath.trim()) inputData.repository_path = repoPath.trim();

      const data = await runAgent(currentTask, inputData);

      const intentColor = INTENT_COLORS[data.intent] ?? "var(--color-accent)";
      const agentResult = data.agent_result ?? {};
      const answer =
        agentResult.answer ||
        agentResult.message ||
        agentResult.error ||
        JSON.stringify(agentResult, null, 2);

      setMessages((prev) => [...prev, {
        role: "assistant",
        intent: data.intent,
        confidence: data.intent_confidence,
        content: answer,
        success: data.success,
        intentColor,
        alternatives: data.intent_alternatives ?? [],
      }]);

      if (data.success) {
        toast("success", "Agent responded", INTENT_LABELS[data.intent] ?? data.intent);
      } else {
        toast("info", "Agent completed", INTENT_LABELS[data.intent] ?? data.intent);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err.message}`,
        success: false,
        intentColor: "var(--color-red)",
      }]);
      toast("error", "Agent error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div className="page-eyebrow">AI Agents</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bot size={26} color="var(--color-accent)" /> Agent Chat
        </h1>
        <p className="page-subtitle">
          Describe a task in plain English — the ML orchestrator classifies intent and routes to the right specialist agent.
        </p>
      </div>

      {/* Config strip */}
      <div className="card" style={{ marginBottom: 14, flexShrink: 0 }}>
        {repositories.length > 0 && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-text-muted)" }}>
              Repository:
            </span>
            {repositories.map((rep) => {
              const isSelected = repoName === rep.name || repoPath === rep.path || activeRepo?.name === rep.name;
              return (
                <button
                  key={rep.path}
                  type="button"
                  onClick={() => {
                    setRepoName(rep.name);
                    setRepoPath(rep.path);
                    setActiveRepo(rep);
                  }}
                  style={{
                    background: isSelected ? "var(--color-accent-soft)" : "var(--color-surface)",
                    border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 10px",
                    fontSize: 11.5,
                    color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  <Brain size={12} />
                  <strong>{rep.name}</strong>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div className="input-label" style={{ marginBottom: 5 }}>Repo Name</div>
            <input className="input" placeholder="my-repo (e.g. BUS)" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <div className="input-label" style={{ marginBottom: 5 }}>Repo Path (optional)</div>
            <input className="input" placeholder="Full path if not using name" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} />
          </div>
          {messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearHistory} title="Clear history">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Example chips (only when empty) */}
      {messages.length === 0 && (
        <div style={{ marginBottom: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={13} color="var(--color-yellow)" /> Try an example:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {EXAMPLE_TASKS.map((ex) => (
              <button key={ex} className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }} onClick={() => setTask(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat thread */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 48 }}>
            <div className="empty-state-icon" style={{ display: "inline-flex", padding: 14, borderRadius: 14, background: "rgba(99,102,241,0.08)", marginBottom: 14 }}>
              <Bot size={32} color="var(--color-accent)" style={{ opacity: 0.6 }} />
            </div>
            <div className="empty-state-title">Send a task to get started</div>
            <div className="empty-state-text">The orchestrator will route it to the right agent automatically.</div>
          </div>
        )}

        <div className="chat-thread">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === "user"
                  ? <User size={15} color="#fff" />
                  : <Brain size={15} color="var(--color-accent)" />}
              </div>

              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 7 }}>
                {/* Intent badge */}
                {msg.role === "assistant" && msg.intent && (
                  <div className="intent-display" style={{ borderColor: msg.intentColor + "40" }}>
                    <div className="intent-label">Detected Intent</div>
                    <div className="intent-value" style={{ color: msg.intentColor }}>
                      {INTENT_LABELS[msg.intent] ?? msg.intent}
                    </div>
                    <div className="intent-confidence">
                      Confidence: {((msg.confidence ?? 0) * 100).toFixed(1)}%
                      {msg.alternatives?.length > 1 && (
                        <span style={{ marginLeft: 10, opacity: 0.7 }}>
                          · Alt: {msg.alternatives.slice(1, 3).map((a) => INTENT_LABELS[a.intent] ?? a.intent).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="chat-bubble">
                  {msg.role === "assistant"
                    ? renderMarkdown(msg.content)
                    : msg.content}
                </div>

                {msg.role === "assistant" && (
                  <span
                    className={`badge ${msg.success ? "badge-success" : "badge-error"}`}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {msg.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {msg.success ? "success" : "failed"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">
                <Brain size={15} color="var(--color-accent)" />
              </div>
              <div className="chat-bubble" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                <span className="spinner" /> Routing to agent…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="card" style={{ flexShrink: 0 }}>
        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <input
              className="input"
              placeholder="Describe a task… e.g. 'Find where login is implemented'"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={loading}
              style={{ fontSize: 14 }}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !task.trim()}
            >
              {loading ? <span className="spinner" /> : <><Send size={15} /> Send</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
