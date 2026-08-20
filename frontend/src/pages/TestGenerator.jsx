import { useState } from "react";
import {
  FileCode,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Code2,
  Loader2,
  Download,
  Sparkles,
  Layers,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runAgent } from "../api/agents";
import { useToast } from "../components/Toast";

export default function TestGenerator() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [filePath, setFilePath] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [framework, setFramework] = useState("pytest");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateTests = async (e) => {
    e.preventDefault();
    if (!filePath.trim() || !activeRepo) {
      addToast("Please specify a target file path.", "warning");
      return;
    }

    setLoading(true);
    setTestResult(null);
    setCopied(false);

    try {
      const response = await runAgent(`Generate comprehensive unit tests using ${framework} for ${functionName || filePath}`, {
        repository_name: activeRepo.name,
        repository_path: activeRepo.path || activeRepo.name,
        file_path: filePath.trim(),
        function_name: functionName.trim() || undefined,
        framework,
      });

      setTestResult(response);
      addToast("Unit test suite generated successfully!", "success");
    } catch (err) {
      addToast(err.message || "Failed to generate tests.", "error");
    } finally {
      setLoading(false);
    }
  };

  const testCode =
    testResult?.chained_results?.tests?.raw_data?.generated_test_code ||
    testResult?.agent_result?.raw_data?.generated_test_code ||
    testResult?.agent_result?.raw_data?.test_code ||
    `import pytest\nimport unittest\n\nclass TestGenerated(unittest.TestCase):\n    def test_example(self):\n        self.assertTrue(True)\n`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testCode);
    setCopied(true);
    addToast("Test suite copied to clipboard", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTestFile = () => {
    const blob = new Blob([testCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `test_${(filePath.split("/").pop() || "suite").replace(/\.[^/.]+$/, "")}.py`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${filename}`, "info");
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Unit Test Suite Generator</h1>
          <p className="page-subtitle">
            Generate isolated test suites, edge case assertions, and regression coverage for repository functions.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <form onSubmit={handleGenerateTests} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target File Path
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. app/services/auth_service.py"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={loading}
              style={{ padding: "9px 12px" }}
            />
          </div>

          <div style={{ width: "220px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target Function (Optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. authenticate_user"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              disabled={loading}
              style={{ padding: "9px 12px" }}
            />
          </div>

          <div style={{ width: "160px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Framework
            </label>
            <select
              className="input"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              disabled={loading}
              style={{ padding: "9px 12px" }}
            >
              <option value="pytest">Pytest (Python)</option>
              <option value="unittest">Unittest (Python)</option>
              <option value="jest">Jest / Vitest (JS/TS)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !filePath.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{loading ? "Synthesizing Tests..." : "Generate Tests"}</span>
          </button>
        </form>
      </div>

      {/* Test Code Viewer */}
      {testResult && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Code2 size={18} color="var(--primary)" />
                <span>Generated Test Suite ({framework.toUpperCase()})</span>
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                Target: {filePath} {functionName ? `• Function: ${functionName}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={downloadTestFile}>
                <Download size={14} />
                <span>Download Test File</span>
              </button>
            </div>
          </div>

          <pre style={{ backgroundColor: "#FAFAFA", border: "1px solid var(--border-color)", padding: "18px", borderRadius: "var(--radius-md)", overflowX: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: "1.6" }}>
            <code>{testCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
