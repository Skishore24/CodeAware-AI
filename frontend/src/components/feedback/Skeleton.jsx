export function Skeleton({ width = "100%", height = "16px", borderRadius = "var(--radius-md)", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <Skeleton width="40%" height="20px" />
        <Skeleton width="24px" height="24px" borderRadius="var(--radius-full)" />
      </div>
      <Skeleton width="80%" height="14px" style={{ marginBottom: "8px" }} />
      <Skeleton width="60%" height="14px" style={{ marginBottom: "16px" }} />
      <Skeleton width="100%" height="36px" borderRadius="var(--radius-md)" />
    </div>
  );
}

export function CodeSkeleton() {
  return (
    <div className="code-box" style={{ padding: "var(--space-4)" }}>
      <Skeleton width="45%" height="14px" style={{ marginBottom: "10px", opacity: 0.2 }} />
      <Skeleton width="75%" height="14px" style={{ marginBottom: "10px", opacity: 0.2 }} />
      <Skeleton width="60%" height="14px" style={{ marginBottom: "10px", opacity: 0.2 }} />
      <Skeleton width="85%" height="14px" style={{ marginBottom: "10px", opacity: 0.2 }} />
      <Skeleton width="50%" height="14px" style={{ opacity: 0.2 }} />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <Skeleton width="30%" height="16px" />
            <Skeleton width="60px" height="18px" borderRadius="var(--radius-full)" />
          </div>
          <Skeleton width="70%" height="13px" style={{ marginBottom: "10px" }} />
          <Skeleton width="100%" height="45px" borderRadius="var(--radius-md)" />
        </div>
      ))}
    </div>
  );
}
