import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useUser } from "@/store/auth-store";

interface Props {
  children: ReactElement;
}

export const PrivateRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};
