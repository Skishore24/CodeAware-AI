import { useState, useEffect } from "react";
import {
  runAutonomousWorkflow,
  approveFix,
  createPullRequest,
} from "../api/autonomous";
import { useRepo } from "../context/RepoContext";
import { useToast } from "../components/Toast";
import {
  Wrench, Play, GitPullRequest, CheckCircle2, AlertCircle,
  RefreshCw, FileCode, GitBranch, ChevronRight,
} from "lucide-react";

// Pipeline steps
const STEPS = [
  { key: "analyze",  label: "Analyse",  desc: "Inspect the code file and understand the problem"   },
  { key: "fix",      label: "Fix",      desc: "Generate a code patch for the reported issue"        },
  { key: "validate", label: "Validate", desc: "Verify the fix is syntactically correct"             },
  { key: "approve",  label: "Approve",  desc: "Review the diff and commit to a branch"              },
  { key: "pr",       label: "PR",       desc: "Open a GitHub Pull Request with the fix"             },
];

function stepStatus(stepKey, currentStep, completed) {
  if (completed.includes(stepKey)) return "done";
  if (stepKey === currentStep) return "active";
  return "waiting";
}

export default function AutonomousFix() {
  const { activeRepo, setActiveRepo, repositories } = useRepo();
  const toast = useToast();

  const [form, setForm] = useState({
    repository_path: activeRepo?.path || "",
    file_path:       "",
    function_name:   "",
    problem:         "",
    max_retries:     2,
  });

  const [result, setResult]     = useState(null);
  const [approval, setApproval] = useState({
    branch_name:    "",
    commit_message: "CodeAware: apply validated fix",
  });
  const [prForm, setPrForm] = useState({
    owner:       "",
    repo_name:   "",
    base_branch: "main",
    title:       "",
  });

  const [gitResult, setGitResult] = useState(null);
  const [prResult, setPrResult]   = useState(null);

  const [loading, setLoading]             = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [prLoading, setPrLoading]         = useState(false);
  const [error, setError]                 = useState("");
  const [activeStep, setActiveStep]       = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Auto-fill repo path from context
  useEffect(() => {
    if (activeRepo?.path) setForm((prev) => ({ ...prev, repository_path: activeRepo.path }));
  }, [activeRepo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Run Workflow ──────────────────────────────────────────
  const startWorkflow = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setGitResult(null);
    setPrResult(null);
    setCompletedSteps([]);

    setActiveStep("analyze");
    try {
      const data = await runAutonomousWorkflow({
        repository_path: form.repository_path,
        file_path:       form.file_path,
        function_name:   form.function_name || undefined,
        problem:         form.problem,
        max_retries:     Number(form.max_retries),
      });

      setCompletedSteps(["analyze", "fix", "validate"]);
      setActiveStep("approve");
      setResult(data);

      if (data.success !== false) {
        toast("success", "Fix generated", "Review the diff and approve to commit.");
      } else {
        toast("error", "Workflow failed", data.error || data.message || "Unknown error");
        setError(data.error || data.message || "Workflow failed.");
        setActiveStep(null);
      }
    } catch (err) {
      setError(err.message || "Workflow failed.");
      toast("error", "Workflow failed", err.message);
      setActiveStep(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Approve Fix ───────────────────────────────────────────
  const approveAndCommit = async () => {
    if (!result?.modified_code) { toast("warning", "No code to commit", "Run the workflow first."); return; }

    setApprovalLoading(true);
    try {
      const data = await approveFix({
        repository_path: form.repository_path,
        file_path:       form.file_path,
        modified_code:   result.modified_code,
        branch_name:     approval.branch_name,
        commit_message:  approval.commit_message,
        approved:        true,
        push:            true,
      });

      setGitResult(data);
      setCompletedSteps((prev) => [...prev, "approve"]);
      setActiveStep("pr");
      toast("success", "Fix committed", `Branch: ${approval.branch_name}`);
    } catch (err) {
      toast("error", "Approval failed", err.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  // ── Create PR ─────────────────────────────────────────────
  const submitPR = async () => {
    setPrLoading(true);
    try {
      const data = await createPullRequest({
        owner:             prForm.owner,
        repo_name:         prForm.repo_name,
        head_branch:       approval.branch_name,
        base_branch:       prForm.base_branch,
        title:             prForm.title || `fix: ${form.problem.slice(0, 60)}`,
        problem:           form.problem,
        validation_status: "Passed",
        approved:          true,
      });

      setPrResult(data);
      setCompletedSteps((prev) => [...prev, "pr"]);
      setActiveStep(null);
      toast("success", "PR created!", data.pull_request_url ?? "");
    } catch (err) {
      toast("error", "PR creation failed", err.message);
    } finally {
      setPrLoading(false);
    }
  };

  const hasModifiedCode = result?.modified_code;
  const hasDiff = result?.diff || result?.patch;

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Autonomous Development</div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Wrench size={26} color="var(--color-accent)" /> Autonomous Fix
        </h1>
        <p className="page-subtitle">
          Describe a bug — the AI analyses, generates a fix, validates it, then opens a PR for your review.
        </p>
      </div>

      {/* Pipeline progress */}
      {(activeStep || completedSteps.length > 0) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Fix Pipeline</div>
          <div className="step-list">
            {STEPS.map((s) => {
              const st = stepStatus(s.key, activeStep, completedSteps);
              return (
                <div key={s.key} className="step-item">
                  <div className={`step-icon ${st}`}>
                    {st === "done"   ? <CheckCircle2 size={14} /> :
                     st === "active" ? <span className="spinner spinner-sm" style={{ borderTopColor: "var(--color-accent)" }} /> :
                                       <ChevronRight size={13} />}
                  </div>
                  <div className="step-content">
                    <div className="step-title">{s.label}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="repo-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <div className="autonomous-grid">
        {/* Left: input form */}
        <div>
          <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <FileCode size={14} color="var(--color-accent)" /> Problem Description
            </div>

            {repositories.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Select Cloned Repository
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {repositories.map((rep) => {
                    const isSelected = form.repository_path === rep.path || activeRepo?.path === rep.path;
                    return (
                      <button
                        key={rep.path}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, repository_path: rep.path }));
                          setActiveRepo(rep);
                        }}
                        style={{
                          background: isSelected ? "var(--color-accent-soft)" : "var(--color-surface)",
                          border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                          borderRadius: "var(--radius-sm)",
                          padding: "6px 12px",
                          fontSize: 12,
                          color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "JetBrains Mono, monospace",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Wrench size={13} />
                        <strong>{rep.name}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Repository Path *</label>
              <input name="repository_path" value={form.repository_path} onChange={handleChange}
                placeholder="C:\...\repository" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            </div>
            <div className="form-group">
              <label>File Path *</label>
              <input name="file_path" value={form.file_path} onChange={handleChange}
                placeholder="app/utils.py" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            </div>
            <div className="form-group">
              <label>Function Name (optional)</label>
              <input name="function_name" value={form.function_name} onChange={handleChange}
                placeholder="my_function" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            </div>
            <div className="form-group">
              <label>Problem Description *</label>
              <textarea name="problem" value={form.problem} onChange={handleChange}
                placeholder="Describe the bug or issue to fix…" rows={4} />
            </div>
            <div className="form-group">
              <label>Max Retries</label>
              <input name="max_retries" type="number" min={0} max={5}
                value={form.max_retries} onChange={handleChange} style={{ width: 80 }} />
            </div>

            <button
              className="primary-button"
              style={{ width: "100%" }}
              onClick={startWorkflow}
              disabled={loading || !form.repository_path || !form.file_path || !form.problem}
            >
              {loading
                ? <><span className="spinner spinner-sm" /> Running pipeline…</>
                : <><Play size={15} /> Run Autonomous Fix</>}
            </button>
          </div>
        </div>

        {/* Right: results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Diff viewer */}
          {hasModifiedCode && (
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <RefreshCw size={14} color="var(--color-cyan)" /> Generated Fix
              </div>

              {hasDiff ? (
                <div className="diff-container">
                  <div>
                    <div className="diff-pane-label">Original</div>
                    <div className="code-block diff-removed" style={{ minHeight: 100, maxHeight: 280, overflowY: "auto" }}>
                      {result.original_code || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="diff-pane-label">Fixed</div>
                    <div className="code-block diff-added" style={{ minHeight: 100, maxHeight: 280, overflowY: "auto" }}>
                      {result.modified_code}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="code-file-header">
                  <span>{form.file_path}</span>
                  <span className="badge badge-success">Modified</span>
                </div>
              )}

              {hasDiff && (
                <pre className="code-block" style={{ marginTop: 12, maxHeight: 200 }}>
                  {result.diff || result.patch}
                </pre>
              )}

              {/* Validation */}
              {result.validation && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: result.validation.passed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.validation.passed ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: result.validation.passed ? "var(--color-green)" : "var(--color-red)" }}>
                    {result.validation.passed ? "✓ Validation passed" : "✗ Validation failed"}
                  </span>
                  {result.validation.message && (
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{result.validation.message}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approve */}
          {hasModifiedCode && !gitResult && (
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <GitBranch size={14} color="var(--color-purple)" /> Approve &amp; Commit
              </div>
              <div className="form-group">
                <label>Branch Name *</label>
                <input
                  value={approval.branch_name}
                  onChange={(e) => setApproval((p) => ({ ...p, branch_name: e.target.value }))}
                  placeholder="fix/my-bug-fix"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
              </div>
              <div className="form-group">
                <label>Commit Message</label>
                <input
                  value={approval.commit_message}
                  onChange={(e) => setApproval((p) => ({ ...p, commit_message: e.target.value }))}
                />
              </div>
              <button
                className="primary-button"
                style={{ width: "100%" }}
                onClick={approveAndCommit}
                disabled={approvalLoading || !approval.branch_name}
              >
                {approvalLoading
                  ? <><span className="spinner spinner-sm" /> Committing…</>
                  : <><CheckCircle2 size={15} /> Approve &amp; Commit</>}
              </button>
            </div>
          )}

          {/* Git result */}
          {gitResult && (
            <div className="card" style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.2)" }}>
              <div className="card-title" style={{ color: "var(--color-green)" }}>
                <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Committed to branch
              </div>
              <pre className="code-block" style={{ maxHeight: 160 }}>
                {JSON.stringify(gitResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Create PR */}
          {gitResult && !prResult && (
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <GitPullRequest size={14} color="var(--color-accent)" /> Create Pull Request
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Owner</label>
                  <input value={prForm.owner} onChange={(e) => setPrForm((p) => ({ ...p, owner: e.target.value }))} placeholder="github-username" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Repo Name</label>
                  <input value={prForm.repo_name} onChange={(e) => setPrForm((p) => ({ ...p, repo_name: e.target.value }))} placeholder="my-repo" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 10 }}>
                <label>Base Branch</label>
                <input value={prForm.base_branch} onChange={(e) => setPrForm((p) => ({ ...p, base_branch: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>PR Title (optional)</label>
                <input value={prForm.title} onChange={(e) => setPrForm((p) => ({ ...p, title: e.target.value }))} placeholder="fix: automatic fix by CodeAware AI" />
              </div>
              <button
                className="primary-button"
                style={{ width: "100%" }}
                onClick={submitPR}
                disabled={prLoading || !prForm.owner || !prForm.repo_name}
              >
                {prLoading
                  ? <><span className="spinner spinner-sm" /> Creating PR…</>
                  : <><GitPullRequest size={15} /> Create Pull Request</>}
              </button>
            </div>
          )}

          {/* PR success */}
          {prResult && (
            <div className="card" style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.2)" }}>
              <div className="card-title" style={{ color: "var(--color-accent)" }}>
                <GitPullRequest size={14} style={{ marginRight: 6 }} /> Pull Request Created
              </div>
              {prResult.pull_request_url && (
                <a href={prResult.pull_request_url} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-accent)", fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}>
                  {prResult.pull_request_url}
                  <ChevronRight size={13} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}