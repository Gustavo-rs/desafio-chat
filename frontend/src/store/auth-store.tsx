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

        const response = await authService.verify();
        setUser(response.data);
        setIsLoading(false);
      } catch (err) {
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
      logout();
    }
  };

  const logout = async () => {
    localStorage.removeItem("user");
    setUser(null);
    
    try {
      await authService.logout();
    } catch (err) {
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
