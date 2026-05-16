import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={user?.role === "Admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
