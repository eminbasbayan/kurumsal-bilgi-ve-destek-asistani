import type { Employee } from "../types";
import { api, clearToken, setToken } from "./client";

export type LoginResponse = {
  token: string;
  demo: true;
  message: string;
  employee: Employee;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const result = await api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await api<void>("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export function getProfile(): Promise<Employee> {
  return api<Employee>("/api/profile");
}
