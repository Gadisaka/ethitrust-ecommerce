import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const useAdminAuth = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user && user.role === "admin") {
      // Redirect admin users to admin dashboard after login
      const currentPath = window.location.pathname;
      if (currentPath === "/login" || currentPath === "/") {
        navigate("/admin");
      }
    }
  }, [user, navigate]);

  const requireAdmin = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    if (user.role !== "admin") {
      navigate("/");
      return false;
    }
    return true;
  };

  return {
    isAdmin,
    requireAdmin,
    user,
  };
};
