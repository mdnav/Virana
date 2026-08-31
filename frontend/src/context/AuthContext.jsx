import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authMe, authLogin, authRegister, authLogout, setTokens, clearTokens, getToken } from "@/lib/api";

const AuthCtx = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await authMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email, password, rememberMe = false) => {
    const data = await authLogin({ email, password, remember_me: rememberMe });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authRegister(payload);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await authLogout(); } catch {}
    clearTokens();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
