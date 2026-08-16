import { useState, useRef, useEffect } from "react";
import { runAgent } from "../api/agents";
import { useToast } from "../components/Toast";

const INTENT_COLORS = {
  code_search:        "#6366f1",
  code_explanation:   "#a855f7",
  repository_analysis:"#10b981",
  impact_analysis:    "#f59e0b",
  bug_analysis:       "#ef4444",
  security_analysis:  "#ec4899",
  test_generation:    "#06b6d4",
  fix_request:        "#f97316",
  documentation:      "#84cc16",
};

const EXAMPLE_TASKS = [
  "Where is authentication implemented?",
  "What technologies does this project use?",
  "Find security vulnerabilities",
  "Generate tests for the login function",
  "What will break if I change authenticate_user?",
  "Explain the repository structure",
];

export default function AgentChat() {
  const toast = useToast();
  const [messages, setMessages]     = useState([]);
  const [task, setTask]             = useState("");
  const [repoName, setRepoName]     = useState("");
  const [repoPath, setRepoPath]     = useState("");
  const [loading, setLoading]       = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
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
      const answer = agentResult.answer
        || agentResult.message
        || agentResult.error
        || JSON.stringify(agentResult, null, 2);

      const assistantMessage = {
        role: "assistant",
        intent: data.intent,
        confidence: data.intent_confidence,
        content: answer,
        success: data.success,
        intentColor,
        alternatives: data.intent_alternatives ?? [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.success) {
        toast("success", "Agent responded", `Intent: ${data.intent}`);
      } else {
        toast("info", "Agent completed", `Intent: ${data.intent}`);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `❌ Error: ${err.message}`,
        success: false,
        intentColor: "var(--color-red)",
      }]);
      toast("error", "Agent error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
      <div className="page-header">
        <h1 className="page-title">🤖 Agent Chat</h1>
        <p className="page-subtitle">
          Describe a task in plain English — the orchestrator classifies intent and routes to the right agent.
        </p>
      </div>

      {/* Config strip */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div className="input-label" style={{ marginBottom: 6 }}>Repository Name</div>
            <input
              className="input"
              placeholder="e.g. my-repo"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="input-label" style={{ marginBottom: 6 }}>Repository Path (optional)</div>
            <input
              className="input"
              placeholder="Full path if not using name"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Example tasks */}
      {messages.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            💡 Try an example:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {EXAMPLE_TASKS.map((ex) => (
              <button
                key={ex}
                className="btn btn-secondary btn-sm"
                onClick={() => setTask(ex)}
                style={{ fontSize: 12 }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat thread */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-state-icon">🤖</div>
            <div className="empty-state-text">Send a task to get started.</div>
          </div>
        )}

        <div className="chat-thread">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === "user" ? "👤" : "🧠"}
              </div>
              <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 8 }}>
                {msg.role === "assistant" && msg.intent && (
                  <div className="intent-display" style={{ borderColor: msg.intentColor + "44" }}>
                    <div className="intent-label">Detected Intent</div>
                    <div className="intent-value" style={{ color: msg.intentColor }}>
                      {msg.intent}
                    </div>
                    <div className="intent-confidence">
                      Confidence: {((msg.confidence ?? 0) * 100).toFixed(1)}%
                      {msg.alternatives?.length > 1 && (
                        <span style={{ marginLeft: 10 }}>
                          · Alt: {msg.alternatives.slice(1, 3).map(a => a.intent).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="chat-bubble">
                  {msg.content}
                </div>
                {msg.role === "assistant" && (
                  <span className={`badge ${msg.success ? "badge-success" : "badge-error"}`} style={{ alignSelf: "flex-start" }}>
                    {msg.success ? "✓ success" : "✗ failed"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">🧠</div>
              <div className="chat-bubble" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" />
                Agent processing…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="card" style={{ marginTop: "auto" }}>
        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <input
              className="input"
              placeholder="Describe a task… e.g. 'Find where login is implemented'"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !task.trim()}
            >
              {loading ? <span className="spinner" /> : "Send ↑"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
