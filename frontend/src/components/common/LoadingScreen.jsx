import { useState, useEffect } from "react";
import { Layers, Sparkles, ShieldCheck, Cpu, GitGraph } from "lucide-react";

export default function LoadingScreen({
  message = "Initializing Code Intelligence",
  subtitle = "Synthesizing AST symbol graph & validating security runtime...",
  fullScreen = true,
  steps = [
    { label: "Verifying Authentication & Session", icon: ShieldCheck },
    { label: "Indexing AST Symbols & References", icon: Cpu },
    { label: "Connecting Multi-Agent Graph Engine", icon: GitGraph },
  ],
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  return (
    <div className={`premium-loading-wrapper ${fullScreen ? "fullscreen" : "inline"}`}>
      {/* Background ambient lighting */}
      <div className="premium-loading-glow glow-top" />
      <div className="premium-loading-glow glow-bottom" />

      <div className="premium-loading-card">
        {/* Animated Brand Core with Orbiting Rings */}
        <div className="premium-loading-logo-box">
          <div className="premium-loading-pulse-ring ring-outer" />
          <div className="premium-loading-pulse-ring ring-middle" />
          <div className="premium-loading-core-orb">
            <Layers size={32} className="premium-loading-icon" />
          </div>
          <div className="premium-loading-satellite sat-1">
            <Sparkles size={11} />
          </div>
          <div className="premium-loading-satellite sat-2">
            <Cpu size={11} />
          </div>
        </div>

        {/* Title and Message */}
        <div className="premium-loading-header">
          <div className="premium-loading-badge">
            <span className="premium-loading-dot" />
            <span>CodeAware Engine</span>
          </div>
          <h2 className="premium-loading-title">{message}</h2>
          <p className="premium-loading-subtitle">{subtitle}</p>
        </div>

        {/* Progress Bar with Shimmer */}
        <div className="premium-loading-progress-container">
          <div className="premium-loading-progress-track">
            <div
              className="premium-loading-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="premium-loading-progress-shimmer" />
            </div>
          </div>
          <div className="premium-loading-progress-meta">
            <span>Loading workspace assets</span>
            <span className="premium-loading-percentage">{progress}%</span>
          </div>
        </div>

        {/* Dynamic Micro Step Indicator */}
        {steps.length > 0 && (
          <div className="premium-loading-steps">
            {steps.map((step, idx) => {
              const Icon = step.icon || Cpu;
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <div
                  key={idx}
                  className={`premium-loading-step-item ${isActive ? "active" : ""} ${isPast ? "done" : ""}`}
                >
                  <div className="premium-loading-step-icon">
                    <Icon size={12} />
                  </div>
                  <span className="premium-loading-step-text">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
