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
  orderStatus?: string;
  paymentStatus?: string;
  paymentProvider?: string;
  escrowStatus?: string;
  ethitrustEscrowId?: string;
  escrowId?: string;
  inspectionPeriodHours?: number;
  escrowCreatedAt?: string;
  escrowCompletedAt?: string;
  escrowLastSyncedAt?: string;
  shipmentTracking?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface EscrowCheckoutResult {
  orders: OrderItem[];
  escrowId: string;
  orderStatus?: string;
  inspectionPeriodHours?: number;
  idempotent?: boolean;
}

interface OrderStore {
  loading: boolean;
  error: string | null;
  orders: OrderItem[];
  adminOrders: OrderItem[];
  escrowLoading: boolean;
  activeEscrowPolls: Record<string, ReturnType<typeof setInterval>>;
  createOrdersFromCart: (items: CartItemInput[]) => Promise<OrderItem[]>;
  checkoutEscrow: (
    items: { productId: string; quantity: number }[],
    checkoutId: string
  ) => Promise<EscrowCheckoutResult>;
  verifyPayment: (
    orderIds: string[],
    transactionId: string,
    provider: "cbe" | "telebirr",
    payerName?: string,
    payerAccountNumber?: string
  ) => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  fetchAllOrdersAdmin: () => Promise<void>;
  fetchEscrowStatus: (orderId: string) => Promise<OrderItem | null>;
  pollEscrowStatus: (
    orderId: string,
    intervalMs?: number,
    onUpdate?: (order: OrderItem) => void
  ) => void;
  stopEscrowPoll: (orderId: string) => void;
  syncEscrowAdmin: (orderId: string) => Promise<OrderItem | null>;
  updateShipmentAdmin: (
    orderId: string,
    shipmentTracking: string
  ) => Promise<void>;
}

function getAuthToken(): string {
  const stored = localStorage.getItem("user");
  if (!stored) throw new Error("Not authenticated");
  const user = JSON.parse(stored);
  const token = user?.token as string | undefined;
  if (!token) throw new Error("Missing token");
  return token;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  loading: false,
  error: null,
  orders: [],
  adminOrders: [],
  escrowLoading: false,
  activeEscrowPolls: {},

  createOrdersFromCart: async (items) => {
    if (!items || items.length === 0) return [];
    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.id,
            quantity: it.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create orders");
      set({ loading: false });
      return data.orders as OrderItem[];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, loading: false });
      throw err;
    }
  },

  checkoutEscrow: async (items, checkoutId) => {
    set({ escrowLoading: true, error: null });
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders/checkout-escrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, checkoutId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to create Ethitrust escrow."
        );
      }
      set({ escrowLoading: false });
      return data as EscrowCheckoutResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, escrowLoading: false });
      throw err;
    }
  },

  verifyPayment: async (
    orderIds,
    transactionId,
    provider,
    payerName,
    payerAccountNumber
  ) => {
    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders/verify-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderIds,
          transactionId,
          provider,
          payerName,
          payerAccountNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
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
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders/getallorders`, {
        headers: { Authorization: `Bearer ${token}` },
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

  fetchEscrowStatus: async (orderId) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/orders/${orderId}/escrow-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch status");
      const order = data.order as OrderItem;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === orderId ? order : o)),
      }));
      return order;
    } catch {
      return null;
    }
  },

  pollEscrowStatus: (orderId, intervalMs = 8000, onUpdate) => {
    const existing = get().activeEscrowPolls[orderId];
    if (existing) clearInterval(existing);

    const poll = async () => {
      const order = await get().fetchEscrowStatus(orderId);
      if (order && onUpdate) onUpdate(order);
      const terminal = ["ESCROW_COMPLETED", "CANCELLED", "EXPIRED", "DISPUTED"];
      if (order?.orderStatus && terminal.includes(order.orderStatus)) {
        get().stopEscrowPoll(orderId);
      }
    };

    void poll();
    const handle = setInterval(poll, intervalMs);
    set((state) => ({
      activeEscrowPolls: { ...state.activeEscrowPolls, [orderId]: handle },
    }));
  },

  stopEscrowPoll: (orderId) => {
    const handle = get().activeEscrowPolls[orderId];
    if (handle) clearInterval(handle);
    set((state) => {
      const next = { ...state.activeEscrowPolls };
      delete next[orderId];
      return { activeEscrowPolls: next };
    });
  },

  syncEscrowAdmin: async (orderId) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/sync-escrow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sync failed");
      const order = data.order as OrderItem;
      set((state) => ({
        adminOrders: state.adminOrders.map((o) =>
          o._id === orderId ? order : o
        ),
      }));
      return order;
    } catch {
      return null;
    }
  },

  updateShipmentAdmin: async (orderId, shipmentTracking) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/shipment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipmentTracking }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update shipment");
    set((state) => ({
      adminOrders: state.adminOrders.map((o) =>
        o._id === orderId ? (data as OrderItem) : o
      ),
    }));
  },
}));
