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
import EmptyState from "../components/feedback/EmptyState";

export default function AgentChat() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "CodeAware AI Assistant ready. Ask any question about repository architecture, search for symbols, detect bugs, audit security vulnerabilities, or request automated fixes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    { label: "Where is authentication implemented?", icon: Search, prompt: "Where is user authentication, token verification, or login handled in this codebase?" },
    { label: "Explain the architecture", icon: Layers, prompt: "Explain the overall architectural structure, layers, and entry points of this repository." },
    { label: "Find potential security risks", icon: ShieldAlert, prompt: "Audit the codebase for OWASP vulnerabilities, SQL injection, hardcoded secrets, and unsafe function calls." },
    { label: "Find bugs and anti-patterns", icon: Bug, prompt: "Inspect this repository for potential runtime flaws, uncaught exceptions, and unhandled errors." },
    { label: "Calculate function blast radius", icon: GitFork, prompt: "Which files and API routes depend on the primary service or database models?" },
    { label: "Generate unit test suite", icon: FileCode, prompt: "Generate a unit test suite with mock fixtures for the main controllers in this project." },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (customText) => {
    const userPrompt = (customText || input).trim();
    if (!userPrompt) return;

    if (!activeRepo) {
      addToast("Please connect or select a repository first.", "warning");
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
        text: response?.summary || (typeof response === "string" ? response : "Analysis completed."),
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
    addToast("Copied to clipboard", "info");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Bot}
          title="No Repository Active for AI Assistant"
          description="Select or connect a repository to chat with specialized engineering agents regarding code structure, security, and bug fixes."
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
            CodeAware AI Assistant
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Context-aware Q&A on codebase: <strong style={{ color: "var(--text-main)" }}>{activeRepo.name}</strong> powered by 15 specialist AI agents.
          </p>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className="card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "85%",
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
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: isUser ? "var(--primary)" : "var(--bg-subtle)",
                    color: isUser ? "#FFFFFF" : "var(--text-main)",
                    borderRadius: "var(--radius-lg)",
                    border: isUser ? "none" : "1px solid var(--border-color)",
                    padding: "12px 16px",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "13.5px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </div>

                  {/* If assistant returned structured code or citations */}
                  {msg.data?.agent_result?.raw_data?.test_code && (
                    <div style={{ marginTop: "10px", position: "relative" }}>
                      <div className="code-box" style={{ fontSize: "12px", maxHeight: "200px" }}>
                        {msg.data.agent_result.raw_data.test_code}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => copyText(msg.data.agent_result.raw_data.test_code, idx)}
                        style={{ position: "absolute", right: "8px", top: "8px", padding: "3px 8px", fontSize: "11px" }}
                      >
                        {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "10.5px",
                      color: isUser ? "rgba(255, 255, 255, 0.7)" : "var(--text-muted)",
                      marginTop: "6px",
                      textAlign: "right",
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-muted)",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
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
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Analyzing repository AST symbols and multi-agent intent...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Bar */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--bg-subtle)",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
          }}
        >
          {promptSuggestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={loading}
                style={{
                  fontSize: "11.5px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-full)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Icon size={12} color="var(--primary)" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            <input
              type="text"
              className="input"
              placeholder="Ask anything about this repository (e.g. Which files handle authentication?)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, height: "42px" }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{ height: "42px", padding: "0 18px" }}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
