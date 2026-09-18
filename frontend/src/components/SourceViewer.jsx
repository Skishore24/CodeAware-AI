import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, FileCode, AlertCircle, AlertTriangle, Crosshair, Eye } from "lucide-react";
import client from "../api/client";

/**
 * Professional Source Code Viewer for CodeAware AI
 * Features:
 * - Line numbers & active target line highlighting
 * - Auto-scroll to target line
 * - "Focused Issue Context" vs "Full File" toggle
 * - Copy snippet with toast feedback
 * - File header with symbol tags, issue indicators, and language badge
 * - Asynchronous file loading from backend or raw snippet rendering
 */
export default function SourceViewer({
  code,
  filePath,
  language = "plaintext",
  startLine = 1,
  targetLine,
  highlightLines = [],
  severity = "MEDIUM",
  issueMessage,
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
  const [viewMode, setViewMode] = useState("focus"); // 'focus' or 'full'

  const targetLineRef = useRef(null);
  const codeContainerRef = useRef(null);

  const effectiveTargetLine = targetLine ? Number(targetLine) : (highlightLines.length > 0 ? Number(highlightLines[0]) : null);

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

  // Auto-scroll to target line when loaded or changed
  useEffect(() => {
    if (effectiveTargetLine && targetLineRef.current) {
      targetLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [effectiveTargetLine, sourceCode, viewMode]);

  const handleCopy = () => {
    if (!sourceCode) return;
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJumpToTarget = () => {
    if (targetLineRef.current) {
      targetLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const allLines = sourceCode ? sourceCode.split("\n") : [];
  const totalLines = allLines.length;

  // Determine displayed lines based on viewMode
  let displayedLines = allLines;
  let effectiveStartLine = startLine;

  if (viewMode === "focus" && effectiveTargetLine && totalLines > 16) {
    const contextRadius = 7;
    const rawStartIdx = Math.max(0, effectiveTargetLine - 1 - contextRadius);
    const rawEndIdx = Math.min(totalLines, effectiveTargetLine + contextRadius);
    displayedLines = allLines.slice(rawStartIdx, rawEndIdx);
    effectiveStartLine = rawStartIdx + 1;
  }

  const isSevere = severity === "CRITICAL" || severity === "HIGH";
  const targetHighlightBg = isSevere ? "rgba(239, 68, 68, 0.22)" : "rgba(245, 158, 11, 0.20)";
  const targetBorderColor = isSevere ? "#EF4444" : "#F59E0B";
  const targetBadgeBg = isSevere ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)";
  const targetBadgeText = isSevere ? "#FCA5A5" : "#FDE68A";

  return (
    <div
      className="source-viewer-container"
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        backgroundColor: "#0B0F19",
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
          backgroundColor: "#161E2E",
          borderBottom: "1px solid #283548",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", flex: 1 }}>
          <FileCode size={15} color="#94A3B8" />
          <span
            style={{
              color: "#F1F5F9",
              fontWeight: 600,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
            title={filePath}
          >
            {filePath || "Source Code"}
          </span>

          {effectiveTargetLine && (
            <span
              style={{
                backgroundColor: targetBadgeBg,
                color: targetBadgeText,
                border: `1px solid ${targetBorderColor}`,
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertTriangle size={12} />
              Line {effectiveTargetLine}
            </span>
          )}

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
              backgroundColor: "#243247",
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

        {/* View Mode and Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {effectiveTargetLine && totalLines > 16 && (
            <button
              onClick={() => setViewMode(viewMode === "focus" ? "full" : "focus")}
              className="btn btn-ghost btn-sm"
              style={{
                padding: "3px 8px",
                fontSize: "11px",
                color: "#94A3B8",
                border: "1px solid #334155",
              }}
              title={viewMode === "focus" ? "Switch to full file view" : "Switch to focused error context"}
            >
              <Eye size={12} style={{ marginRight: "4px" }} />
              <span>{viewMode === "focus" ? `Show Full File (${totalLines} lines)` : `Focus Error (Line ${effectiveTargetLine})`}</span>
            </button>
          )}

          {effectiveTargetLine && viewMode === "full" && (
            <button
              onClick={handleJumpToTarget}
              className="btn btn-ghost btn-sm"
              style={{
                padding: "3px 8px",
                fontSize: "11px",
                color: targetBadgeText,
                border: `1px solid ${targetBorderColor}`,
              }}
              title={`Jump to line ${effectiveTargetLine}`}
            >
              <Crosshair size={12} style={{ marginRight: "4px" }} />
              <span>Jump to Line {effectiveTargetLine}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{
              padding: "4px 8px",
              fontSize: "11.5px",
              backgroundColor: "#243247",
              borderColor: "#374967",
              color: "#E2E8F0",
            }}
            title="Copy Code"
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
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
      ) : displayedLines.length === 0 ? (
        <div style={{ padding: "24px", color: "#64748B", textAlign: "center" }}>
          No code content available.
        </div>
      ) : (
        <div
          ref={codeContainerRef}
          style={{
            maxHeight,
            overflowY: "auto",
            overflowX: "auto",
            padding: "8px 0",
            lineHeight: "1.65",
          }}
        >
          {displayedLines.map((lineContent, idx) => {
            const lineNum = effectiveStartLine + idx;
            const isTargetLine = effectiveTargetLine === lineNum;
            const isHighlighted =
              isTargetLine ||
              highlightLines.includes(lineNum) ||
              (highlightLines.length === 2 &&
                lineNum >= highlightLines[0] &&
                lineNum <= highlightLines[1]);

            return (
              <div
                key={idx}
                ref={isTargetLine ? targetLineRef : null}
                onClick={() => onLineClick && onLineClick(lineNum, lineContent)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: isTargetLine
                    ? targetHighlightBg
                    : isHighlighted
                    ? "rgba(79, 70, 229, 0.22)"
                    : "transparent",
                  borderLeft: isTargetLine
                    ? `4px solid ${targetBorderColor}`
                    : isHighlighted
                    ? "4px solid #6366F1"
                    : "4px solid transparent",
                  cursor: onLineClick ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", padding: "1px 12px", alignItems: "center" }}>
                  {showLineNumbers && (
                    <span
                      style={{
                        width: "48px",
                        minWidth: "48px",
                        textAlign: "right",
                        paddingRight: "16px",
                        color: isTargetLine
                          ? targetBadgeText
                          : isHighlighted
                          ? "#A5B4FC"
                          : "#64748B",
                        userSelect: "none",
                        fontWeight: isTargetLine || isHighlighted ? 700 : 400,
                      }}
                    >
                      {lineNum}
                    </span>
                  )}
                  <span
                    style={{
                      whiteSpace: "pre",
                      color: isTargetLine ? "#FFF" : isHighlighted ? "#FFFFFF" : "#E2E8F0",
                      flex: 1,
                      fontWeight: isTargetLine ? 600 : 400,
                    }}
                  >
                    {lineContent || " "}
                  </span>
                </div>

                {/* Inline issue hint on target line */}
                {isTargetLine && issueMessage && (
                  <div
                    style={{
                      margin: "3px 12px 6px 64px",
                      padding: "4px 10px",
                      backgroundColor: targetBadgeBg,
                      border: `1px solid ${targetBorderColor}`,
                      borderRadius: "4px",
                      color: targetBadgeText,
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 500,
                    }}
                  >
                    <AlertCircle size={12} />
                    <span>Line {lineNum}: {issueMessage}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
