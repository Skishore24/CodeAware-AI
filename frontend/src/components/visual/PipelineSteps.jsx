import { GitFork, Layers, Bot, Wrench, Search, ShieldCheck } from "lucide-react";

export default function PipelineSteps() {
  const steps = [
    {
      num: "01 — Connect",
      title: "Connect Repository",
      desc: "Provide any public or private GitHub repository URL or select an existing local codebase.",
      icon: GitFork,
      color: "var(--primary)",
      bg: "var(--primary-light)",
    },
    {
      num: "02 — Index",
      title: "AST & Symbol Scan",
      desc: "CodeAware maps every file, class, function, parameter, and cross-file import into a searchable symbol index.",
      icon: Layers,
      color: "var(--info)",
      bg: "var(--info-light)",
    },
    {
      num: "03 — Understand",
      title: "Multi-Agent Intelligence",
      desc: "Specialist AI agents construct topological graphs, detect OWASP vulnerabilities, and evaluate code quality.",
      icon: Bot,
      color: "var(--purple)",
      bg: "var(--purple-light)",
    },
    {
      num: "04 — Act",
      title: "Search, Fix & Test",
      desc: "Ask natural language questions, calculate impact blast radius, and generate safe, validated patches.",
      icon: Wrench,
      color: "var(--success)",
      bg: "var(--success-light)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
          How CodeAware Works
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
          From raw code to actionable intelligence in four deterministic stages.
        </p>
      </div>

      <div className="pipeline-steps">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="step-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span className="step-num">{s.num}</span>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: s.bg,
                    color: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={14} />
                </div>
              </div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
