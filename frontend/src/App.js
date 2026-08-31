import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LangProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import HeritageDetail from "@/pages/HeritageDetail";
import AskAI from "@/pages/AskAI";
import HeritageLens from "@/pages/HeritageLens";
import Calendar from "@/pages/Calendar";
import HeritageAtRisk from "@/pages/HeritageAtRisk";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import MyVirana from "@/pages/MyVirana";
import SettingsPage from "@/pages/SettingsPage";
import FestivalDetail from "@/pages/FestivalDetail";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="py-32 text-center text-muted-foreground" data-testid="auth-loading">Loading your Virana...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="App min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/heritage/:id" element={<HeritageDetail />} />
                  <Route path="/ask" element={<AskAI />} />
                  <Route path="/ask-virana" element={<AskAI />} />
                  <Route path="/lens" element={<HeritageLens />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/at-risk" element={<HeritageAtRisk />} />
                  <Route path="/heritage-at-risk" element={<HeritageAtRisk />} />
                  <Route path="/festival/:id" element={<FestivalDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/my-virana" element={<Protected><MyVirana /></Protected>} />
                  <Route path="/profile" element={<Protected><MyVirana /></Protected>} />
                  <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="bottom-right" />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;
