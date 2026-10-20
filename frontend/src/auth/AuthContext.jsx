import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => setTeacher(data.authenticated ? data.teacher : null))
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setTeacher(data.teacher);
    return data.teacher;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setTeacher(data.teacher);
    return data.teacher;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setTeacher(null);
    }
  }, []);

  const value = useMemo(() => ({ teacher, loading, login, register, logout }), [teacher, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children }) {
  const { teacher, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Жүктелуде…</div>;
  if (!teacher) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
