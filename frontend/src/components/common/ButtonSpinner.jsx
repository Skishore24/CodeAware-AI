/**
 * ButtonSpinner
 * Premium dual counter-rotating micro-orbital spinner designed specifically
 * for buttons, pills, and compact action controls.
 */
export default function ButtonSpinner({ size = 15, color = "currentColor", style = {} }) {
  return (
    <span
      className="btn-spinner"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <span className="btn-spinner-ring" />
      <span className="btn-spinner-ring-inner" />
    </span>
  );
}
