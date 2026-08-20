import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const me = await api.get("/auth/me/");
      setProfile(me);
    } catch {
      setToken(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) loadMe();
    else setLoading(false);
  }, []);

  async function login(username, password) {
    const data = await api.post("/auth/login/", { username, password });
    setToken(data.token);
    await loadMe();
  }

  async function register(username, email, password) {
    const data = await api.post("/auth/register/", { username, email, password });
    setToken(data.token);
    await loadMe();
  }

  function logout() {
    setToken(null);
    setProfile(null);
  }

  async function updateProfile(patch, opts) {
    const updated = await api.patch("/auth/me/", patch, opts);
    setProfile(updated);
    return updated;
  }

  return (
    <AuthContext.Provider value={{ profile, loading, login, register, logout, updateProfile, reloadProfile: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
