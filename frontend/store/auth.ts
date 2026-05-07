"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  async login(email, password) {
    set({ loading: true });
    const data = await apiFetch<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("access_token", data.access_token);
    set({ token: data.access_token, loading: false });
    await useAuthStore.getState().loadUser();
  },
  async register(email, password) {
    set({ loading: true });
    const data = await apiFetch<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("access_token", data.access_token);
    set({ token: data.access_token, loading: false });
    await useAuthStore.getState().loadUser();
  },
  async loadUser() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const user = await apiFetch<User>("/api/auth/me");
    set({ user, token });
  },
  logout() {
    localStorage.removeItem("access_token");
    set({ user: null, token: null });
  }
}));
