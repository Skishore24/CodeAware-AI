import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { listRepositories, healthCheck } from "../api/repositories";

const RepoContext = createContext(null);

export function RepoProvider({ children }) {
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [backendStatus, setBackendStatus] = useState("healthy"); // healthy, degraded, offline
  const [backendHealth, setBackendHealth] = useState(null);

  const [activeRepo, setActiveRepoState] = useState(() => {
    try {
      const stored = localStorage.getItem("codeaware_active_repo");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setActiveRepo = useCallback((repo) => {
    setActiveRepoState(repo);
    try {
      if (repo) {
        localStorage.setItem("codeaware_active_repo", JSON.stringify(repo));
      } else {
        localStorage.removeItem("codeaware_active_repo");
      }
    } catch {}
  }, []);

  const clearRepo = useCallback(() => {
    setActiveRepo(null);
  }, [setActiveRepo]);

  const checkHealth = useCallback(async () => {
    try {
      const data = await healthCheck();
      if (data?.status === "ok" || data?.status === "healthy") {
        setBackendStatus("healthy");
        setBackendHealth(data);
      } else {
        setBackendStatus("degraded");
      }
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  const refreshRepositories = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const data = await listRepositories();
      const list = data.repositories || [];
      setRepositories(list);

      setActiveRepoState((current) => {
        if (!current && list.length > 0) {
          const first = list[0];
          try {
            localStorage.setItem("codeaware_active_repo", JSON.stringify(first));
          } catch {}
          return first;
        }
        return current;
      });
    } catch (err) {
      console.warn("Could not load cloned repositories:", err);
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    refreshRepositories();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, refreshRepositories]);

  return (
    <RepoContext.Provider
      value={{
        activeRepo,
        setActiveRepo,
        clearRepo,
        repositories,
        loadingRepos,
        backendStatus,
        backendHealth,
        checkHealth,
        refreshRepositories,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export const useRepo = () => useContext(RepoContext);
