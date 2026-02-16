import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import Login from "./pages/LoginPage";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import ProjectTasksPage from "./pages/Tasks";
import Projects from "./pages/Projects";
import ClientsPage from "./pages/Clients";
import Factures from "./pages/Factures";
import Notes from "./pages/Notes";
import AccountSettings from "./pages/AccountSettings";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="projects" element={<Projects />} />
          <Route
            path="projects/:projectId/tasks"
            element={<ProjectTasksPage />}
          />
          <Route path="factures" element={<Factures />} />
          <Route path="notes" element={<Notes />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        {/* redirection */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
