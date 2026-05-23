import { create } from "zustand";
import { API_URL } from "../../constants";

interface Favorite {
  _id: string;
  user: string;
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string[];
    category: { _id: string; name: string } | string;
    description: string;
    features: string[];
    inStock: boolean;
    isNew?: boolean;
    onSale?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface FavoriteStore {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  fetchFavorites: () => Promise<void>;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  checkFavorite: (productId: string) => Promise<boolean>;
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  fetchFavorites: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("user");
      if (!token) {
        set({ loading: false, error: "No authentication token" });
        return;
      }

      const userData = JSON.parse(token);
      const res = await fetch(`${API_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await res.json();
      set({ favorites: data, loading: false });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, loading: false });
    }
  },

  addToFavorites: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("user");
      if (!token) {
        set({ loading: false, error: "No authentication token" });
        return;
      }

      const userData = JSON.parse(token);
      const res = await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add to favorites");
      }

      const newFavorite = await res.json();
      set((state) => ({
        favorites: [...state.favorites, newFavorite],
        loading: false,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, loading: false });
    }
  },

  removeFromFavorites: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem("user");
      if (!token) {
        set({ loading: false, error: "No authentication token" });
        return;
      }

      const userData = JSON.parse(token);
      const res = await fetch(`${API_URL}/favorites/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove from favorites");
      }

      set((state) => ({
        favorites: state.favorites.filter(
          (fav) => fav.product._id !== productId
        ),
        loading: false,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, loading: false });
    }
  },

  checkFavorite: async (productId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("user");
      if (!token) return false;

      const userData = JSON.parse(token);
      const res = await fetch(`${API_URL}/favorites/${productId}/check`, {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      if (!res.ok) return false;

      const data = await res.json();
      return data.isFavorite;
    } catch (err: unknown) {
      return false;
    }
  },
}));
