// src/store/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { APIUser } from "../types/api";
import authService from "../services/auth-service";

interface AuthContextProps {
  user: APIUser | null;
  login: (data: APIUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<APIUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");

        if (!userStr) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Verificar se o cookie ainda é válido fazendo uma requisição ao servidor
        const response = await authService.verify();
        setUser(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        // Se a verificação falhar, limpar dados locais
        localStorage.removeItem("user");
        setUser(null);
        setIsLoading(false);
      }
    };

    verifyAuth();
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

  const logout = async () => {
    try {
      // Fazer logout no servidor para limpar o cookie
      await authService.logout();
    } catch (err) {
      console.error("Erro ao fazer logout no servidor:", err);
    } finally {
      // Sempre limpar dados locais, mesmo se o logout no servidor falhar
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
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
