import { useState, useEffect } from "react";
import {
  Wrench,
  FileCode,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  GitCommit,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runAutonomousWorkflow, approveFix } from "../api/autonomous";
import { useToast } from "../components/Toast";
import { useLocation } from "react-router-dom";
import DiffViewer from "../components/DiffViewer";
import EmptyState from "../components/feedback/EmptyState";

export default function AutonomousFix() {
  const location = useLocation();
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [filePath, setFilePath] = useState(location.state?.targetFile || "");
  const [problem, setProblem] = useState(location.state?.targetProblem || "");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (location.state?.targetFile) {
      setFilePath(location.state.targetFile);
    }
    if (location.state?.targetProblem) {
      setProblem(location.state.targetProblem);
    }
  }, [location.state]);

  const problemTemplates = [
    "Replace bare except: block with explicit Exception handling and structured logging",
    "Fix unsafe eval() / exec() execution with safe abstract syntax evaluation",
    "Add null and undefined checks before accessing nested object properties",
    "Implement retry mechanism and exponential backoff for external API requests",
  ];

  const handleAnalyzeAndFix = async (e) => {
    if (e) e.preventDefault();
    if (!filePath.trim() || !problem.trim()) {
      addToast("Target file path and problem description are required.", "warning");
      return;
    }

    if (!activeRepo) {
      addToast("Please connect or select a repository first.", "warning");
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
        addToast("Proposed patch and validation test synthesized successfully.", "success");
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
        addToast("Fix verified and successfully applied to codebase.", "success");
      } else {
        addToast(res?.error || "Failed to apply fix", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to apply fix", "error");
    } finally {
      setApplying(false);
    }
  };

  if (!activeRepo) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Wrench}
          title="No Repository Active for Autonomous Fix"
          description="Select or connect a repository to generate isolated patches, review unified diffs, and validate code before applying."
          actionText="Select Repository"
          actionPath="/repos"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            Autonomous Fix & Safe Patching
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Synthesizes safe code patches with unified diff review and validation testing. CodeAware never applies changes without your explicit confirmation.
          </p>
        </div>
      </div>

      {/* 5-Step Safe Workflow Visual */}
      <div className="card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-subtle)", flexWrap: "wrap", gap: "10px" }}>
        {[
          "1. Detect Issue",
          "2. Generate Patch",
          "3. Review Diff",
          "4. Run Validation",
          "5. Apply Fix",
        ].map((step, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
              {idx + 1}
            </span>
            <span>{step.split(". ")[1]}</span>
            {idx < 4 && <ArrowRight size={13} color="var(--text-subtle)" style={{ marginLeft: "8px" }} />}
          </div>
        ))}
      </div>

      {/* Target Input Form */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <form onSubmit={handleAnalyzeAndFix} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target File Path
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="input"
                placeholder="e.g. app/api/auth.py or src/utils/helpers.js"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                style={{ paddingLeft: "34px", fontFamily: "JetBrains Mono", fontSize: "13px" }}
                required
              />
              <FileCode size={15} color="var(--text-subtle)" style={{ position: "absolute", left: "11px", top: "12px" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Problem Description / Remediation Goal
            </label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe the bug, security issue, or code improvement needed..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
            />
          </div>

          {/* Quick Problem Templates */}
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
              Or choose a common remediation template:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {problemTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setProblem(t)}
                  style={{
                    fontSize: "11.5px",
                    padding: "3px 8px",
                    backgroundColor: "var(--bg-muted)",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-color)",
                    textAlign: "left",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !filePath.trim() || !problem.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Synthesizing Patch & Validation...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Synthesize Autonomous Fix</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Patch & Diff Review Section */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="badge badge-success" style={{ fontSize: "11px", marginBottom: "4px" }}>
                  <CheckCircle2 size={12} /> Patch Synthesized
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Review Unified Diff</h3>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                  Target: {filePath}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {applied ? (
                  <span className="badge badge-success" style={{ padding: "6px 12px", fontSize: "12.5px" }}>
                    <CheckCircle2 size={14} /> Fix Applied to Workspace
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleApplyFix}
                    disabled={applying}
                  >
                    {applying ? <Loader2 size={15} className="animate-spin" /> : <GitCommit size={15} />}
                    <span>{applying ? "Applying Patch..." : "Approve & Apply Fix"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Diff Viewer Component */}
            <DiffViewer
              original={result.raw_data?.original_code || "// Original source code"}
              modified={result.raw_data?.patched_code || "// Patched source code"}
            />
          </div>
        </div>
      )}
    </div>
  );
}