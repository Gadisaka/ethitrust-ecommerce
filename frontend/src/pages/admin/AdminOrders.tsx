import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Search, Package, User, Calendar, RefreshCw, Truck } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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

const AdminOrders: React.FC = () => {
  const {
    adminOrders,
    fetchAllOrdersAdmin,
    loading,
    syncEscrowAdmin,
    updateShipmentAdmin,
  } = useOrderStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { products, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [escrowFilter, setEscrowFilter] = useState("");
  const [disputedOnly, setDisputedOnly] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllOrdersAdmin();
    fetchCategories();
    fetchProducts();
  }, [fetchAllOrdersAdmin, fetchCategories, fetchProducts]);

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
      productName.toLowerCase().includes(term) ||
      (order.ethitrustEscrowId || "").toLowerCase().includes(term);

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

    const matchesEscrow =
      !escrowFilter ||
      order.paymentProvider === "ethitrust" ||
      (escrowFilter === "non-escrow" && order.paymentProvider !== "ethitrust");

    if (escrowFilter === "ethitrust" && order.paymentProvider !== "ethitrust") {
      return false;
    }

    const matchesDisputed =
      !disputedOnly || order.orderStatus === "DISPUTED";

    return (
      matchesSearch &&
      matchesCategory &&
      matchesProduct &&
      fromOk &&
      toOk &&
      minOk &&
      maxOk &&
      matchesEscrow &&
      matchesDisputed
    );
  });

  const handleSync = async (orderId: string) => {
    setSyncingId(orderId);
    await syncEscrowAdmin(orderId);
    setSyncingId(null);
  };

  const handleShipment = async (orderId: string) => {
    const tracking = trackingInputs[orderId]?.trim();
    if (!tracking) return;
    await updateShipmentAdmin(orderId, tracking);
    setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
  };

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
          <p className="text-gray-600 mt-2">Manage customer orders and escrow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2 flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search orders, escrow ID..."
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
            value={escrowFilter}
            onChange={(e) => setEscrowFilter(e.target.value)}
          >
            <option value="">All payments</option>
            <option value="ethitrust">Ethitrust only</option>
            <option value="non-escrow">Non-escrow</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="disputedOnly"
            checked={disputedOnly}
            onChange={(e) => setDisputedOnly(e.target.checked)}
          />
          <Label htmlFor="disputedOnly">Disputed only</Label>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <Card key={order._id}>
            <CardHeader>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center space-x-2 flex-wrap">
                    <Package className="w-5 h-5" />
                    <span>Order #{order._id.slice(-8)}</span>
                    <Badge variant="secondary">
                      {order.orderStatus?.replace(/_/g, " ") || order.paymentStatus}
                    </Badge>
                    {order.paymentProvider === "ethitrust" && (
                      <Badge variant="outline">Escrow</Badge>
                    )}
                    {order.orderStatus === "DISPUTED" && (
                      <Badge variant="destructive">Dispute</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2 flex-wrap">
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
                    {order.ethitrustEscrowId && (
                      <span className="text-xs font-mono text-muted-foreground break-all">
                        {order.ethitrustEscrowId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.paymentProvider === "ethitrust" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncingId === order._id}
                      onClick={() => handleSync(order._id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {syncingId === order._id ? "Syncing…" : "Sync escrow"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                          : String(order.productId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {order.amount} · ETB {order.totalMoney.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {order.paymentProvider === "ethitrust" &&
                  !["SHIPPED", "DELIVERED", "ESCROW_COMPLETED", "CANCELLED", "EXPIRED"].includes(
                    order.orderStatus || ""
                  ) && (
                    <div className="flex flex-col sm:flex-row gap-2 items-end border-t pt-4">
                      <div className="flex-1 w-full">
                        <Label htmlFor={`track-${order._id}`}>Shipment tracking</Label>
                        <Input
                          id={`track-${order._id}`}
                          placeholder="Tracking number"
                          value={trackingInputs[order._id] || ""}
                          onChange={(e) =>
                            setTrackingInputs((prev) => ({
                              ...prev,
                              [order._id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleShipment(order._id)}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Mark shipped
                      </Button>
                    </div>
                  )}

                {order.shipmentTracking && (
                  <p className="text-sm text-muted-foreground">
                    Tracking: {order.shipmentTracking}
                  </p>
                )}

                <div className="border-t pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Customer Email:</p>
                    <p className="font-medium">
                      {isPopulatedUser(order.userId) ? order.userId.email : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last synced:</p>
                    <p className="text-sm">
                      {order.escrowLastSyncedAt
                        ? new Date(order.escrowLastSyncedAt).toLocaleString()
                        : "—"}
                    </p>
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
