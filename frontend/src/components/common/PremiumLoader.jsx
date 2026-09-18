import { useState, useEffect } from "react";
import { Layers, Sparkles, Cpu, CheckCircle2 } from "lucide-react";

/**
 * PremiumLoader
 * State-of-the-art orbital loading animation with glowing multi-tier rings,
 * pulsing core, holographic telemetry steps, and smooth ambient backdrops.
 */
export default function PremiumLoader({
  size = "md", // 'sm' | 'md' | 'lg' | 'fullscreen' | 'inline'
  title = "Analyzing Codebase",
  subtitle = "Synthesizing AST symbol graph & validating security runtime...",
  steps = [],
  progress = null, // number 0-100 or null for indeterminate
  icon: CustomIcon = Layers,
  style = {},
}) {
  const [internalProgress, setInternalProgress] = useState(12);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (progress !== null) return;
    const pTimer = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 94) return 94;
        return prev + Math.floor(Math.random() * 8) + 3;
      });
    }, 450);

    return () => clearInterval(pTimer);
  }, [progress]);

  useEffect(() => {
    if (!steps || steps.length === 0) return;
    const sTimer = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % steps.length);
    }, 2200);

    return () => clearInterval(sTimer);
  }, [steps]);

  const activeProgress = progress !== null ? progress : internalProgress;

  // Compact / Button size
  if (size === "sm") {
    return (
      <div className="orbital-loader-container sm" style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: "8px", ...style }}>
        <div style={{ position: "relative", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--primary)",
              borderRightColor: "var(--purple)",
              animation: "rotateClockwise 0.8s linear infinite",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 6px var(--primary)",
            }}
          />
        </div>
        {title && <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>{title}</span>}
      </div>
    );
  }

  // Dimension scaling
  const dimensions = {
    md: { outer: 72, middle: 58, core: 40, iconSize: 20 },
    lg: { outer: 108, middle: 88, core: 56, iconSize: 28 },
    inline: { outer: 92, middle: 74, core: 48, iconSize: 24 },
    fullscreen: { outer: 116, middle: 94, core: 60, iconSize: 30 },
  };

  const dim = dimensions[size] || dimensions.md;
  const isFullScreen = size === "fullscreen";
  const isInline = size === "inline";

  return (
    <div
      className={`orbital-loader-container ${size}`}
      style={{
        width: isFullScreen ? "100vw" : isInline ? "100%" : "auto",
        height: isFullScreen ? "100vh" : isInline ? "100%" : "auto",
        minHeight: isInline ? "360px" : undefined,
        position: isFullScreen ? "fixed" : "relative",
        inset: isFullScreen ? 0 : undefined,
        zIndex: isFullScreen ? 9999 : 1,
        backgroundColor: isFullScreen ? "rgba(10, 15, 29, 0.88)" : "transparent",
        backdropFilter: isFullScreen ? "blur(20px)" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        ...style,
      }}
    >
      {/* Ambient Neon Atmosphere */}
      <div
        style={{
          position: "absolute",
          width: `${dim.outer * 2.5}px`,
          height: `${dim.outer * 2.5}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "pulseGlow 3s ease-in-out infinite alternate",
        }}
      />

      {/* Gyroscopic Orbital Rings & Core */}
      <div
        className="orbital-gyro-stage"
        style={{
          width: `${dim.outer}px`,
          height: `${dim.outer}px`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        {/* Outer Tech Ring */}
        <div
          className="orbital-ring orbital-ring-1"
          style={{
            width: `${dim.outer}px`,
            height: `${dim.outer}px`,
          }}
        >
          <div className="orbital-beacon" />
        </div>

        {/* Middle Dashed Ring (Counter-rotating) */}
        <div
          className="orbital-ring orbital-ring-2"
          style={{
            width: `${dim.middle}px`,
            height: `${dim.middle}px`,
          }}
        />

        {/* Inner Glowing Accent Ring */}
        <div
          className="orbital-ring orbital-ring-3"
          style={{
            width: `${dim.middle - 14}px`,
            height: `${dim.middle - 14}px`,
          }}
        />

        {/* Pulsing Core Orb */}
        <div
          className="orbital-core-orb"
          style={{
            width: `${dim.core}px`,
            height: `${dim.core}px`,
          }}
        >
          <CustomIcon size={dim.iconSize} />
        </div>

        {/* Satellite Sparkles */}
        <div
          style={{
            position: "absolute",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--primary-border)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
            animation: "orbitSat1 5s linear infinite",
          }}
        >
          <Sparkles size={8} />
        </div>
        <div
          style={{
            position: "absolute",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--purple)",
            color: "var(--purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 8px rgba(139, 92, 246, 0.4)",
            animation: "orbitSat2 5s linear infinite",
          }}
        >
          <Cpu size={7} />
        </div>
      </div>

      {/* High-Tech Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--primary-light)",
          border: "1px solid var(--primary-border)",
          color: "var(--primary)",
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            boxShadow: "0 0 6px var(--primary)",
            animation: "pulseDot 1.2s ease-in-out infinite",
          }}
        />
        <span>AI Engine Processing</span>
      </div>

      {/* Header Info */}
      <h3
        style={{
          fontSize: size === "lg" || isFullScreen ? "18px" : "15px",
          fontWeight: 800,
          color: "var(--text-main)",
          letterSpacing: "-0.01em",
          margin: 0,
          textAlign: "center",
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          style={{
            fontSize: "12.5px",
            color: "var(--text-secondary)",
            margin: "4px 0 16px",
            textAlign: "center",
            maxWidth: "380px",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Shimmer Progress Track */}
      <div style={{ width: "100%", maxWidth: "340px", margin: "4px 0 14px" }}>
        <div
          style={{
            width: "100%",
            height: "5px",
            backgroundColor: "var(--bg-muted)",
            borderRadius: "var(--radius-full)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${activeProgress}%`,
              height: "100%",
              background: "var(--primary-gradient)",
              borderRadius: "var(--radius-full)",
              transition: "width 0.35s ease",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)",
                animation: "progressShimmer 1.5s infinite",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
            SYNTHESIS TELEMETRY
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {activeProgress}%
          </span>
        </div>
      </div>

      {/* Dynamic Telemetry Steps */}
      {steps && steps.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            backgroundColor: "var(--bg-card)",
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          {steps.map((s, idx) => {
            const isCurrent = idx === currentStepIdx;
            const isDone = idx < currentStepIdx;
            const StepIcon = s.icon || CheckCircle2;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  color: isCurrent ? "var(--primary)" : isDone ? "var(--success)" : "var(--text-muted)",
                  fontWeight: isCurrent ? 700 : 500,
                  transition: "all 0.2s ease",
                }}
              >
                <StepIcon size={12} />
                <span>{s.label || s}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
