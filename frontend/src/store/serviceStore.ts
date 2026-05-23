import { create } from "zustand";
import { API_URL } from "../../constants";
import type { ReactNode } from "react";

export interface Service {
  _id: string;
  name: string;
  description: string;
  features?: string[];
  // Add other fields as needed
  icon?: ReactNode;
}

interface ServiceStore {
  services: Service[];
  fetchServices: () => Promise<void>;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  fetchServices: async () => {
    const res = await fetch(`${API_URL}/services`);
    const data = await res.json();
    set({ services: data });
  },
}));
