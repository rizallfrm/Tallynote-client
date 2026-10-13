
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }

  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const startSession = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    startSession(data);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await api.post("/auth/verify", {
      email,
      code,
    });

    startSession(data);
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post("/auth/google", {
      credential,
    });

    startSession(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser((previous) =>
      previous ? { ...previous, ...patch } : previous
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        verifyEmail,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
