import { create } from "zustand";
import { API_URL } from "../../constants";

interface CartItemInput {
  id: string;
  quantity: number;
  price: number;
}

export interface OrderItem {
  _id: string;
  productId:
    | {
        _id: string;
        name: string;
        price: number;
        image?: string[];
      }
    | string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  amount: number;
  totalMoney: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderStore {
  loading: boolean;
  error: string | null;
  orders: OrderItem[];
  createOrdersFromCart: (items: CartItemInput[]) => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  adminOrders: OrderItem[];
  fetchAllOrdersAdmin: () => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  loading: false,
  error: null,
  orders: [],
  adminOrders: [],

  createOrdersFromCart: async (items) => {
    if (!items || items.length === 0) return;
    set({ loading: true, error: null });
    try {
      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Not authenticated");
      const user = JSON.parse(stored);
      const token = user?.token as string | undefined;
      if (!token) throw new Error("Missing token");

      const results = await Promise.all(
        items.map(async (it) => {
          const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: it.id,
              amount: it.quantity,
              totalMoney: it.quantity * it.price,
            }),
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(data.message || "Failed to create order");
          return data;
        })
      );

      void results; // suppress unused var; could store if needed
      set({ loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, loading: false });
      throw err;
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Not authenticated");
      const user = JSON.parse(stored);
      const token = user?.token as string | undefined;
      if (!token) throw new Error("Missing token");

      const res = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      set({ orders: data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, loading: false });
    }
  },

  fetchAllOrdersAdmin: async () => {
    set({ loading: true, error: null });
    try {
      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Not authenticated");
      const user = JSON.parse(stored);
      const token = user?.token as string | undefined;
      if (!token) throw new Error("Missing token");

      const res = await fetch(`${API_URL}/orders/getallorders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch all orders");
      set({ adminOrders: data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, loading: false });
    }
  },
}));
