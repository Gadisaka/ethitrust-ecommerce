import { create } from "zustand";
import { API_URL } from "../../constants";

interface Category {
  _id: string;
  name: string;
}

interface CategoryStore {
  categories: Category[];
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  fetchCategories: async () => {
    const res = await fetch(`${API_URL}/categories`);
    const data = await res.json();
    set({ categories: data });
  },
}));
