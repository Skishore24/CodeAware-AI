import React, { useState, useEffect } from "react";
import { Copy, Check, FileCode, AlertCircle } from "lucide-react";
import client from "../api/client";

/**
 * Professional Source Code Viewer for CodeAware AI
 * Features:
 * - Line numbers & line-range highlighting
 * - Copy snippet with toast feedback
 * - File header with symbol tags and language badge
 * - Asynchronous file loading from backend or raw snippet rendering
 */
export default function SourceViewer({
  code,
  filePath,
  language = "plaintext",
  startLine = 1,
  highlightLines = [],
  symbol,
  repositoryName,
  repositoryPath,
  maxHeight = "480px",
  showLineNumbers = true,
  onLineClick,
}) {
  const [copied, setCopied] = useState(false);
  const [sourceCode, setSourceCode] = useState(code || "");
  const [resolvedLanguage, setResolvedLanguage] = useState(language);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // If code is not passed directly, but repository & filePath are provided, fetch file content
  useEffect(() => {
    if (code) {
      setSourceCode(code);
      setResolvedLanguage(language);
      return;
    }

    if ((repositoryName || repositoryPath) && filePath) {
      let isMounted = true;
      setLoading(true);
      setLoadError(null);

      client
        .post("/repositories/file-content", {
          repository_name: repositoryName,
          repository_path: repositoryPath,
          file_path: filePath,
        })
        .then((res) => {
          if (isMounted && res?.content) {
            setSourceCode(res.content);
            setResolvedLanguage(res.language || language);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setLoadError(err.message || "Failed to load source file.");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [code, filePath, repositoryName, repositoryPath, language]);

  const handleCopy = () => {
    if (!sourceCode) return;
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = sourceCode ? sourceCode.split("\n") : [];

  return (
    <div
      className="source-viewer-container"
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        backgroundColor: "#0F172A",
        color: "#F8FAFC",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12.5px",
      }}
    >
      {/* File Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          backgroundColor: "#1E293B",
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          <FileCode size={15} color="#94A3B8" />
          <span
            style={{
              color: "#F1F5F9",
              fontWeight: 600,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {filePath || "Source Code"}
          </span>
          {symbol && (
            <span
              style={{
                backgroundColor: "rgba(79, 70, 229, 0.35)",
                color: "#C7D2FE",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                padding: "1px 7px",
                borderRadius: "4px",
                fontSize: "11px",
              }}
            >
              {symbol}
            </span>
          )}
          <span
            style={{
              backgroundColor: "#334155",
              color: "#94A3B8",
              padding: "1px 6px",
              borderRadius: "4px",
              fontSize: "10.5px",
              textTransform: "uppercase",
            }}
          >
            {resolvedLanguage}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-secondary btn-sm"
          style={{
            padding: "4px 8px",
            fontSize: "11.5px",
            backgroundColor: "#334155",
            borderColor: "#475569",
            color: "#E2E8F0",
          }}
          title="Copy Code"
        >
          {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Body */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
          Loading file content...
        </div>
      ) : loadError ? (
        <div style={{ padding: "24px", color: "#F87171", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      ) : lines.length === 0 ? (
        <div style={{ padding: "24px", color: "#64748B", textAlign: "center" }}>
          No code content available.
        </div>
      ) : (
        <div
          style={{
            maxHeight,
            overflowY: "auto",
            overflowX: "auto",
            padding: "8px 0",
            lineHeight: "1.6",
          }}
        >
          {lines.map((lineContent, idx) => {
            const lineNum = startLine + idx;
            const isHighlighted =
              highlightLines.includes(lineNum) ||
              (highlightLines.length === 2 &&
                lineNum >= highlightLines[0] &&
                lineNum <= highlightLines[1]);

            return (
              <div
                key={idx}
                onClick={() => onLineClick && onLineClick(lineNum, lineContent)}
                style={{
                  display: "flex",
                  padding: "0 12px",
                  backgroundColor: isHighlighted ? "rgba(79, 70, 229, 0.22)" : "transparent",
                  borderLeft: isHighlighted ? "3px solid #6366F1" : "3px solid transparent",
                  cursor: onLineClick ? "pointer" : "default",
                }}
              >
                {showLineNumbers && (
                  <span
                    style={{
                      width: "42px",
                      minWidth: "42px",
                      textAlign: "right",
                      paddingRight: "14px",
                      color: isHighlighted ? "#A5B4FC" : "#64748B",
                      userSelect: "none",
                      fontWeight: isHighlighted ? 600 : 400,
                    }}
                  >
                    {lineNum}
                  </span>
                )}
                <span
                  style={{
                    whiteSpace: "pre",
                    color: isHighlighted ? "#FFFFFF" : "#E2E8F0",
                    flex: 1,
                  }}
                >
                  {lineContent || " "}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
