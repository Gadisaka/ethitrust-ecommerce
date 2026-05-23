import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAdminAuth } from "../../hooks/useAdminAuth";

const AdminLayout: React.FC = () => {
  const { requireAdmin } = useAdminAuth();

  // Check admin access
  if (!requireAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
