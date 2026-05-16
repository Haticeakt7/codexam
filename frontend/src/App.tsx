import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import GuestRoute from "@/routes/GuestRoute";
import Spinner from "@/components/ui/Spinner";
import Toaster from "@/components/ui/Toaster";
import DemoBanner from "@/components/ui/DemoBanner";
import { usePreferencesSync } from "@/hooks/usePreferences";
import { useThemeStore } from "@/stores/themeStore";

// Public
const Home                = lazy(() => import("@/pages/Home"));
const QuizLanding         = lazy(() => import("@/pages/Quiz/QuizLanding"));
const QuizLandingByToken  = lazy(() => import("@/pages/Quiz/QuizLandingByToken"));
const QuizTake            = lazy(() => import("@/pages/Quiz/QuizTake"));
const NotFound            = lazy(() => import("@/pages/Error/NotFound"));
const Forbidden           = lazy(() => import("@/pages/Error/Forbidden"));

// Guest-only
const Login    = lazy(() => import("@/pages/Auth/Login"));
const Register = lazy(() => import("@/pages/Auth/Register"));

// Authenticated
const Profile = lazy(() => import("@/pages/Profile"));

// Dashboard (User + Admin)
const Dashboard       = lazy(() => import("@/pages/Dashboard"));
const NewQuiz         = lazy(() => import("@/pages/Dashboard/NewQuiz"));
const QuizSettings    = lazy(() => import("@/pages/Dashboard/QuizSettings"));
const QuizQuestions   = lazy(() => import("@/pages/Dashboard/QuizQuestions"));
const QuizMonitor     = lazy(() => import("@/pages/Dashboard/QuizMonitor"));
const QuizResults     = lazy(() => import("@/pages/Dashboard/QuizResults"));
const SubmissionReplay = lazy(() => import("@/pages/Dashboard/SubmissionReplay"));

// Admin
const AdminDashboard = lazy(() => import("@/pages/Admin"));

const PageLoader = (
  <div className="flex h-screen items-center justify-center bg-bg">
    <Spinner size="lg" />
  </div>
);

function AppContent() {
  useThemeStore(); // ensures dark class is applied on every page (not just dashboard)
  usePreferencesSync();

  return (
    <Suspense fallback={PageLoader}>
      <Routes>
        {/* Public */}
        <Route path="/"               element={<Home />} />
        <Route path="/q/join/:token"  element={<QuizLandingByToken />} />
        <Route path="/q/:id"          element={<QuizLanding />} />
        <Route path="/q/:id/take"     element={<QuizTake />} />
        <Route path="/403"            element={<Forbidden />} />
        <Route path="/404"            element={<NotFound />} />

        {/* Guest only */}
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Authenticated */}
        <Route path="/profile" element={
          <PrivateRoute roles={["User", "Admin"]}><Profile /></PrivateRoute>
        } />

        {/* Dashboard — User + Admin */}
        <Route path="/dashboard" element={
          <PrivateRoute roles={["User", "Admin"]}><Dashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/new" element={
          <PrivateRoute roles={["User", "Admin"]}><NewQuiz /></PrivateRoute>
        } />
        <Route path="/dashboard/quiz/:id/settings" element={
          <PrivateRoute roles={["User", "Admin"]}><QuizSettings /></PrivateRoute>
        } />
        <Route path="/dashboard/quiz/:id/questions" element={
          <PrivateRoute roles={["User", "Admin"]}><QuizQuestions /></PrivateRoute>
        } />
        <Route path="/dashboard/quiz/:id/monitor" element={
          <PrivateRoute roles={["User", "Admin"]}><QuizMonitor /></PrivateRoute>
        } />
        <Route path="/dashboard/quiz/:id/results" element={
          <PrivateRoute roles={["User", "Admin"]}><QuizResults /></PrivateRoute>
        } />
        <Route path="/dashboard/quiz/:id/replay/:sessionId" element={
          <PrivateRoute roles={["User", "Admin"]}><SubmissionReplay /></PrivateRoute>
        } />

        {/* Admin only */}
        <Route path="/admin/*" element={
          <PrivateRoute roles={["Admin"]}><AdminDashboard /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster />
      <DemoBanner />
    </BrowserRouter>
  );
}
