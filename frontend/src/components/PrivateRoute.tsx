import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import type { ReactElement } from "react";

interface Props {
  children: ReactElement;
}

export const PrivateRoute = ({ children }: Props) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};
