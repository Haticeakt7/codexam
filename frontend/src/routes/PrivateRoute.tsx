import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore, type UserRole } from "@/stores/authStore";

interface Props {
  roles: UserRole[];
  children: ReactNode;
}

export default function PrivateRoute({ roles, children }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !roles.includes(user.role)) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
