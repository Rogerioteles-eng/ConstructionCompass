// src/routes/index.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Users from "../pages/Users";
import Dashboard from "../pages/Dashboard";
import { ProtectedRoute } from "../auth/protectedRoute";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "comprador", "mestre", "trabalhador"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
