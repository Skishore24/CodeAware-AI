import { useState } from "react";
import {
  Wrench,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runAutonomousWorkflow, approveFix } from "../api/autonomous";
import { useToast } from "../components/Toast";

export default function AutonomousFix() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [filePath, setFilePath] = useState("");
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  const problemTemplates = [
    "Replace bare except: block with explicit Exception handling and logging",
    "Fix unsafe eval() / exec() call with safe deserialization",
    "Add null and undefined check before accessing object properties",
    "Add retry mechanism and error handling for external network requests",
  ];

  const handleAnalyzeAndFix = async (e) => {
    if (e) e.preventDefault();
    if (!filePath.trim() || !problem.trim()) {
      addToast("Target file and problem description are required.", "warning");
      return;
    }

    if (!activeRepo) {
      addToast("Please select an active repository first.", "warning");
      return;
    }

    setLoading(true);
    setResult(null);
    setApplied(false);

    try {
      const data = await runAutonomousWorkflow({
        repository_name: activeRepo.name,
        repository_path: activeRepo.path || activeRepo.name,
        file_path: filePath.trim(),
        problem: problem.trim(),
      });

      setResult(data);
      if (data?.success) {
        addToast("Proposed patch and regression test generated successfully.", "success");
      } else {
        addToast(data?.error || "Fix generation failed.", "error");
      }
    } catch (err) {
      addToast(err.message || "Autonomous fix execution failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = async () => {
    if (!result?.raw_data?.patched_code || !activeRepo) return;

    setApplying(true);
    try {
      const res = await approveFix({
        repository_name: activeRepo.name,
        repository_path: activeRepo.path || activeRepo.name,
        file_path: filePath.trim(),
        patched_code: result.raw_data.patched_code,
        approved: true,
      });

      if (res?.success) {
        setApplied(true);
        addToast(`Patch successfully applied to ${filePath}!`, "success");
      } else {
        addToast(res?.error || "Failed to apply fix.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to apply fix.", "error");
    } finally {
      setApplying(false);
    }
  };

  const diffLines = result?.diff?.split("\n") || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Autonomous Fix & Safe Patching</h1>
          <p className="page-subtitle">
            Autonomous patch synthesis, unified diff inspection, isolated syntax/test validation, and human-approved application.
          </p>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="card-title" style={{ marginBottom: "var(--space-4)" }}>
          <Wrench size={18} color="var(--primary)" />
          <span>Step 1: Bug & Target File Details</span>
        </h2>

        <form onSubmit={handleAnalyzeAndFix} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target File Path (relative to repository root)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. app/api/auth.py or src/utils/helpers.js"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={loading}
              style={{ padding: "10px 12px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Problem Description / Bug Symptoms
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Replace bare except with explicit exception handling / Fix unsafe eval / Handle null token error"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={loading}
              style={{ resize: "vertical", padding: "10px 12px" }}
            />
          </div>

          {/* Quick Problem Templates */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Quick Templates:
            </span>
            {problemTemplates.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: "2px 8px", fontSize: "11px", borderRadius: "var(--radius-full)" }}
                onClick={() => setProblem(tmpl)}
              >
                {tmpl.slice(0, 38)}...
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !filePath.trim() || !problem.trim()}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>{loading ? "Synthesizing & Validating Patch..." : "Analyze & Propose Patch"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Fix Results & Unified Diff Section */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Summary Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ fontSize: "16px" }}>
                  <ShieldCheck size={18} color="var(--success)" />
                  <span>Step 2: Proposed Patch & Validation Status</span>
                </h3>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {result.fix_summary}
                </div>
              </div>
              <span className={`badge ${result.is_validated ? "badge-success" : "badge-warning"}`} style={{ fontSize: "12.5px", padding: "4px 10px" }}>
                {result.is_validated ? "Validation Passed" : "Validation Warning"}
              </span>
            </div>

            <div className="timeline" style={{ margin: "var(--space-3) 0", backgroundColor: "var(--bg-subtle)" }}>
              {result.steps?.map((s, idx) => (
                <div key={idx} className="timeline-step">
                  <span className={`timeline-dot ${s.status === "PASSED" || s.status === "COMPLETED" ? "completed" : "failed"}`}></span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{s.step}:</span>
                  <span style={{ color: "var(--text-muted)" }}>Agent: {s.agent} ({s.status})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unified Diff Viewer */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FileCode size={18} color="var(--primary)" />
                <span>Step 3: Unified Diff Preview</span>
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Never overwrites workspace file without explicit approval</span>
            </div>

            <div className="diff-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {diffLines.map((line, idx) => {
                let lineClass = "";
                if (line.startsWith("+") && !line.startsWith("+++")) lineClass = "add";
                else if (line.startsWith("-") && !line.startsWith("---")) lineClass = "del";
                else if (line.startsWith("@") || line.startsWith("---") || line.startsWith("+++")) lineClass = "info";

                return (
                  <div key={idx} className={`diff-line ${lineClass}`}>
                    {line}
                  </div>
                );
              })}
            </div>

            {/* Approval Controls */}
            <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {applied ? (
                  <span style={{ color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={16} /> Patch successfully applied to workspace file with backup.
                  </span>
                ) : (
                  "Confirm that the diff solves the problem before applying changes."
                )}
              </div>

              {!applied && (
                <button className="btn btn-primary btn-lg" onClick={handleApplyFix} disabled={applying}>
                  {applying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{applying ? "Applying Patch..." : "Approve & Apply Patch"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}