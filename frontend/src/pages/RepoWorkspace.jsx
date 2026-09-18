import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FolderGit2,
  Search,
  Shield,
  Bug,
  TestTube,
  CheckCircle2,
  GitGraph,
  GitFork,
  Wrench,
  GitCommit,
} from "lucide-react";
import { useRepo } from "../context/RepoContext";

import CodeSearch from "./CodeSearch";
import SecurityDashboard from "./SecurityDashboard";
import Bugs from "./Bugs";
import TestGenerator from "./TestGenerator";
import CodeReview from "./CodeReview";
import CodeGraph from "./CodeGraph";
import ImpactAnalysis from "./ImpactAnalysis";
import AutonomousFix from "./AutonomousFix";
import CommitsHistory from "./CommitsHistory";
import BranchSelector from "../components/git/BranchSelector";
import CommitStrip from "../components/git/CommitStrip";

export default function RepoWorkspace() {
  const { id } = useParams();
  const { repositories, activeRepo, setActiveRepo } = useRepo();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id && repositories && repositories.length > 0) {
      const found = repositories.find((r) => r.name === id || String(r.id) === id);
      if (found && (!activeRepo || activeRepo.name !== found.name)) {
        setActiveRepo(found);
      }
    }
  }, [id, repositories]);

  const tabs = [
    { id: "overview", label: "Overview", icon: FolderGit2 },
    { id: "commits", label: "Commits & Branches", icon: GitCommit },
    { id: "search", label: "Code Search", icon: Search },
    { id: "security", label: "Security", icon: Shield },
    { id: "bugs", label: "Bugs", icon: Bug },
    { id: "tests", label: "Tests", icon: TestTube },
    { id: "review", label: "Code Review", icon: CheckCircle2 },
    { id: "graph", label: "Knowledge Graph", icon: GitGraph },
    { id: "impact", label: "Impact Analysis", icon: GitFork },
    { id: "autofix", label: "Autonomous Fix", icon: Wrench },
  ];

  return (
    <div className="page-container" style={{ padding: "20px 24px" }}>
      {/* Workspace Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FolderGit2 size={22} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {activeRepo ? activeRepo.name : id || "Repository Workspace"}
            </h1>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Path: {activeRepo?.path || "Local Workspace"} • Primary Language: {activeRepo?.primary_language || "Polyglot"}
            </div>
          </div>
        </div>

        {/* GitHub-style Branch Selector in header */}
        {activeRepo && (
          <BranchSelector activeRepo={activeRepo} />
        )}
      </div>

      {/* GitHub-style Commit Strip Banner */}
      {activeRepo && (
        <div style={{ marginBottom: "16px" }}>
          <CommitStrip activeRepo={activeRepo} />
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "8px",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px" }}>Repository Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total Tracked Files</div>
                <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>{activeRepo?.files_count || 0}</div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Indexed AST Functions</div>
                <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>{activeRepo?.total_functions || 0}</div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Extracted Classes</div>
                <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>{activeRepo?.total_classes || 0}</div>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Select any tab above to inspect Git branches and commits, execute specialist AI agents, navigate the interactive force-directed knowledge graph, or perform automated bug repairs.
            </p>
          </div>
        )}

        {activeTab === "commits" && <CommitsHistory />}
        {activeTab === "search" && <CodeSearch />}
        {activeTab === "security" && <SecurityDashboard />}
        {activeTab === "bugs" && <Bugs />}
        {activeTab === "tests" && <TestGenerator />}
        {activeTab === "review" && <CodeReview />}
        {activeTab === "graph" && <CodeGraph />}
        {activeTab === "impact" && <ImpactAnalysis />}
        {activeTab === "autofix" && <AutonomousFix />}
      </div>
    </div>
  );
}
