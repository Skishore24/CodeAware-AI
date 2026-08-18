import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { listRepositories } from "../api/repositories";

/**
 * RepoContext
 *
 * Provides a globally shared "active repository" state and lists all
 * cloned repositories detected in the backend workspace.
 */

const RepoContext = createContext(null);

export function RepoProvider({ children }) {
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

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
    } catch {
      // localStorage not available
    }
  }, []);

  const clearRepo = useCallback(() => {
    setActiveRepo(null);
  }, [setActiveRepo]);

  const refreshRepositories = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const data = await listRepositories();
      const list = data.repositories || [];
      setRepositories(list);

      // If no active repository is selected yet and repositories exist, auto-select the first one
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
    refreshRepositories();
  }, [refreshRepositories]);

  return (
    <RepoContext.Provider
      value={{
        activeRepo,
        setActiveRepo,
        clearRepo,
        repositories,
        loadingRepos,
        refreshRepositories,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export const useRepo = () => useContext(RepoContext);
