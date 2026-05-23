import { create } from "zustand";
import { API_URL } from "../../constants";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
}

const getInitialUser = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user");
    if (stored) return JSON.parse(stored);
  }
  return null;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: getInitialUser(),
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      const userData = { ...data.user, token: data.token };
      set({ user: userData, loading: false });
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect admin users to admin dashboard
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, loading: false });
    }
  },
  signup: async (name, email, password, phone) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      // Don't auto-login after signup, just clear loading and error
      set({ user: null, loading: false, error: null });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, loading: false });
    }
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem("user");
  },
}));
