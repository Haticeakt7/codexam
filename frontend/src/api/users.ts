import client from "./client";

export const usersApi = {
  updateDisplayName: (displayName: string) =>
    client.put<{ displayName: string }>("/users/me", { displayName }).then((r) => r.data),

  updatePassword: (currentPassword: string, newPassword: string) =>
    client.put("/users/me/password", { currentPassword, newPassword }),
};
