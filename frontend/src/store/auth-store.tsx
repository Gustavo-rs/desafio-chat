// src/store/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { APIUser } from "../types/api";

interface AuthContextProps {
  auth: APIUser | null;
  login: (data: APIUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<APIUser | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userStr || !token) return;

      const user = JSON.parse(userStr);

      if (user?.username && user?.id) {
        setAuth({
          token,
          message: "authenticated",
          user: {
            id: user.id,
            username: user.username,
          },
        });
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setAuth(null);
    }
  }, []);

  const login = (data: APIUser) => {
    try {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuth(data);
    } catch (err) {
      console.error("Erro ao salvar login:", err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        isAuthenticated: !!auth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
