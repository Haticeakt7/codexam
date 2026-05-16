import client from "./client";
import type { UserPreferences } from "./types";

export const preferencesApi = {
  get: () =>
    client.get<UserPreferences>("/users/me/preferences").then((r) => r.data),

  update: (data: UserPreferences) =>
    client.put<UserPreferences>("/users/me/preferences", data).then((r) => r.data),
};
