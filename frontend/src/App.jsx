import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layers, ShieldCheck, Loader2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Header from "./components/layout/Header";
import CommandPalette from "./components/CommandPalette";
import { ToastProvider } from "./components/Toast";
import { RepoProvider } from "./context/RepoContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import CodeSearch from "./pages/CodeSearch";
import CodeReview from "./pages/CodeReview";
import AgentChat from "./pages/AgentChat";
import CodeGraph from "./pages/CodeGraph";
import ImpactAnalysis from "./pages/ImpactAnalysis";
import AutonomousFix from "./pages/AutonomousFix";
import TestGenerator from "./pages/TestGenerator";
import SecurityDashboard from "./pages/SecurityDashboard";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function PageWrapper({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <div className="page-enter">{children}</div>;
}

function MainLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-app)",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 0 24px rgba(99, 102, 241, 0.4)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          <Layers size={26} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Loader2 size={16} className="spin" />
            <span>Verifying Secure Session</span>
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Validating cryptographic JWT token with CodeAware backend...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
      <div className="main-wrapper">
        <Header onOpenPalette={() => setPaletteOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/repos" element={<PageWrapper><Repositories /></PageWrapper>} />
            <Route path="/search" element={<PageWrapper><CodeSearch /></PageWrapper>} />
            <Route path="/review" element={<PageWrapper><CodeReview /></PageWrapper>} />
            <Route path="/security" element={<PageWrapper><SecurityDashboard /></PageWrapper>} />
            <Route path="/agent" element={<PageWrapper><AgentChat /></PageWrapper>} />
            <Route path="/graph" element={<PageWrapper><CodeGraph /></PageWrapper>} />
            <Route path="/impact" element={<PageWrapper><ImpactAnalysis /></PageWrapper>} />
            <Route path="/autonomous" element={<PageWrapper><AutonomousFix /></PageWrapper>} />
            <Route path="/tests" element={<PageWrapper><TestGenerator /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RepoProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<MainLayout />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </RepoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

