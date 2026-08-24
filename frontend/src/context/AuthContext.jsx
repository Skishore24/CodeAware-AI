import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  getMe,
  getTeam,
  addTeamMemberApi,
  removeTeamMemberApi,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("codeaware_token") || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("codeaware_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Validate existing JWT token on app boot
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const storedToken = localStorage.getItem("codeaware_token");
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const data = await getMe();
        if (isMounted && data?.user) {
          setUser(data.user);
          setToken(storedToken);
          localStorage.setItem("codeaware_user", JSON.stringify(data.user));
        } else if (isMounted) {
          throw new Error("Invalid session");
        }
      } catch (err) {
        console.warn("Session expired or invalid token:", err.message);
        if (isMounted) {
          localStorage.removeItem("codeaware_token");
          localStorage.removeItem("codeaware_user");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    verifySession();

    // Listen to unauthorized event dispatched from Axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("codeaware_auth_unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("codeaware_auth_unauthorized", handleUnauthorized);
    };
  }, []);

  // Fetch team members when authenticated
  const loadTeam = useCallback(async () => {
    if (!token) return;
    setLoadingTeam(true);
    try {
      const data = await getTeam();
      if (data?.team) {
        setTeamMembers(data.team);
      }
    } catch (err) {
      console.warn("Could not fetch team members:", err.message);
    } finally {
      setLoadingTeam(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      loadTeam();
    }
  }, [user, token, loadTeam]);

  // Secure Login with JWT
  const login = async (email, password) => {
    try {
      const res = await loginUser(email, password);
      if (res?.access_token && res?.user) {
        localStorage.setItem("codeaware_token", res.access_token);
        localStorage.setItem("codeaware_user", JSON.stringify(res.user));
        setToken(res.access_token);
        setUser(res.user);
        return { success: true, user: res.user, token: res.access_token };
      }
      throw new Error(res?.detail || res?.message || "Invalid authentication credentials.");
    } catch (err) {
      const errorMsg = err.message || "Invalid email or password. Please check your credentials.";
      return { success: false, error: errorMsg };
    }
  };

  // Secure Registration with JWT
  const register = async (name, email, password, role = "Developer") => {
    try {
      const res = await registerUser(name, email, password, role);
      if (res?.access_token && res?.user) {
        localStorage.setItem("codeaware_token", res.access_token);
        localStorage.setItem("codeaware_user", JSON.stringify(res.user));
        setToken(res.access_token);
        setUser(res.user);
        await loadTeam();
        return { success: true, user: res.user, token: res.access_token };
      }
      throw new Error(res?.detail || res?.message || "Registration failed.");
    } catch (err) {
      const errorMsg = err.message || "Registration failed. Email may already be in use.";
      return { success: false, error: errorMsg };
    }
  };

  // Logout & Revoke local token
  const logout = () => {
    try {
      localStorage.removeItem("codeaware_token");
      localStorage.removeItem("codeaware_user");
    } catch {}
    setToken(null);
    setUser(null);
    setTeamMembers([]);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("codeaware_user", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const addTeamMember = async (name, email, role) => {
    try {
      const res = await addTeamMemberApi(name, email, role);
      if (res?.member) {
        setTeamMembers((prev) => [...prev, res.member]);
        return res.member;
      }
    } catch (err) {
      throw err;
    }
  };

  const removeTeamMember = async (id) => {
    try {
      await removeTeamMemberApi(id);
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        teamMembers,
        loadingTeam,
        login,
        register,
        logout,
        updateProfile,
        addTeamMember,
        removeTeamMember,
        loadTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

