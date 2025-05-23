// src/store/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { APIUser } from "../types/api";

interface AuthContextProps {
  user: APIUser | null;
  login: (data: APIUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<APIUser | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");

      if (!userStr) return;

      const user = JSON.parse(userStr);

      if (user?.username && user?.id) {
        setUser({
          message: "authenticated",
          user: {
            id: user.id,
            username: user.username,
          },
        });
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setUser(null);
    }
  }, []);

  const login = (data: APIUser) => {
    try {
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data);
    } catch (err) {
      console.error("Erro ao salvar login:", err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
