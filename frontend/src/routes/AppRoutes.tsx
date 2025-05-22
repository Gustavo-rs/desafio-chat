import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/LoginPage.tsx";
import HomePage from "../pages/HomePage.tsx";

import { PrivateRoute } from "../components/PrivateRoute";
import RegisterPage from "../pages/auth/RegisterPage.tsx";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
