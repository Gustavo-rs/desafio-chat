import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/LoginPage.tsx";
import HomePage from "../pages/HomePage.tsx";

import { PrivateRoute } from "../components/PrivateRoute";
import RegisterPage from "../pages/auth/RegisterPage.tsx";
import MainLayout from "../layouts/MainLayout";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
