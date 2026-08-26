import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/layout/Header";
import CommandPalette from "./components/CommandPalette";
import { ToastProvider } from "./components/Toast";
import { RepoProvider } from "./context/RepoContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoadingScreen from "./components/common/LoadingScreen";
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
import NotFound from "./pages/NotFound";

function PageWrapper({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <div className="page-enter">{children}</div>;
}

function MainLayout({ children }) {
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
      <LoadingScreen
        message="Loading Workspace"
        subtitle="Preparing your repositories and code intelligence workspace..."
      />
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
          <PageWrapper>{children}</PageWrapper>
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
                {/* Authentication */}
                <Route path="/login" element={<Login />} />

                {/* Authenticated Workspace Pages (with Sidebar & Header) */}
                <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/repos" element={<MainLayout><Repositories /></MainLayout>} />
                <Route path="/search" element={<MainLayout><CodeSearch /></MainLayout>} />
                <Route path="/review" element={<MainLayout><CodeReview /></MainLayout>} />
                <Route path="/security" element={<MainLayout><SecurityDashboard /></MainLayout>} />
                <Route path="/agent" element={<MainLayout><AgentChat /></MainLayout>} />
                <Route path="/graph" element={<MainLayout><CodeGraph /></MainLayout>} />
                <Route path="/impact" element={<MainLayout><ImpactAnalysis /></MainLayout>} />
                <Route path="/autonomous" element={<MainLayout><AutonomousFix /></MainLayout>} />
                <Route path="/tests" element={<MainLayout><TestGenerator /></MainLayout>} />
                <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />

                {/* Standalone Fullscreen 404 Page (No Sidebar / No Header) */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </RepoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
