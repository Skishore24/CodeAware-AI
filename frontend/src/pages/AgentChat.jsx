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
  Copy,
  Check,
  Zap,
  Terminal,
  Activity,
  Layers,
  Search,
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
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "CodeAware Autonomous Intelligence ready. Ask any question about repository architecture, search for symbols, detect bugs, audit security vulnerabilities, or request automated fixes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    { label: "Audit OWASP Vulnerabilities", icon: ShieldAlert, prompt: "Perform a full security vulnerability scan and check for SQL injection, hardcoded secrets, and unsafe eval." },
    { label: "Find Bugs & Anti-Patterns", icon: Bug, prompt: "Analyze the codebase for potential runtime bugs, uncaught exceptions, and bare except blocks." },
    { label: "Architecture & Layer Review", icon: Layers, prompt: "Provide an architecture overview, mapping the API controllers, services, models, and dependencies." },
    { label: "Impact & Blast Radius", icon: GitFork, prompt: "What is the blast radius and who calls authenticate_user?" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText) => {
    const userPrompt = (customText || input).trim();
    if (!userPrompt) return;

    if (!activeRepo) {
      addToast("Please select an active repository first.", "warning");
      return;
    }

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

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    addToast("Response copied to clipboard", "info");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-3)" }}>
        <div>
          <h1 className="page-title">Agent Chat & Intelligence</h1>
          <p className="page-subtitle">
            Autonomous multi-agent orchestration across AST symbols, knowledge graphs, and hybrid RAG.
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-primary" style={{ padding: "4px 10px" }}>
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
          marginBottom: "var(--space-3)",
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
                  maxWidth: isUser ? "75%" : "92%",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    <Bot size={20} />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: isUser ? "var(--primary)" : "var(--bg-surface)",
                      color: isUser ? "white" : "var(--text-main)",
                      border: isUser ? "none" : "1px solid var(--border-color)",
                      boxShadow: isUser ? "var(--shadow-xs)" : "var(--shadow-xs)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {/* Metadata header for Assistant */}
                    {!isUser && data && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <span className="badge badge-primary">
                            Intent: {data.intent} ({Math.round((data.intent_confidence || 0.9) * 100)}%)
                          </span>
                          <span className="badge badge-purple">
                            Agent: {data.agent_name || "Orchestrator"}
                          </span>
                          {data.execution_duration_sec && (
                            <span className="badge badge-neutral">
                              <Clock size={11} /> {data.execution_duration_sec}s
                            </span>
                          )}
                        </div>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => copyText(msg.text, idx)}
                        >
                          {copiedIdx === idx ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                          <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}

                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>

                    {/* Execution Timeline */}
                    {data?.timeline && data.timeline.length > 0 && (
                      <div className="timeline" style={{ marginTop: "14px", backgroundColor: "var(--bg-subtle)" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                          MULTI-AGENT TIMELINE
                        </div>
                        {data.timeline.map((t, tIdx) => (
                          <div key={tIdx} className="timeline-step">
                            <span className={`timeline-dot ${t.status === "COMPLETED" ? "completed" : t.status === "FAILED" ? "failed" : "running"}`}></span>
                            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{t.step}:</span>
                            <span style={{ color: "var(--text-muted)" }}>{t.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Identified Citations */}
                    {data?.evidence && data.evidence.length > 0 && (
                      <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                          Source Evidence & Citations:
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
                      <div style={{ marginTop: "14px", padding: "12px", backgroundColor: "var(--primary-light)", borderRadius: "var(--radius-md)", border: "1px solid var(--primary-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "13.5px", color: "var(--primary)", fontWeight: 700 }}>
                            Automated Patch Generated
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            FixAgent prepared a validated diff for review.
                          </div>
                        </div>
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface-active)",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={20} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text-muted)", padding: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 size={20} className="animate-spin" />
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: 500 }}>
                Coordinating specialist agents and synthesizing AST context...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "4px" }}>
        {promptSuggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              disabled={loading}
              onClick={() => handleSendMessage(item.prompt)}
              style={{ fontSize: "12px", whiteSpace: "nowrap" }}
            >
              <Icon size={13} color="var(--primary)" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          className="input"
          placeholder="Ask anything about the codebase, discover architecture, detect security flaws..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ padding: "12px 16px", fontSize: "14px" }}
        />
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !input.trim()}>
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
