import { useState } from "react";
import {
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Cpu,
  Clock,
} from "lucide-react";
import { runDeepAgent } from "../api/deepAgent";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";
import DiffViewer from "../components/DiffViewer";

export default function DeepAgentWorkspace() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [goal, setGoal] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline"); // timeline, patches, report

  const presets = [
    "Audit all files for unhandled exceptions and synthesize verified fixes",
    "Identify authentication and input validation security flaws and patch them",
    "Inspect dependency manifests, detect unpinned versions, and generate safety report",
    "Scan repository for dead code, long parameter lists, and propose refactorings",
  ];

  const handleStartDeepAgent = async (selectedGoal) => {
    const targetGoal = selectedGoal || goal;
    if (!targetGoal.trim()) {
      addToast("Please enter or select an engineering goal for DeepAgent.", "warning");
      return;
    }

    setIsRunning(true);
    setResult(null);
    addToast("DeepAgent started. Initializing repository inspection loop...", "info");

    try {
      const response = await runDeepAgent({
        goal: targetGoal,
        repository_path: activeRepo?.path || ".",
        repository_name: activeRepo?.name || "default",
        max_iterations: 5,
        timeout_seconds: 120,
      });

      if (response && response.success) {
        setResult(response.result);
        addToast("DeepAgent long-horizon execution finished successfully!", "success");
      } else {
        setResult(response.result || null);
        addToast(response?.result?.status || "DeepAgent execution completed with warnings.", "warning");
      }
    } catch (err) {
      addToast(err.message || "DeepAgent execution failed.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <Bot size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>DeepAgent Autonomous Workspace</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Long-horizon autonomous engineering loop with tool budget, sandbox patch validation, and plan revision.
            </p>
          </div>
        </div>
      </div>

      {/* Goal Input Card */}
      <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
          Autonomous Objective / Bug Repair Goal
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Inspect auth routes, fix bare except statements, and run tests..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isRunning}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleStartDeepAgent(goal)}
            disabled={isRunning || !goal.trim()}
            style={{ minWidth: "160px", justifyContent: "center" }}
          >
            {isRunning ? (
              <>
                <RotateCcw className="spinning" size={16} />
                <span>Executing Loop...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Launch DeepAgent</span>
              </>
            )}
          </button>
        </div>

        {/* Preset suggestions */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
            Suggested Autonomous Goals:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="badge"
                style={{ cursor: "pointer", border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}
                onClick={() => {
                  setGoal(preset);
                  handleStartDeepAgent(preset);
                }}
                disabled={isRunning}
              >
                <Sparkles size={11} style={{ marginRight: "4px" }} />
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results / Live Execution State */}
      {result && (
        <div className="card" style={{ padding: "20px" }}>
          {/* Status Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className={`badge ${result.success ? "badge-success" : "badge-warning"}`}>
                STATUS: {result.status}
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                <Clock size={13} style={{ display: "inline", marginRight: "4px" }} />
                Duration: {result.duration_sec}s
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                <Cpu size={13} style={{ display: "inline", marginRight: "4px" }} />
                Tools Invoked: {result.tools_used}
              </span>
            </div>

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={`btn btn-sm ${activeTab === "timeline" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("timeline")}
              >
                Step Timeline ({result.steps?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${activeTab === "patches" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("patches")}
              >
                Patches ({result.patches?.length || 0})
              </button>
              <button
                className={`btn btn-sm ${activeTab === "report" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("report")}
              >
                Final Report
              </button>
            </div>
          </div>

          {/* Timeline View */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {result.steps?.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-subtle)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ marginTop: "2px" }}>
                    {step.status === "SUCCESS" || step.status === "PASSED" ? (
                      <CheckCircle2 size={18} color="var(--success)" />
                    ) : (
                      <AlertTriangle size={18} color="var(--warning)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                        Iteration {step.iteration}: {step.action}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
                        {step.tool_or_agent} ({step.duration_ms}ms)
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      {step.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patches View */}
          {activeTab === "patches" && (
            <div>
              {result.patches && result.patches.length > 0 ? (
                result.patches.map((p, idx) => (
                  <div key={idx} style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>
                      Patch for: {p.target_file || "source file"}
                    </div>
                    <DiffViewer diff={p.diff} />
                  </div>
                ))
              ) : (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                  No source modifications required for this goal.
                </div>
              )}
            </div>
          )}

          {/* Report View */}
          {activeTab === "report" && (
            <div style={{ backgroundColor: "var(--bg-subtle)", padding: "16px", borderRadius: "8px", fontFamily: "monospace", fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {result.final_report}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
