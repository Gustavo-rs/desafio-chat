import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/LoginPage.tsx";
import HomePage from "../pages/HomePage.tsx";

import { PrivateRoute } from "../components/PrivateRoute";
import RegisterPage from "../pages/auth/RegisterPage.tsx";
import MainLayout from "../layouts/MainLayout";
import { useUser } from "../store/auth-store";

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
