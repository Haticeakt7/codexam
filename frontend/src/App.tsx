import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import GuestRoute from "@/routes/GuestRoute";
import Spinner from "@/components/ui/Spinner";

const Home          = lazy(() => import("@/pages/Home"));
const Login         = lazy(() => import("@/pages/Auth/Login"));
const Register      = lazy(() => import("@/pages/Auth/Register"));
const QuizLanding   = lazy(() => import("@/pages/Quiz/QuizLanding"));
const QuizTake      = lazy(() => import("@/pages/Quiz/QuizTake"));
const Dashboard     = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/pages/Admin"));
const NotFound      = lazy(() => import("@/pages/Error/NotFound"));
const Forbidden     = lazy(() => import("@/pages/Error/Forbidden"));

const PageLoader = (
  <div className="flex h-screen items-center justify-center bg-bg">
    <Spinner size="lg" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={PageLoader}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/q/:id" element={<QuizLanding />} />
          <Route path="/q/:id/take" element={<QuizTake />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/404" element={<NotFound />} />

          {/* Guest only */}
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* User + Admin */}
          <Route path="/dashboard/*" element={
            <PrivateRoute roles={["User", "Admin"]}><Dashboard /></PrivateRoute>
          } />

          {/* Admin only */}
          <Route path="/admin/*" element={
            <PrivateRoute roles={["Admin"]}><AdminDashboard /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
