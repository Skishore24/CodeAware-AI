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

  const handleAnalyzeAndFix = async (e) => {
    e.preventDefault();
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
        addToast("Proposed patch and validation completed.", "success");
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
            Targeted source-code patch generation, unified diff inspection, and test-verified safe application.
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
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target File Path (relative to repository root)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. app/api/auth.py or src/utils/helpers.js"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Problem Description / Bug Symptoms
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Replace bare except with explicit exception handling / Fix unsafe eval / Handle null token error"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={loading}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !filePath.trim() || !problem.trim()}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>{loading ? "Analyzing & Generating Patch..." : "Analyze & Propose Patch"}</span>
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
                <h3 className="card-title">Step 2: Proposed Patch & Validation Status</h3>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {result.fix_summary}
                </div>
              </div>
              <span className={`badge ${result.is_validated ? "badge-success" : "badge-warning"}`}>
                {result.is_validated ? "Validation Passed" : "Validation Warning"}
              </span>
            </div>

            <div className="timeline" style={{ margin: "var(--space-3) 0" }}>
              {result.steps?.map((s, idx) => (
                <div key={idx} className="timeline-step">
                  <span className={`timeline-dot ${s.status === "PASSED" || s.status === "COMPLETED" ? "completed" : "failed"}`}></span>
                  <span style={{ fontWeight: 600 }}>{s.step}:</span>
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
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Never automatically overwrites without approval</span>
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
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                {applied ? (
                  <span style={{ color: "var(--success)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={16} /> Patch applied to workspace file.
                  </span>
                ) : (
                  "Confirm that the diff solves the problem before applying changes."
                )}
              </div>

              {!applied && (
                <button className="btn btn-primary" onClick={handleApplyFix} disabled={applying}>
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