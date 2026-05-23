import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
// Status controls omitted for single-item orders
import { Search, Package, User, Calendar } from "lucide-react";
import { Input } from "../../components/ui/input";
import { useOrderStore, OrderItem } from "../../store/orderStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useProductStore } from "../../store/productStore";

function isPopulatedUser(
  user: OrderItem["userId"]
): user is { _id: string; name: string; email: string } {
  return typeof user === "object" && user !== null && "email" in user;
}

type PopulatedProduct = {
  _id: string;
  name: string;
  price: number;
  image?: string[];
  category?: { _id: string; name: string } | string;
};

function isPopulatedProduct(
  product: OrderItem["productId"]
): product is PopulatedProduct {
  return typeof product === "object" && product !== null && "price" in product;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      image: string[];
    };
    quantity: number;
  }>;
  status?: string;
  createdAt: string;
}

const AdminOrders: React.FC = () => {
  const { adminOrders, fetchAllOrdersAdmin, loading } = useOrderStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { products, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    fetchAllOrdersAdmin();
    fetchCategories();
    fetchProducts();
  }, [fetchAllOrdersAdmin, fetchCategories, fetchProducts]);

  // Status updates not implemented here

  const formatETB = (amount: number) => `ETB ${amount.toFixed(2)}`;

  const filteredOrders = adminOrders.filter((order: OrderItem) => {
    const userName: string = isPopulatedUser(order.userId)
      ? order.userId.name
      : "";
    const userEmail: string = isPopulatedUser(order.userId)
      ? order.userId.email
      : "";
    const productName: string = isPopulatedProduct(order.productId)
      ? order.productId.name
      : "";
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      userName.toLowerCase().includes(term) ||
      userEmail.toLowerCase().includes(term) ||
      productName.toLowerCase().includes(term);

    const matchesCategory = selectedCategory
      ? isPopulatedProduct(order.productId) &&
        !!order.productId.category &&
        (typeof order.productId.category === "string"
          ? order.productId.category === selectedCategory
          : order.productId.category._id === selectedCategory)
      : true;

    const matchesProduct = selectedProduct
      ? (isPopulatedProduct(order.productId) &&
          order.productId._id === selectedProduct) ||
        (typeof order.productId === "string" &&
          order.productId === selectedProduct)
      : true;

    const created = new Date(order.createdAt).getTime();
    const fromOk = dateFrom ? created >= new Date(dateFrom).getTime() : true;
    const toOk = dateTo ? created <= new Date(dateTo).getTime() : true;

    const price = order.totalMoney;
    const minOk = priceMin ? price >= parseFloat(priceMin) : true;
    const maxOk = priceMax ? price <= parseFloat(priceMax) : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesProduct &&
      fromOk &&
      toOk &&
      minOk &&
      maxOk
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Manage customer orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2 flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min Price"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max Price"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <Card key={order._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Order #{order._id.slice(-8)}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {isPopulatedUser(order.userId) ? order.userId.name : ""}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Status controls omitted */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Order Item:
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        {isPopulatedProduct(order.productId) &&
                        order.productId.image?.[0] ? (
                          <img
                            src={order.productId.image[0]}
                            alt={order.productId.name}
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-500 m-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isPopulatedProduct(order.productId)
                            ? order.productId.name
                            : (order.productId as string)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {order.amount}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {isPopulatedProduct(order.productId)
                          ? `ETB ${order.productId.price.toFixed(2)}`
                          : "ETB —"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: ETB {order.totalMoney.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Customer Email:</p>
                      <p className="font-medium">
                        {isPopulatedUser(order.userId)
                          ? order.userId.email
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount:</p>
                      <p className="text-xl font-bold text-gray-900">
                        ETB {order.totalMoney.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
