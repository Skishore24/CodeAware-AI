import { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  Bug,
  GitFork,
  FileCode,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runAgent } from "../api/agents";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function AgentChat() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "CodeAware Autonomous Intelligence ready. Ask any question about repository architecture, search for symbols, detect bugs, audit security vulnerabilities, or request automated fixes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!activeRepo) {
      addToast("Please select an active repository first.", "warning");
      return;
    }

    const userPrompt = input.trim();
    setInput("");

    const newMsg = {
      role: "user",
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await runAgent(userPrompt, {
        repository_name: activeRepo.name,
        repository_path: activeRepo.path || activeRepo.name,
      });

      const assistantMsg = {
        role: "assistant",
        text: response?.summary || "Analysis completed.",
        data: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Analysis failed: ${err.message}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-3)" }}>
        <div>
          <h1 className="page-title">Agent Chat & Intelligence</h1>
          <p className="page-subtitle">
            Autonomous specialist agents collaborating across AST symbols, knowledge graphs, and RAG.
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-primary">
            <Bot size={13} />
            <span>15 Specialist Agents Active</span>
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div
        className="card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-4)",
          overflowY: "auto",
          marginBottom: "var(--space-4)",
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const data = msg.data;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: isUser ? "75%" : "90%",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: isUser ? "var(--primary)" : "var(--bg-subtle)",
                      color: isUser ? "white" : "var(--text-main)",
                      border: isUser ? "none" : "1px solid var(--border-color)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {/* Assistant Metadata Badges */}
                    {data && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                        <span className="badge badge-primary">
                          Intent: {data.intent} ({Math.round((data.intent_confidence || 0.9) * 100)}%)
                        </span>
                        <span className="badge badge-neutral">
                          Agent: {data.agent_name || "Orchestrator"}
                        </span>
                        {data.execution_duration_sec && (
                          <span className="badge badge-neutral">
                            <Clock size={11} /> {data.execution_duration_sec}s
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>

                    {/* Execution Timeline */}
                    {data?.timeline && data.timeline.length > 0 && (
                      <div className="timeline" style={{ marginTop: "12px", backgroundColor: "#FFFFFF" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                          EXECUTION TIMELINE
                        </div>
                        {data.timeline.map((t, tIdx) => (
                          <div key={tIdx} className="timeline-step">
                            <span className={`timeline-dot ${t.status === "COMPLETED" ? "completed" : t.status === "FAILED" ? "failed" : "running"}`}></span>
                            <span style={{ fontWeight: 500, color: "var(--text-main)" }}>{t.step}:</span>
                            <span style={{ color: "var(--text-muted)" }}>{t.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations & Evidence */}
                    {data?.evidence && data.evidence.length > 0 && (
                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                          Identified Citations & Code Locations:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {data.evidence.map((ev, eIdx) => (
                            <span key={eIdx} className="badge badge-neutral" style={{ fontFamily: "monospace", fontSize: "11.5px" }}>
                              {ev.citation || `${ev.file}:${ev.line}` || JSON.stringify(ev)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chained Action Triggers */}
                    {data?.chained_results?.fix && (
                      <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#EFF6FF", borderRadius: "6px", border: "1px solid #BFDBFE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "#1E40AF", fontWeight: 500 }}>
                          Proposed Patch Generated by FixAgent
                        </span>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate("/autonomous")}>
                          <Wrench size={13} />
                          <span>Review & Apply Patch</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: isUser ? "flex-end" : "flex-start" }}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "#E2E8F0",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text-muted)" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 size={18} className="animate-spin" />
              </div>
              <span style={{ fontSize: "13.5px" }}>Orchestrating specialist agents and retrieving AST context...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          className="input"
          placeholder="Ask a question, find a bug, audit security, or analyze impact..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ padding: "12px 16px", fontSize: "14px" }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ padding: "12px 20px" }}>
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
