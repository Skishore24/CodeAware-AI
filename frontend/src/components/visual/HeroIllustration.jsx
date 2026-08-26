export default function HeroIllustration() {
  return (
    <div style={{ width: "100%", maxWidth: "540px", margin: "0 auto" }}>
      <svg
        viewBox="0 0 540 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="heroCardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="coreEngineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Backdrop Glow */}
        <circle cx="255" cy="140" r="120" fill="#6366F1" fillOpacity="0.07" filter="url(#glowEffect)" />

        {/* Left: Repository Input Node */}
        <g transform="translate(15, 105)">
          <rect
            width="115"
            height="70"
            rx="12"
            fill="var(--bg-card)"
            stroke="var(--border-color)"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.04))" }}
          />
          <circle cx="26" cy="25" r="11" fill="#EEF2FF" />
          <path
            d="M22 25h8M26 21v8"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text x="44" y="29" fill="var(--text-main)" fontSize="12" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
            Repository
          </text>
          <text x="20" y="50" fill="var(--text-muted)" fontSize="10" fontFamily="'JetBrains Mono', monospace">
            git clone / files
          </text>
        </g>

        {/* Left Connector Line (Repo -> Engine) */}
        <path
          d="M130 140 H165"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="165" cy="140" r="3.5" fill="#4F46E5" />

        {/* Center: CodeAware Intelligence Engine */}
        <g transform="translate(165, 35)">
          <rect
            width="175"
            height="210"
            rx="16"
            fill="var(--bg-card)"
            stroke="var(--primary-border)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 4px 20px rgba(99, 102, 241, 0.1))" }}
          />

          {/* Engine Header Badge */}
          <rect x="15" y="14" width="145" height="28" rx="8" fill="url(#coreEngineGrad)" />
          <text x="87" y="32" fill="#FFFFFF" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.02em">
            CodeAware AI
          </text>

          {/* Capability 1: AST Index */}
          <g transform="translate(14, 52)">
            <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
            <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
              AST & Symbol Index
            </text>
          </g>

          {/* Capability 2: Knowledge Graph */}
          <g transform="translate(14, 86)">
            <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
            <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
              Topology Knowledge Graph
            </text>
          </g>

          {/* Capability 3: Code Search & RAG */}
          <g transform="translate(14, 120)">
            <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
            <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
              Hybrid Code Search & RAG
            </text>
          </g>

          {/* Capability 4: Specialist AI Agents */}
          <g transform="translate(14, 154)">
            <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
            <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
              15 Specialist AI Agents
            </text>
          </g>
        </g>

        {/* Right Output Connector Ports on Center Card */}
        <circle cx="340" cy="58" r="3.5" fill="#10B981" />
        <circle cx="340" cy="140" r="3.5" fill="#F59E0B" />
        <circle cx="340" cy="222" r="3.5" fill="#4F46E5" />

        {/* Connecting Curves to Right Output Cards */}
        <path d="M340 58 C365 58, 370 58, 395 58" stroke="#10B981" strokeWidth="2" fill="none" />
        <path d="M340 140 H395" stroke="#F59E0B" strokeWidth="2" fill="none" />
        <path d="M340 222 C365 222, 370 222, 395 222" stroke="#4F46E5" strokeWidth="2" fill="none" />

        {/* Right Output 1: Code Insights */}
        <g transform="translate(395, 33)">
          <rect
            width="128"
            height="50"
            rx="10"
            fill="var(--bg-card)"
            stroke="#A7F3D0"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 2px 6px rgba(16, 185, 129, 0.08))" }}
          />
          <circle cx="18" cy="25" r="8" fill="#ECFDF5" />
          <path d="M15 25l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
            Insights
          </text>
          <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
            Search & Graph
          </text>
        </g>

        {/* Right Output 2: Security & Risks */}
        <g transform="translate(395, 115)">
          <rect
            width="128"
            height="50"
            rx="10"
            fill="var(--bg-card)"
            stroke="#FDE68A"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 2px 6px rgba(245, 158, 11, 0.08))" }}
          />
          <circle cx="18" cy="25" r="8" fill="#FFFBEB" />
          <path d="M18 20v5M18 28h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
            Risks
          </text>
          <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
            OWASP & Impact
          </text>
        </g>

        {/* Right Output 3: Autonomous Fixes */}
        <g transform="translate(395, 197)">
          <rect
            width="128"
            height="50"
            rx="10"
            fill="var(--bg-card)"
            stroke="#C7D2FE"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 2px 6px rgba(79, 70, 229, 0.08))" }}
          />
          <circle cx="18" cy="25" r="8" fill="#EEF2FF" />
          <path d="M14 24l3 3 5-5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
            Fixes
          </text>
          <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
            Safe Patches
          </text>
        </g>
      </svg>
    </div>
  );
}
