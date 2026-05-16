import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "Admin" | "User";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  setToken: (token: string) => void;
  setDisplayName: (displayName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      setToken: (accessToken) =>
        set({ accessToken }),

      setDisplayName: (displayName) =>
        set((state) => state.user ? { user: { ...state.user, displayName } } : {}),

      logout: () => {
        localStorage.removeItem("codexam_refresh");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    { name: "codexam_auth" }
  )
);
