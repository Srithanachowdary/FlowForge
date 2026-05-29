import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Common / Layout Components
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";

// App Pages
import Dashboard from "./pages/dashboard/Dashboard";
import ProjectList from "./pages/project/ProjectList";
import ProjectBoard from "./pages/project/ProjectBoard";
import SprintPage from "./pages/sprint/SprintPage";
import MembersPage from "./pages/members/MembersPage";
import BillingPage from "./pages/billing/BillingPage";
import WorkspaceSetup from "./pages/workspace/WorkspaceSetup";
import WorkspaceSettings from "./pages/workspace/WorkspaceSettings";

import "./App.css";

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: "#11131e",
            color: "#f3f4f6",
            border: "1px solid #1e2235"
          }
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Setup workspace if none active */}
          <Route path="/workspace-setup" element={<WorkspaceSetup />} />

          {/* Core Dashboard / Workspace Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/board" element={<ProjectBoard />} />
            <Route path="/sprints" element={<SprintPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/workspace-settings" element={<WorkspaceSettings />} />
          </Route>
        </Route>

        {/* Redirect Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
