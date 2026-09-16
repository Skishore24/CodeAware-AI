import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Check,
  Boxes,
  Activity,
  Zap,
  Terminal,
  FileCode,
  GitFork,
  Wrench,
  Cpu,
  Server,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Code2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getOllamaStatus, updateOllamaConfig, testOllamaGenerate } from "../api/ollama";

export default function Settings() {
  const { user, teamMembers, addTeamMember, removeTeamMember, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'profile' | 'security' | 'agents' | 'ollama'
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Developer");
  const [copiedKey, setCopiedKey] = useState(false);

  // Ollama local LLM state
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5-coder:7b");
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaVersion, setOllamaVersion] = useState(null);
  const [installedOllamaModels, setInstalledOllamaModels] = useState([]);
  const [ollamaRecommendations, setOllamaRecommendations] = useState([]);
  const [loadingOllama, setLoadingOllama] = useState(false);
  const [savingOllama, setSavingOllama] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Write a clean Python function to safely parse a JSON file with try/except error handling.");
  const [testOutput, setTestOutput] = useState("");
  const [generatingTest, setGeneratingTest] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState("");

  const fetchOllama = async () => {
    setLoadingOllama(true);
    try {
      const data = await getOllamaStatus();
      if (data?.connection) {
        setOllamaConnected(Boolean(data.connection.connected));
        setOllamaVersion(data.connection.version || null);
        if (data.connection.base_url) setOllamaUrl(data.connection.base_url);
        if (data.connection.model) setOllamaModel(data.connection.model);
      }
      setInstalledOllamaModels(data?.installed_models || []);
      setOllamaRecommendations(data?.recommendations || []);
    } catch {
      setOllamaConnected(false);
    } finally {
      setLoadingOllama(false);
    }
  };

  useEffect(() => {
    fetchOllama();
  }, []);

  const handleSaveOllama = async (e) => {
    e.preventDefault();
    setSavingOllama(true);
    try {
      const res = await updateOllamaConfig(ollamaUrl, ollamaModel);
      if (res?.success) {
        setOllamaConnected(Boolean(res.connection?.connected));
        addToast(`Ollama settings updated. Active model: ${res.model}`, "success");
        await fetchOllama();
      } else {
        addToast("Failed to update Ollama configuration.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to update Ollama settings.", "error");
    } finally {
      setSavingOllama(false);
    }
  };

  const handleTestGenerate = async () => {
    if (!testPrompt.trim()) return;
    setGeneratingTest(true);
    setTestOutput("");
    try {
      const res = await testOllamaGenerate(testPrompt.trim(), ollamaModel);
      if (res?.response) {
        setTestOutput(res.response);
        addToast(`Response generated using ${res.model || ollamaModel}`, "success");
      } else {
        addToast("No response received from Ollama.", "warning");
      }
    } catch (err) {
      addToast(err.message || "Ollama generation failed. Ensure model is installed and running.", "error");
    } finally {
      setGeneratingTest(false);
    }
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    addToast("Pull command copied to clipboard!", "info");
    setTimeout(() => setCopiedCmd(""), 2500);
  };

  // Profile form state
  const [userName, setUserName] = useState(user?.name || "Alex Morgan");
  const [userEmail, setUserEmail] = useState(user?.email || "alex.morgan@codeaware.ai");
  const [userRole, setUserRole] = useState(user?.role || "Lead Engineer");
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? true);

  const agentsList = [
    { name: "RepositoryAgent", icon: Boxes, intent: "repository_analysis", desc: "Language distribution, file counts, and entry points mapping" },
    { name: "SearchAgent", icon: Bot, intent: "code_search", desc: "Natural language query and AST symbol relevance matching" },
    { name: "RAGAgent", icon: FileCode, intent: "code_explanation", desc: "Repository-aware chunk retrieval with exact line citations" },
    { name: "CodeAnalysisAgent", icon: Terminal, intent: "code_analysis", desc: "AST symbol definitions, classes, and parameter extraction" },
    { name: "BugAgent", icon: Activity, intent: "bug_analysis", desc: "Syntax checks, bare exceptions, and runtime anti-patterns" },
    { name: "SecurityAgent", icon: ShieldCheck, intent: "security_analysis", desc: "OWASP audits (SQLi, secrets, dangerous eval, path traversal)" },
    { name: "ImpactAgent", icon: GitFork, intent: "impact_analysis", desc: "Blast radius scoring, direct/indirect callers, and affected APIs" },
    { name: "TestAgent", icon: FileCode, intent: "test_generation", desc: "Synthesizes isolated unit tests with mock fixtures" },
    { name: "FixAgent", icon: Wrench, intent: "fix_request", desc: "Generates targeted patches and unified diffs" },
    { name: "DocumentationAgent", icon: FileCode, intent: "documentation", desc: "Generates markdown architecture & API documentation" },
    { name: "ArchitectureAgent", icon: Boxes, intent: "architecture_analysis", desc: "Layer separation (API, services, models, UI) and coupling risks" },
    { name: "PerformanceAgent", icon: Zap, intent: "performance_analysis", desc: "N+1 query patterns, blocking I/O, and bottlenecks" },
    { name: "CodeReviewAgent", icon: CheckCircle2, intent: "code_review", desc: "8-dimension engineering code quality review" },
    { name: "GitAgent", icon: Activity, intent: "git_analysis", desc: "Commit history, branches, and diff analysis" },
    { name: "ValidationAgent", icon: ShieldCheck, intent: "validation", desc: "Isolated syntax and regression test validation" },
  ];

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      addToast("Name and email are required to invite team members.", "warning");
      return;
    }
    addTeamMember(newMemberName.trim(), newMemberEmail.trim(), newMemberRole);
    setNewMemberName("");
    setNewMemberEmail("");
    addToast(`Invitation sent to ${newMemberEmail}.`, "success");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: userName,
      email: userEmail,
      role: userRole,
      twoFactorEnabled: twoFactor,
    });
    addToast("Profile details updated successfully.", "success");
  };

  const apiKey = "ca_live_99f2b80a2948e71b3dc92a10";

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    addToast("API token copied to clipboard", "info");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: 800 }}>
            Workspace Settings & User Management
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage team access, role-based permissions, authentication security, and AI agent registry.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        {[
          { id: "users", label: `Team & Users (${teamMembers.length})`, icon: Users },
          { id: "profile", label: "My Profile", icon: User },
          { id: "security", label: "Security & API Keys", icon: Shield },
          { id: "agents", label: `AI Agents (${agentsList.length})`, icon: Bot },
          { id: "ollama", label: `Ollama Local LLM ${ollamaConnected ? "●" : ""}`, icon: Cpu },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? "btn-primary" : "btn-ghost"} btn-sm`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: User & Team Management */}
      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Invite Member Form */}
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>Invite Team Member</h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Grant developers and security architects access to your repositories and code analysis workspace.
            </p>

            <form onSubmit={handleAddMember} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sarah Chen"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>

              <div style={{ flex: 1.2, minWidth: "220px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="sarah.chen@company.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>

              <div style={{ width: "160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Role
                </label>
                <select className="select" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="Lead Engineer">Lead Engineer</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                <Plus size={15} />
                <span>Invite Member</span>
              </button>
            </form>
          </div>

          {/* Team Members List */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-header">
              <h3 className="card-title">
                <Users size={16} color="var(--primary)" />
                <span>Active Team Members ({teamMembers.length})</span>
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-main)" }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{member.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span className="badge badge-neutral" style={{ fontSize: "11.5px" }}>
                      {member.role}
                    </span>

                    <span
                      className="badge"
                      style={{
                        backgroundColor: member.status === "Active" ? "var(--success-light)" : "var(--warning-light)",
                        color: member.status === "Active" ? "var(--success-text)" : "var(--warning-text)",
                        fontSize: "11px",
                      }}
                    >
                      {member.status}
                    </span>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        removeTeamMember(member.id);
                        addToast(`Removed ${member.name} from team.`, "info");
                      }}
                      title="Remove member"
                      style={{ color: "var(--text-subtle)", padding: "4px" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile Settings */}
      {activeTab === "profile" && (
        <div className="card" style={{ padding: "var(--space-6)", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Profile Information</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "18px" }}>
            Update your account details and engineering title.
          </p>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                className="input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Work Email
              </label>
              <input
                type="email"
                className="input"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Engineering Role
              </label>
              <select className="select" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="Lead Engineer">Lead Engineer</option>
                <option value="Senior Full Stack Developer">Senior Full Stack Developer</option>
                <option value="Security Architect">Security Architect</option>
                <option value="DevOps Specialist">DevOps Specialist</option>
              </select>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Two-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Require an authenticator app confirmation on sign in.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                />
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "8px", alignSelf: "flex-start" }}>
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Security & API Keys */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: "700px" }}>
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Workspace API Tokens</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Use personal access tokens to integrate CodeAware AI with CI/CD pipelines, GitHub Actions, and CLI tools.
            </p>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="input"
                readOnly
                value={apiKey}
                style={{ fontFamily: "JetBrains Mono", backgroundColor: "var(--bg-muted)", fontSize: "13px" }}
              />
              <button className="btn btn-secondary" onClick={copyApiKey}>
                {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Active Workstation Sessions</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Manage logged-in devices and revoke sessions across teams.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>Current Browser Session</div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Chrome • Windows Workstation • IP: 127.0.0.1</div>
              </div>
              <span className="badge badge-success">Active Now</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Agents Registry */}
      {activeTab === "agents" && (
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <div className="card-header" style={{ padding: "0 0 16px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "16px" }}>
            <h3 className="card-title">
              <Bot size={18} color="var(--primary)" />
              <span>AI Engineering Agents Registry ({agentsList.length})</span>
            </h3>
            <span className="badge badge-success">All Active & Registered</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {agentsList.map((ag, idx) => {
              const Icon = ag.icon;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-main)" }}>
                      {ag.name}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.4" }}>
                      {ag.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Ollama Local LLM Integration */}
      {activeTab === "ollama" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Status & Connection Card */}
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: ollamaConnected ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                    color: ollamaConnected ? "var(--success)" : "var(--warning)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Ollama Local Reasoning Engine</span>
                    {ollamaConnected ? (
                      <span className="badge badge-success" style={{ fontSize: "11px" }}>
                        <CheckCircle2 size={12} /> Connected {ollamaVersion ? `(v${ollamaVersion})` : ""}
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                        <AlertCircle size={12} /> Offline / Not Detected
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Run 100% private, local LLMs on your CPU or GPU without sending any code or AST context to external clouds.
                  </p>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={fetchOllama}
                disabled={loadingOllama}
                title="Refresh Ollama connection status"
              >
                <RefreshCw size={13} className={loadingOllama ? "animate-spin" : ""} />
                <span>{loadingOllama ? "Checking..." : "Refresh Status"}</span>
              </button>
            </div>

            {/* Connection settings form */}
            <form onSubmit={handleSaveOllama} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Ollama Base URL
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="http://localhost:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    style={{ paddingLeft: "32px", fontSize: "13px" }}
                  />
                  <Server size={14} color="var(--text-subtle)" style={{ position: "absolute", left: "10px", top: "11px" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Active Reasoning Model
                </label>
                <select
                  className="input"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <optgroup label="Installed Local Models">
                    {installedOllamaModels.map((m, idx) => {
                      const mName = m.name || m.model;
                      return (
                        <option key={idx} value={mName}>
                          {mName} ({m.details?.parameter_size || "local"})
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Recommended for CodeAware">
                    <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (Best for Code & Bug Fixing)</option>
                    <option value="qwen2.5-coder:14b">qwen2.5-coder:14b (Advanced Coder)</option>
                    <option value="deepseek-r1:8b">deepseek-r1:8b (Root-Cause Analysis)</option>
                    <option value="llama3.1:8b">llama3.1:8b (General Purpose)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingOllama}
                  style={{ width: "100%", height: "38px" }}
                >
                  {savingOllama ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Save & Apply Model</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Model Recommendations for Bug Fixing & Coding */}
          <div>
            <div style={{ marginBottom: "var(--space-3)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                Which Ollama Model is Best to Fix Problems?
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Curated open-source models ranked for code comprehension, automated bug repair, AST grounding, and patch synthesis.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
              {ollamaRecommendations.map((rec) => {
                const isInstalled = installedOllamaModels.some(
                  (im) => (im.name || im.model || "").includes(rec.id)
                );
                const isActive = ollamaModel === rec.id;

                return (
                  <div
                    key={rec.id}
                    className="card"
                    style={{
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderColor: rec.recommended ? "var(--primary)" : isActive ? "var(--info)" : "var(--border-color)",
                      boxShadow: rec.recommended ? "0 0 0 1px var(--primary), var(--shadow-sm)" : "var(--shadow-xs)",
                      backgroundColor: rec.recommended ? "var(--bg-surface)" : "var(--bg-card)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ fontSize: "14.5px", fontWeight: 800 }}>{rec.name}</h4>
                            {rec.recommended && (
                              <span className="badge badge-primary" style={{ fontSize: "10.5px" }}>
                                <Sparkles size={11} /> #1 Top Pick
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: 600, marginTop: "2px" }}>
                            {rec.tagline}
                          </div>
                        </div>

                        {isInstalled ? (
                          <span className="badge badge-success" style={{ fontSize: "11px" }}>
                            <CheckCircle2 size={12} /> Installed
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>
                            {rec.ram_required}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.45", marginBottom: "12px" }}>
                        {rec.description}
                      </p>

                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "14px" }}>
                        <strong style={{ color: "var(--text-main)" }}>Best for: </strong>
                        {rec.best_for}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                      {isInstalled ? (
                        <button
                          className={`btn ${isActive ? "btn-primary" : "btn-secondary"} btn-sm`}
                          style={{ flex: 1 }}
                          onClick={() => {
                            setOllamaModel(rec.id);
                            updateOllamaConfig(ollamaUrl, rec.id);
                            addToast(`Active model switched to ${rec.name}`, "success");
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>{isActive ? "Active Model" : "Select Model"}</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: "12px" }}
                          onClick={() => copyCommand(rec.pull_cmd)}
                          title="Copy terminal command to download this model"
                        >
                          {copiedCmd === rec.pull_cmd ? (
                            <>
                              <Check size={13} color="var(--success)" />
                              <span>Command Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy: {rec.pull_cmd}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Test Generation */}
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Test Model Reasoning Live</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Verify that your configured Ollama model responds correctly to coding requests.
                </p>
              </div>
              <span className="badge badge-neutral" style={{ fontFamily: "JetBrains Mono", fontSize: "11px" }}>
                Target: {ollamaModel}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <input
                type="text"
                className="input"
                placeholder="Ask a coding question or describe a bug to fix..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !generatingTest && handleTestGenerate()}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleTestGenerate}
                disabled={generatingTest || !testPrompt.trim()}
              >
                {generatingTest ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>

            {testOutput && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.5",
                  maxHeight: "350px",
                  overflowY: "auto",
                }}
              >
                {testOutput}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
