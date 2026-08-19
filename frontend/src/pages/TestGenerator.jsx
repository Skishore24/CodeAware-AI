import { useState } from "react";
import {
  FileCode,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Code2,
  Loader2,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";
import { runAgent } from "../api/agents";
import { useToast } from "../components/Toast";

export default function TestGenerator() {
  const { activeRepo } = useRepo();
  const { addToast } = useToast();

  const [filePath, setFilePath] = useState("");
  const [functionName, setFunctionName] = useState("");
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
      const response = await runAgent(`Generate unit tests for ${functionName || filePath}`, {
        repository_name: activeRepo.name,
        repository_path: activeRepo.path || activeRepo.name,
        file_path: filePath.trim(),
        function_name: functionName.trim() || undefined,
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
    `import unittest\n\nclass TestGenerated(unittest.TestCase):\n    def test_example(self):\n        self.assertTrue(True)\n`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testCode);
    setCopied(true);
    addToast("Test code copied to clipboard.", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Unit Test Generator</h1>
          <p className="page-subtitle">
            Generate isolated test suites, edge case assertions, and regression coverage for repository functions.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <form onSubmit={handleGenerateTests} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target File Path
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. app/services/auth_service.py"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ width: "240px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
              Target Function (Optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. authenticate_user"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !filePath.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{loading ? "Generating Tests..." : "Generate Tests"}</span>
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
                <span>Generated Test Suite</span>
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Target: {filePath}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          <pre style={{ backgroundColor: "#FAFAFA", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "var(--radius-md)", overflowX: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: "1.6" }}>
            <code>{testCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
