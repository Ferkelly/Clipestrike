import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, SignupPage } from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { ProcessPage } from "./pages/ProcessPage";
import LandingPage from "./pages/LandingPage";
import { ConnectChannelPage, ConnectPlatformsPage } from "./pages/SetupPage";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Captura ?token= e redireciona para /dashboard
function AuthSuccess() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/channel/:channelId" element={<ProtectedRoute><ProcessPage /></ProtectedRoute>} />
        <Route path="/setup/platforms" element={<ProtectedRoute><ConnectPlatformsPage /></ProtectedRoute>} />
        <Route path="/setup/channel" element={<ProtectedRoute><ConnectChannelPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
