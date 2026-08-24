import { useState } from "react";
import {
  Sliders,
  Users,
  Shield,
  Key,
  Bot,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Boxes,
  Activity,
  Zap,
  Terminal,
  FileCode,
  GitFork,
  Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Settings() {
  const { user, teamMembers, addTeamMember, removeTeamMember, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'profile' | 'security' | 'agents'
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Developer");
  const [copiedKey, setCopiedKey] = useState(false);

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
    </div>
  );
}
