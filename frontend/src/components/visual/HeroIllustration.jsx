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
          <style>{`
            .hero-node {
              cursor: pointer;
              transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
            }
            .hero-node:hover {
              transform: translateY(-3px);
            }
            .hero-node rect.card-bg {
              transition: stroke 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease, fill 0.25s ease;
            }
            .hero-node-repo:hover rect.card-bg {
              stroke: var(--primary);
              stroke-width: 2px;
              filter: drop-shadow(0 6px 16px rgba(99, 102, 241, 0.22));
            }
            .hero-node-center:hover rect.card-bg {
              stroke: var(--primary);
              stroke-width: 2px;
              filter: drop-shadow(0 8px 24px rgba(99, 102, 241, 0.24));
            }
            .hero-node-insights:hover rect.card-bg {
              stroke: var(--success);
              stroke-width: 2px;
              filter: drop-shadow(0 6px 16px rgba(16, 185, 129, 0.24));
            }
            .hero-node-risks:hover rect.card-bg {
              stroke: var(--warning);
              stroke-width: 2px;
              filter: drop-shadow(0 6px 16px rgba(245, 158, 11, 0.24));
            }
            .hero-node-fixes:hover rect.card-bg {
              stroke: var(--primary);
              stroke-width: 2px;
              filter: drop-shadow(0 6px 16px rgba(79, 70, 229, 0.24));
            }

            .hero-icon-bubble {
              transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
              transform-origin: 18px 25px;
            }
            .hero-node:hover .hero-icon-bubble {
              transform: scale(1.14);
            }

            .cap-item {
              cursor: pointer;
              transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .cap-item rect {
              transition: fill 0.2s ease, stroke 0.2s ease;
            }
            .cap-item text {
              transition: fill 0.2s ease, font-weight 0.2s ease;
            }
            .cap-item:hover {
              transform: translateX(4px);
            }
            .cap-item:hover rect {
              fill: var(--primary-light);
              stroke: var(--primary-border);
              stroke-width: 1px;
            }
            .cap-item:hover text {
              fill: var(--primary-text);
              font-weight: 700;
            }

            .stream-line {
              stroke-dasharray: 6 5;
              animation: streamDash 1.2s linear infinite;
            }
            @keyframes streamDash {
              to {
                stroke-dashoffset: -22;
              }
            }

            .port-dot {
              transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
              cursor: pointer;
            }
            .port-dot:hover {
              transform: scale(1.5);
            }

            .ambient-pulse {
              animation: breatheGlow 4.5s ease-in-out infinite alternate;
              transform-origin: 255px 140px;
            }
            @keyframes breatheGlow {
              0% {
                transform: scale(0.96);
                opacity: 0.6;
              }
              100% {
                transform: scale(1.06);
                opacity: 0.95;
              }
            }
          `}</style>

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
        <circle className="ambient-pulse" cx="255" cy="140" r="120" fill="#6366F1" fillOpacity="0.08" filter="url(#glowEffect)" />

        {/* Left: Repository Input Node */}
        <g transform="translate(17, 115)">
          <g className="hero-node hero-node-repo">
            <rect
              className="card-bg"
              width="128"
              height="50"
              rx="10"
              fill="var(--bg-card)"
              stroke="#C7D2FE"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 6px rgba(79, 70, 229, 0.08))" }}
            />
            <g className="hero-icon-bubble">
              <circle cx="18" cy="25" r="8" fill="#EEF2FF" />
              <path
                d="M15 25h6M18 22v6"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
              Repository
            </text>
            <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
              git clone / files
            </text>
          </g>
        </g>

        {/* Center: CodeAware Intelligence Engine */}
        <g transform="translate(165, 35)">
          <g className="hero-node hero-node-center">
            <rect
              className="card-bg"
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
              <g className="cap-item">
                <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
                <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
                  AST & Symbol Index
                </text>
              </g>
            </g>

            {/* Capability 2: Knowledge Graph */}
            <g transform="translate(14, 86)">
              <g className="cap-item">
                <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
                <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
                  Topology Knowledge Graph
                </text>
              </g>
            </g>

            {/* Capability 3: Code Search & RAG */}
            <g transform="translate(14, 120)">
              <g className="cap-item">
                <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
                <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
                  Hybrid Code Search & RAG
                </text>
              </g>
            </g>

            {/* Capability 4: Specialist AI Agents */}
            <g transform="translate(14, 154)">
              <g className="cap-item">
                <rect width="147" height="26" rx="6" fill="var(--bg-muted)" />
                <text x="12" y="17" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">
                  15 Specialist AI Agents
                </text>
              </g>
            </g>
          </g>
        </g>

        {/* Right Output 1: Code Insights */}
        <g transform="translate(395, 33)">
          <g className="hero-node hero-node-insights">
            <rect
              className="card-bg"
              width="128"
              height="50"
              rx="10"
              fill="var(--bg-card)"
              stroke="#A7F3D0"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 6px rgba(16, 185, 129, 0.08))" }}
            />
            <g className="hero-icon-bubble">
              <circle cx="18" cy="25" r="8" fill="#ECFDF5" />
              <path d="M15 25l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
              Insights
            </text>
            <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
              Search & Graph
            </text>
          </g>
        </g>

        {/* Right Output 2: Security & Risks */}
        <g transform="translate(395, 115)">
          <g className="hero-node hero-node-risks">
            <rect
              className="card-bg"
              width="128"
              height="50"
              rx="10"
              fill="var(--bg-card)"
              stroke="#FDE68A"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 6px rgba(245, 158, 11, 0.08))" }}
            />
            <g className="hero-icon-bubble">
              <circle cx="18" cy="25" r="8" fill="#FFFBEB" />
              <path d="M18 20v5M18 28h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </g>
            <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
              Risks
            </text>
            <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
              OWASP & Impact
            </text>
          </g>
        </g>

        {/* Right Output 3: Autonomous Fixes */}
        <g transform="translate(395, 197)">
          <g className="hero-node hero-node-fixes">
            <rect
              className="card-bg"
              width="128"
              height="50"
              rx="10"
              fill="var(--bg-card)"
              stroke="#C7D2FE"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 6px rgba(79, 70, 229, 0.08))" }}
            />
            <g className="hero-icon-bubble">
              <circle cx="18" cy="25" r="8" fill="#EEF2FF" />
              <path d="M14 24l3 3 5-5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x="34" y="23" fill="var(--text-main)" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
              Fixes
            </text>
            <text x="34" y="37" fill="var(--text-muted)" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
              Safe Patches
            </text>
          </g>
        </g>

        {/* Left Connector Line (Repo -> Engine) & Port Dots */}
        <path
          className="stream-line"
          d="M145 140 H165"
          stroke="#4F46E5"
          strokeWidth="2"
        />
        <circle className="port-dot" cx="145" cy="140" r="3.5" fill="#4F46E5" style={{ transformOrigin: "145px 140px" }} />
        <circle className="port-dot" cx="165" cy="140" r="3.5" fill="#4F46E5" style={{ transformOrigin: "165px 140px" }} />

        {/* Connecting Curves to Right Output Cards & Port Dots */}
        <path d="M340 58 C365 58, 370 58, 395 58" stroke="#10B981" strokeWidth="2" fill="none" />
        <path d="M340 140 H395" stroke="#F59E0B" strokeWidth="2" fill="none" />
        <path d="M340 222 C365 222, 370 222, 395 222" stroke="#4F46E5" strokeWidth="2" fill="none" />

        <circle className="port-dot" cx="340" cy="58" r="3.5" fill="#10B981" style={{ transformOrigin: "340px 58px" }} />
        <circle className="port-dot" cx="340" cy="140" r="3.5" fill="#F59E0B" style={{ transformOrigin: "340px 140px" }} />
        <circle className="port-dot" cx="340" cy="222" r="3.5" fill="#4F46E5" style={{ transformOrigin: "340px 222px" }} />
        <circle className="port-dot" cx="395" cy="58" r="3.5" fill="#10B981" style={{ transformOrigin: "395px 58px" }} />
        <circle className="port-dot" cx="395" cy="140" r="3.5" fill="#F59E0B" style={{ transformOrigin: "395px 140px" }} />
        <circle className="port-dot" cx="395" cy="222" r="3.5" fill="#4F46E5" style={{ transformOrigin: "395px 222px" }} />
      </svg>
    </div>
  );
}
