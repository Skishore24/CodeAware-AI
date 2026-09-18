import { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function ContextPanel({
  explanation,
  sources = [],
  agentActivity = [],
  actions = [],
  onActionClick,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("insights"); // insights, sources, activity

  if (collapsed) {
    return (
      <div
        className="context-panel-collapsed"
        onClick={() => setCollapsed(false)}
        title="Expand AI Context Panel"
        style={{
          width: "36px",
          borderLeft: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "16px",
          cursor: "pointer",
        }}
      >
        <ChevronLeft size={16} color="var(--text-muted)" />
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            marginTop: "16px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          AI Context
        </span>
      </div>
    );
  }

  return (
    <aside
      className="context-panel"
      style={{
        width: "320px",
        borderLeft: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-card)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
            AI Intelligence Panel
          </span>
        </div>
        <button
          className="btn-icon"
          onClick={() => setCollapsed(true)}
          title="Collapse Panel"
          style={{ padding: "4px" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "4px 8px",
          gap: "4px",
        }}
      >
        <button
          className={`btn btn-sm ${activeTab === "insights" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("insights")}
          style={{ flex: 1, padding: "4px 8px", fontSize: "11.5px", justifyContent: "center" }}
        >
          Insights
        </button>
        <button
          className={`btn btn-sm ${activeTab === "sources" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("sources")}
          style={{ flex: 1, padding: "4px 8px", fontSize: "11.5px", justifyContent: "center" }}
        >
          Sources ({sources.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === "activity" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("activity")}
          style={{ flex: 1, padding: "4px 8px", fontSize: "11.5px", justifyContent: "center" }}
        >
          Activity
        </button>
      </div>

      {/* Panel Content */}
      <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
        {activeTab === "insights" && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Active AI Reasoning
            </div>
            <div style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "16px" }}>
              {explanation || "Select a symbol or run an agent to inspect architectural insights and recommendations."}
            </div>

            {actions && actions.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Recommended Next Actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {actions.map((act, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary btn-sm"
                      onClick={() => onActionClick && onActionClick(act)}
                      style={{ justifyContent: "flex-start", textAlign: "left", fontSize: "12px" }}
                    >
                      <ChevronRight size={13} color="var(--primary)" />
                      <span>{act}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sources" && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Referenced Code Citations
            </div>
            {sources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-subtle)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {typeof src === "string" ? src : src.file}
                    </div>
                    {src.lines && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Lines: {src.lines}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
                No active source citations.
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Operational Traces
            </div>
            {agentActivity.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {agentActivity.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-subtle)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{act.step}</span>
                      <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{act.status}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      {act.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
                No recent agent events.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
