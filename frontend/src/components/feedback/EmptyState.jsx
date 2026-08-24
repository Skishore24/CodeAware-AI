import { FolderGit2, Search, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyState({
  icon: Icon = FolderGit2,
  title = "No Active Repository",
  description = "Connect or select a repository to unlock code search, AI review, security scanning, and dependency graphs.",
  actionText = "Connect Repository",
  actionPath = "/repos",
  onAction = null,
  secondaryText = null,
  secondaryAction = null,
}) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "48px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: "580px",
        margin: "40px auto",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-xl)",
          backgroundColor: "var(--primary-light)",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <Icon size={24} />
      </div>

      <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
        {title}
      </h3>

      <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "24px" }}>
        {description}
      </p>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {actionText && (
          <button className="btn btn-primary btn-lg" onClick={handleAction}>
            <span>{actionText}</span>
            <ArrowRight size={15} />
          </button>
        )}
        {secondaryText && secondaryAction && (
          <button className="btn btn-secondary btn-lg" onClick={secondaryAction}>
            <span>{secondaryText}</span>
          </button>
        )}
      </div>
    </div>
  );
}
