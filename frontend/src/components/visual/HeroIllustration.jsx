export default function HeroIllustration() {
  return (
    <div style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
      <svg
        viewBox="0 0 460 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="heroCardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="coreEngineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="230" cy="130" r="100" fill="#6366F1" fillOpacity="0.08" filter="url(#glowEffect)" />

        {/* Left: Repository Input Node */}
        <g transform="translate(20, 95)">
          <rect
            width="105"
            height="70"
            rx="10"
            fill="var(--bg-card)"
            stroke="var(--border-color)"
            strokeWidth="1.5"
          />
          <circle cx="25" cy="24" r="10" fill="#EEF2FF" />
          <path
            d="M21 24h8M25 20v8"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text x="42" y="27" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="sans-serif">
            Repository
          </text>
          <text x="25" y="48" fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace">
            git clone / files
          </text>
        </g>

        {/* Connecting Connector Line 1 */}
        <path
          d="M125 130 H165"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="165" cy="130" r="3" fill="#4F46E5" />

        {/* Center: CodeAware Intelligence Engine */}
        <g transform="translate(170, 45)">
          <rect
            width="135"
            height="170"
            rx="14"
            fill="var(--bg-card)"
            stroke="var(--primary-border)"
            strokeWidth="2"
          />
          {/* Header pill */}
          <rect x="15" y="14" width="105" height="24" rx="6" fill="url(#coreEngineGrad)" />
          <text x="67" y="29" fill="#FFFFFF" fontSize="10.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            CodeAware AI
          </text>

          {/* Engine Capability Pills */}
          <g transform="translate(12, 48)">
            <rect width="111" height="20" rx="4" fill="var(--bg-muted)" />
            <text x="10" y="14" fill="var(--text-secondary)" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              AST & Symbol Index
            </text>
          </g>

          <g transform="translate(12, 74)">
            <rect width="111" height="20" rx="4" fill="var(--bg-muted)" />
            <text x="10" y="14" fill="var(--text-secondary)" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              Topology Knowledge Graph
            </text>
          </g>

          <g transform="translate(12, 100)">
            <rect width="111" height="20" rx="4" fill="var(--bg-muted)" />
            <text x="10" y="14" fill="var(--text-secondary)" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              Hybrid Code Search & RAG
            </text>
          </g>

          <g transform="translate(12, 126)">
            <rect width="111" height="20" rx="4" fill="var(--bg-muted)" />
            <text x="10" y="14" fill="var(--text-secondary)" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              15 Specialist AI Agents
            </text>
          </g>
        </g>

        {/* Connecting Connector Lines to Outputs */}
        <path d="M305 85 C335 85, 335 60, 355 60" stroke="#10B981" strokeWidth="1.5" fill="none" />
        <path d="M305 130 H355" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
        <path d="M305 175 C335 175, 335 200, 355 200" stroke="#4F46E5" strokeWidth="1.5" fill="none" />

        {/* Right Node 1: Code Insights */}
        <g transform="translate(355, 35)">
          <rect width="90" height="48" rx="8" fill="var(--bg-card)" stroke="#A7F3D0" strokeWidth="1.5" />
          <circle cx="16" cy="24" r="6" fill="#ECFDF5" />
          <path d="M14 24l1.5 1.5L19 22" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
          <text x="30" y="22" fill="var(--text-main)" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">Insights</text>
          <text x="30" y="34" fill="var(--text-muted)" fontSize="8.5" fontFamily="sans-serif">Search & Graph</text>
        </g>

        {/* Right Node 2: Security & Risks */}
        <g transform="translate(355, 105)">
          <rect width="90" height="48" rx="8" fill="var(--bg-card)" stroke="#FDE68A" strokeWidth="1.5" />
          <circle cx="16" cy="24" r="6" fill="#FFFBEB" />
          <path d="M16 20v4M16 27h.01" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          <text x="30" y="22" fill="var(--text-main)" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">Risks</text>
          <text x="30" y="34" fill="var(--text-muted)" fontSize="8.5" fontFamily="sans-serif">OWASP & Impact</text>
        </g>

        {/* Right Node 3: Autonomous Fixes */}
        <g transform="translate(355, 175)">
          <rect width="90" height="48" rx="8" fill="var(--bg-card)" stroke="#C7D2FE" strokeWidth="1.5" />
          <circle cx="16" cy="24" r="6" fill="#EEF2FF" />
          <path d="M13 22l3 3 4-5" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
          <text x="30" y="22" fill="var(--text-main)" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">Fixes</text>
          <text x="30" y="34" fill="var(--text-muted)" fontSize="8.5" fontFamily="sans-serif">Safe Patches</text>
        </g>
      </svg>
    </div>
  );
}
