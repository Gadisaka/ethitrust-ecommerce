import { create } from "zustand";
import { API_URL } from "../../constants";

interface Product {
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
}

interface ProductStore {
  products: Product[];
  searchResults: Product[];
  searchQuery: string;
  fetchProducts: () => Promise<void>;
  searchProducts: (query: string) => void;
  clearSearch: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  searchResults: [],
  searchQuery: "",
  fetchProducts: async () => {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    set({ products: data });
  },
  searchProducts: (query: string) => {
    const { products } = get();
    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        (typeof product.category === "string"
          ? product.category.toLowerCase().includes(query.toLowerCase())
          : product.category?.name
              ?.toLowerCase()
              .includes(query.toLowerCase())) ||
        product.features.some((feature) =>
          feature.toLowerCase().includes(query.toLowerCase())
        )
    );
    set({ searchResults: filteredProducts, searchQuery: query });
  },
  clearSearch: () => {
    set({ searchResults: [], searchQuery: "" });
  },
}));
