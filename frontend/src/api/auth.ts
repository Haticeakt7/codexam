import client from "./client";
import type { AuthUser, LoginResponse } from "./types";

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<LoginResponse>("/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    client.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    client.post<LoginResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  me: () =>
    client.get<AuthUser>("/auth/me").then((r) => r.data),
};
