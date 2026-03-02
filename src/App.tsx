import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import { ConnectChannelPage, ConnectPlatformsPage } from "./pages/SetupPages";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Onboarding */}
        <Route path="/setup/channel" element={
          <PrivateRoute><ConnectChannelPage /></PrivateRoute>
        } />
        <Route path="/setup/platforms" element={
          <PrivateRoute><ConnectPlatformsPage /></PrivateRoute>
        } />

        {/* App */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
