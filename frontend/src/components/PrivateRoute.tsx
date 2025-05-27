import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useUser } from "@/store/auth-store";

interface Props {
  children: ReactElement;
}

export const PrivateRoute = ({ children }: Props) => {
  const { isAuthenticated } = useUser();
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};
