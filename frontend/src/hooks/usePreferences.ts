import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Call this once at the app root after login.
 * Loads server preferences and merges with local state.
 */
export function usePreferencesSync() {
  const { loadFromServer } = usePreferencesStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      loadFromServer();
    }
  }, [user, loadFromServer]);
}
