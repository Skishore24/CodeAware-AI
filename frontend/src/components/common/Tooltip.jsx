import { useState } from "react";
import { HelpCircle } from "lucide-react";

export default function Tooltip({ text, children, icon = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={text}
    >
      {children || (icon ? <HelpCircle size={14} color="var(--text-subtle)" style={{ marginLeft: "4px" }} /> : null)}

      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--text-main)",
            color: "var(--bg-surface)",
            padding: "6px 10px",
            borderRadius: "var(--radius-md)",
            fontSize: "11.5px",
            lineHeight: "1.4",
            whiteSpace: "normal",
            width: "max-content",
            maxWidth: "240px",
            zIndex: 100,
            boxShadow: "var(--shadow-md)",
            pointerEvents: "none",
            animation: "fadeIn 0.1s ease-out",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
