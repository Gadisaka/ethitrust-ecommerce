import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string[];
  category: string;
  description: string;
  features: string[];
  inStock: boolean;
  isNew?: boolean;
  onSale?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AppState {
  cart: CartItem[];
  favorites: Product[];
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    createdAt?: string;
  } | null;
}

type AppAction =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "UPDATE_CART_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "ADD_TO_FAVORITES"; product: Product }
  | { type: "REMOVE_FROM_FAVORITES"; productId: string }
  | { type: "SET_USER"; user: AppState["user"] }
  | { type: "LOGOUT" }
  | { type: "SET_CART"; cart: CartItem[] };

// Helper function to get initial cart from localStorage
const getInitialCart = (): CartItem[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }
  return [];
};

const initialState: AppState = {
  cart: getInitialCart(),
  favorites: [],
  user: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.cart.find(
        (item) => item.id === action.product.id
      );
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.product, quantity: 1 }],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.productId),
      };

    case "UPDATE_CART_QUANTITY":
      if (action.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter((item) => item.id !== action.productId),
        };
      }
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "SET_CART":
      return { ...state, cart: action.cart };

    case "ADD_TO_FAVORITES":
      if (state.favorites.find((item) => item.id === action.product.id)) {
        return state;
      }
      return {
        ...state,
        favorites: [...state.favorites, action.product],
      };

    case "REMOVE_FROM_FAVORITES":
      return {
        ...state,
        favorites: state.favorites.filter(
          (item) => item.id !== action.productId
        ),
      };

    case "SET_USER":
      return { ...state, user: action.user };

    case "LOGOUT":
      return { ...state, user: null };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user._id && user.name && user.email) {
          dispatch({
            type: "SET_USER",
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              createdAt: user.createdAt,
            },
          });
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cart", JSON.stringify(state.cart));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [state.cart]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
