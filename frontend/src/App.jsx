import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { RepoProvider } from "./context/RepoContext";
import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import CodeSearch from "./pages/CodeSearch";
import AgentChat from "./pages/AgentChat";
import CodeGraph from "./pages/CodeGraph";
import AutonomousFix from "./pages/AutonomousFix";
import Settings from "./pages/Settings";

/** Fade-in animation on every route change */
function PageWrapper({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <div className="page-enter">{children}</div>;
}

export default function App() {
  return (
    <RepoProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/"           element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/repos"      element={<PageWrapper><Repositories /></PageWrapper>} />
                <Route path="/search"     element={<PageWrapper><CodeSearch /></PageWrapper>} />
                <Route path="/agent"      element={<PageWrapper><AgentChat /></PageWrapper>} />
                <Route path="/autonomous" element={<PageWrapper><AutonomousFix /></PageWrapper>} />
                <Route path="/graph"      element={<PageWrapper><CodeGraph /></PageWrapper>} />
                <Route path="/settings"   element={<PageWrapper><Settings /></PageWrapper>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </RepoProvider>
  );
}
