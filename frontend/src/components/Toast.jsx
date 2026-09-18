import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((first, second, third) => {
    let type = "info";
    let title = "";
    let message = "";

    const validTypes = ["success", "error", "warning", "info"];
    if (typeof first === "string" && validTypes.includes(first.toLowerCase())) {
      // Called as addToast("success", "Title", "Optional message")
      type = first.toLowerCase();
      title = second || "";
      message = third || "";
    } else if (typeof second === "string" && validTypes.includes(second.toLowerCase())) {
      // Called as addToast("Title or message", "success", "Optional extra info")
      type = second.toLowerCase();
      title = first || "";
      message = third || "";
    } else {
      title = first || "";
      type = "info";
      message = (typeof second === "string" ? second : "") || (typeof third === "string" ? third : "");
    }

    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const renderIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle2 size={17} color="var(--color-green)" />;
      case "error":   return <AlertCircle  size={17} color="var(--color-red)" />;
      case "warning": return <AlertTriangle size={17} color="var(--color-yellow)" />;
      default:        return <Info         size={17} color="var(--color-accent)" />;
    }
  };

  // contextValue works both as a function (addToast) and as an object ({ addToast, dismiss, toast })
  const contextValue = useMemo(() => {
    const fn = (...args) => addToast(...args);
    fn.addToast = addToast;
    fn.dismiss = dismiss;
    fn.toast = addToast;
    return fn;
  }, [addToast, dismiss]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            role="alert"
          >
            <span className="toast-icon">{renderIcon(t.type)}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.message && (
                <div className="toast-message">{t.message}</div>
              )}
            </div>
            <button
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", opacity: 0.5, display: "flex", alignItems: "center" }}
              onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
            >
              <X size={14} color="var(--color-text)" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a fallback no-op that doesn't crash if rendered outside provider
    const fallback = () => {};
    fallback.addToast = () => {};
    fallback.dismiss = () => {};
    fallback.toast = () => {};
    return fallback;
  }
  return context;
};

