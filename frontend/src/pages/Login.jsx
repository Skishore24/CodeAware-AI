import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  KeyRound,
  FolderGit2,
  Search,
  GitGraph,
  Bot,
  Zap,
  Code2,
  ShieldAlert,
  Wrench,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isInitializing } = useAuth();
  const { addToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("alex.morgan@codeaware.ai");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [role, setRole] = useState("Lead Engineer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast("Please fill in your email and password.", "warning");
      return;
    }

    if (isRegister && !name.trim()) {
      addToast("Please enter your full name.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await register(name.trim(), email.trim(), password, role);
        if (res.success) {
          addToast(`Account created for ${name}! Welcome to CodeAware AI.`, "success");
          navigate("/", { replace: true });
        } else {
          addToast(res.error || "Registration failed.", "error");
        }
      } else {
        const res = await login(email.trim(), password);
        if (res.success) {
          addToast(`Welcome back, ${res.user?.name || email.split("@")[0]}!`, "success");
          navigate("/", { replace: true });
        } else {
          addToast(res.error || "Invalid email or password. Please try again.", "error");
        }
      }
    } catch (err) {
      addToast(err.message || "Authentication error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await login("alex.morgan@codeaware.ai", "demo12345");
      if (res.success) {
        addToast("Signed in as Demo Lead Engineer.", "success");
        navigate("/", { replace: true });
      } else {
        addToast(res.error || "Demo login failed.", "error");
      }
    } catch (err) {
      addToast(err.message || "Demo login failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Left Feature Showcase Banner */}
      <div className="login-showcase-panel">
        <div className="login-showcase-content">
          {/* Logo */}
          <div className="brand-logo" style={{ color: "white", marginBottom: "36px" }}>
            <div className="brand-icon" style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.6)" }}>
              <Layers size={18} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800 }}>CodeAware AI</span>
          </div>

          {/* Value Prop Headline */}
          <div className="hero-tag" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#C7D2FE", borderColor: "rgba(99, 102, 241, 0.4)" }}>
            <Sparkles size={13} />
            <span>Autonomous Code Intelligence</span>
          </div>

          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#FFFFFF", lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.03em" }}>
            Understand, search, secure, and fix any codebase with AI.
          </h2>

          <p style={{ fontSize: "15px", color: "#94A3B8", lineHeight: "1.6", marginBottom: "32px" }}>
            Deterministic AST symbol indexing, hybrid semantic search, blast-radius impact analysis, and safe automated patches in one unified workspace.
          </p>

          {/* Floating Code Intelligence Card Showcase */}
          <div className="login-code-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }}></span>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }}></span>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
                <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "JetBrains Mono", marginLeft: "6px" }}>
                  app/api/auth.py
                </span>
              </div>
              <span className="badge badge-success" style={{ fontSize: "10.5px", padding: "2px 6px" }}>
                AST Verified
              </span>
            </div>

            <div style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "#E2E8F0", lineHeight: "1.6" }}>
              <div><span style={{ color: "#818CF8" }}>async def</span> <span style={{ color: "#38BDF8" }}>authenticate_user</span>(token: str):</div>
              <div style={{ paddingLeft: "16px", color: "#94A3B8" }}># Traces 4 direct callers & 2 routes</div>
              <div style={{ paddingLeft: "16px" }}><span style={{ color: "#F472B6" }}>return</span> await SecurityAgent.verify(token)</div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="badge badge-primary" style={{ fontSize: "11px" }}>
                <Search size={11} /> 0ms Symbol Lookup
              </span>
              <span className="badge badge-success" style={{ fontSize: "11px" }}>
                <ShieldCheck size={11} /> OWASP Audited
              </span>
            </div>
          </div>

          {/* Feature Bullets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#CBD5E1", fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Multi-Agent Orchestrator</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#CBD5E1", fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Blast Radius Impact Tree</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#CBD5E1", fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Safe Unified Diff Patches</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#CBD5E1", fontSize: "13px" }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Enterprise 256-Bit SSL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login / Sign Up Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
              {isRegister ? "Create your Developer Account" : "Sign in to CodeAware AI"}
            </h1>
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {isRegister
                ? "Get started with autonomous codebase intelligence and code review."
                : "Enter your credentials to access your workspaces and repositories."}
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div
            onClick={loading ? undefined : handleDemoLogin}
            className="card card-interactive"
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--primary-light)",
              borderColor: "var(--primary-border)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <KeyRound size={15} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--primary-text)" }}>
                  Quick Demo Access (1-Click)
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  Instant login as Lead Engineer with sample repositories
                </div>
              </div>
            </div>
            {loading ? <Loader2 size={16} className="spin" color="var(--primary)" /> : <ArrowRight size={16} color="var(--primary)" />}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isRegister && (
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: "36px", height: "42px" }}
                    required
                    disabled={loading}
                  />
                  <User size={15} color="var(--text-subtle)" style={{ position: "absolute", left: "12px", top: "13px" }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Work Email
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="input"
                  placeholder="alex.morgan@codeaware.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "36px", height: "42px" }}
                  required
                  disabled={loading}
                />
                <Mail size={15} color="var(--text-subtle)" style={{ position: "absolute", left: "12px", top: "13px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Password
                </label>
                {!isRegister && (
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      addToast("Reset instructions sent to your email.", "info");
                    }}
                    style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "36px", paddingRight: "38px", height: "42px" }}
                  required
                  disabled={loading}
                />
                <Lock size={15} color="var(--text-subtle)" style={{ position: "absolute", left: "12px", top: "13px" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-subtle)",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Engineering Role
                </label>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value)} style={{ height: "42px" }} disabled={loading}>
                  <option value="Lead Engineer">Lead Engineer / Architect</option>
                  <option value="Senior Developer">Senior Full Stack Developer</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="DevOps Specialist">DevOps & Infrastructure</option>
                </select>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "var(--primary)" }}
                  disabled={loading}
                />
                <span>Remember this workstation</span>
              </label>

              <span className="badge badge-success" style={{ fontSize: "11px", padding: "2px 8px" }}>
                <ShieldCheck size={12} /> 256-Bit SSL
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", height: "44px", marginTop: "4px" }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? "Create Account & Enter" : "Sign In to Workspace"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary)" }}>
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to CodeAware?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
