import React, { useState } from "react";
import { Copy, Check, FileDiff, CheckCircle2, XCircle } from "lucide-react";

/**
 * Professional Diff Viewer for CodeAware AI Autonomous Fix and Code Review.
 * Renders unified diff blocks with syntax line styling, added/removed badges,
 * risk assessment rating, and optional patch approval buttons.
 */
export default function DiffViewer({
  diff,
  originalCode,
  patchedCode,
  filePath = "code.py",
  riskLevel = "LOW",
  syntaxValid = true,
  onApprove,
  onReject,
  applying = false,
  applied = false,
  showActions = true,
}) {
  const [copied, setCopied] = useState(false);

  // If a unified diff string is not provided, generate a basic unified representation
  let diffLines = [];
  if (diff && typeof diff === "string") {
    diffLines = diff.split("\n");
  } else if (originalCode && patchedCode) {
    const origLines = originalCode.split("\n");
    const patchLines = patchedCode.split("\n");
    diffLines.push(`--- a/${filePath}`);
    diffLines.push(`+++ b/${filePath}`);
    origLines.forEach((l) => diffLines.push(`-${l}`));
    patchLines.forEach((l) => diffLines.push(`+${l}`));
  }

  const addedCount = diffLines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const removedCount = diffLines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  const copyDiff = () => {
    const text = diff || (patchedCode || "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
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
      {/* Diff Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: "#1E293B",
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileDiff size={16} color="#60A5FA" />
          <span style={{ fontWeight: 600, color: "#F1F5F9" }}>{filePath}</span>
          <div style={{ display: "flex", gap: "6px", fontSize: "11px" }}>
            <span style={{ color: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
              +{addedCount}
            </span>
            <span style={{ color: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
              -{removedCount}
            </span>
          </div>
          {syntaxValid && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              <ShieldCheck size={12} /> Syntax Validated
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: riskLevel === "HIGH" || riskLevel === "CRITICAL" ? "rgba(239, 68, 68, 0.2)" : riskLevel === "MEDIUM" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
              color: riskLevel === "HIGH" || riskLevel === "CRITICAL" ? "#FCA5A5" : riskLevel === "MEDIUM" ? "#FDE68A" : "#A7F3D0",
            }}
          >
            Risk: {riskLevel}
          </span>
          <button
            onClick={copyDiff}
            className="btn btn-secondary btn-sm"
            style={{
              padding: "4px 8px",
              fontSize: "11.5px",
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#E2E8F0",
            }}
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy Diff"}</span>
          </button>
        </div>
      </div>

      {/* Unified Diff Content */}
      <div
        style={{
          maxHeight: "420px",
          overflowY: "auto",
          overflowX: "auto",
          padding: "10px 0",
          lineHeight: "1.55",
        }}
      >
        {diffLines.length === 0 ? (
          <div style={{ padding: "20px", color: "#64748B", textAlign: "center" }}>
            No differences detected.
          </div>
        ) : (
          diffLines.map((line, idx) => {
            const isAdded = line.startsWith("+") && !line.startsWith("+++");
            const isRemoved = line.startsWith("-") && !line.startsWith("---");
            const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

            let bg = "transparent";
            let color = "#E2E8F0";

            if (isAdded) {
              bg = "rgba(16, 185, 129, 0.16)";
              color = "#34D399";
            } else if (isRemoved) {
              bg = "rgba(239, 68, 68, 0.16)";
              color = "#F87171";
            } else if (isHeader) {
              bg = "rgba(99, 102, 241, 0.12)";
              color = "#818CF8";
            }

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  padding: "0 14px",
                  backgroundColor: bg,
                  whiteSpace: "pre",
                  color: color,
                }}
              >
                <span
                  style={{
                    width: "36px",
                    minWidth: "36px",
                    textAlign: "right",
                    paddingRight: "12px",
                    color: "#475569",
                    userSelect: "none",
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ flex: 1 }}>{line || " "}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Approval Action Bar */}
      {showActions && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            backgroundColor: "#1E293B",
            borderTop: "1px solid #334155",
          }}
        >
          {applied ? (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10B981", fontWeight: 600, fontSize: "13px" }}>
              <CheckCircle2 size={16} /> Patch Applied Successfully
            </span>
          ) : (
            <>
              {onReject && (
                <button
                  onClick={onReject}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: "#334155", borderColor: "#475569", color: "#E2E8F0" }}
                >
                  <XCircle size={14} />
                  <span>Reject Patch</span>
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  disabled={applying}
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>{applying ? "Applying Patch..." : "Approve & Apply Patch"}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
