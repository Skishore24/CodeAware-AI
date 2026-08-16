import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Dashboard    from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import CodeSearch   from "./pages/CodeSearch";
import AgentChat    from "./pages/AgentChat";
import CodeGraph    from "./pages/CodeGraph";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/"       element={<Dashboard />}    />
              <Route path="/repos"  element={<Repositories />} />
              <Route path="/search" element={<CodeSearch />}   />
              <Route path="/agent"  element={<AgentChat />}    />
              <Route path="/graph"  element={<CodeGraph />}    />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
