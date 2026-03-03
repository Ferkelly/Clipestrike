import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RedirectPage from "./pages/RedirectPage";
import GoogleAccountSelectorPage from "./pages/GoogleAccountSelectorPage";
import GooglePermissionsPage from "./pages/GooglePermissionsPage";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import { ConnectChannelPage } from "./pages/SetupPages";
import SetupPlatformsPage from "./pages/SetupPlatformsPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { Zap } from "lucide-react";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("clipstrike_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/redirect" element={<RedirectPage />} />
        <Route path="/auth/google/accounts" element={<GoogleAccountSelectorPage />} />
        <Route path="/auth/google/permissions" element={<GooglePermissionsPage />} />

        {/* App Onboarding Flow */}
        <Route path="/app/canais" element={
          <PrivateRoute><ConnectChannelPage /></PrivateRoute>
        } />
        <Route path="/app/plataformas" element={
          <PrivateRoute><SetupPlatformsPage /></PrivateRoute>
        } />

        {/* Dashboard & Settings */}
        <Route path="/app/dashboard/configuracoes" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/app/dashboard/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
        <Route path="/app/dashboard/*" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
