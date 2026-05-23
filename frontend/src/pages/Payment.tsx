import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Banknote } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { useAppContext } from "../context/AppContext";
import { useOrderStore, OrderItem } from "../store/orderStore";
import EscrowTimeline from "../components/common/EscrowTimeline";

function generateCheckoutId() {
  return crypto.randomUUID();
}

const Payment = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const {
    checkoutEscrow,
    createOrdersFromCart,
    verifyPayment,
    pollEscrowStatus,
    stopEscrowPoll,
    escrowLoading,
    loading,
  } = useOrderStore();

  const checkoutIdRef = useRef(generateCheckoutId());
  const [submitError, setSubmitError] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "error"; message: string } | null>(null);
  const [escrowResult, setEscrowResult] = useState<{
    escrowId: string;
    orders: OrderItem[];
    inspectionPeriodHours?: number;
  } | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<OrderItem | null>(null);

  const [bankProvider, setBankProvider] = useState<"cbe" | "telebirr">("cbe");
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [bankOrderIds, setBankOrderIds] = useState<string[]>([]);
  const [bankStep, setBankStep] = useState<"create" | "verify" | "done">("create");

  const feedbackTimerRef = useRef<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);

  const subtotal = state.cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = subtotal;
  const inspectionHours = 72;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
      if (trackedOrder) stopEscrowPoll(trackedOrder._id);
    };
  }, [trackedOrder, stopEscrowPoll]);

  if (state.cart.length === 0 && !escrowResult && bankStep !== "done") {
    navigate("/cart");
    return null;
  }

  const orderSummary = (
    <Card className="card-elevated sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {state.cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="line-clamp-1">{item.name} × {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-4 flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const showError = (message: string) => {
    setSubmitError(message);
    setFeedback({ kind: "error", message });
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 5000);
  };

  const handleStartEscrow = async () => {
    setSubmitError("");
    setFeedback(null);
    try {
      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Please log in to complete checkout.");
      const user = JSON.parse(stored);
      if (!user?.token) throw new Error("Missing auth token.");

      const items = state.cart.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
      }));

      const result = await checkoutEscrow(items, checkoutIdRef.current);
      setEscrowResult({
        escrowId: result.escrowId,
        orders: result.orders,
        inspectionPeriodHours: result.inspectionPeriodHours ?? inspectionHours,
      });
      dispatch({ type: "CLEAR_CART" });

      const firstOrder = result.orders[0];
      if (firstOrder) {
        setTrackedOrder(firstOrder);
        pollEscrowStatus(firstOrder._id, 8000, setTrackedOrder);
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCreateBankOrders = async () => {
    setSubmitError("");
    try {
      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Please log in to complete checkout.");
      const orders = await createOrdersFromCart(
        state.cart.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
        }))
      );
      setBankOrderIds(orders.map((o) => o._id));
      setBankStep("verify");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleVerifyBankPayment = async () => {
    setSubmitError("");
    try {
      if (!transactionId.trim()) throw new Error("Transaction ID is required.");
      await verifyPayment(
        bankOrderIds,
        transactionId.trim(),
        bankProvider,
        payerName || undefined,
        payerAccountNumber || undefined
      );
      dispatch({ type: "CLEAR_CART" });
      setBankStep("done");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : String(err));
    }
  };

  if (escrowResult) {
    const order = trackedOrder || escrowResult.orders[0];
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Escrow started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Ethitrust is holding funds for your order. Complete any steps in
                Ethitrust when prompted. Status updates automatically below.
              </p>
              <Badge variant="secondary" className="font-mono text-xs break-all">
                {escrowResult.escrowId}
              </Badge>
              {order && (
                <EscrowTimeline
                  orderStatus={order.orderStatus}
                  escrowStatus={order.escrowStatus}
                  inspectionPeriodHours={
                    order.inspectionPeriodHours ??
                    escrowResult.inspectionPeriodHours
                  }
                  escrowCreatedAt={order.escrowCreatedAt}
                  escrowCompletedAt={order.escrowCompletedAt}
                />
              )}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 btn-primary" onClick={() => navigate("/profile")}>
                  View orders
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bankStep === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-lg card-elevated">
          <CardHeader>
            <CardTitle>Payment verified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your bank payment was verified. Order status will update in your profile.
            </p>
            <Button className="w-full" onClick={() => navigate("/profile")}>
              View orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Checkout</h1>
          <p className="text-xl text-primary-foreground/90">
            Secure checkout with buyer protection
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>

        {feedback?.kind === "error" && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="escrow">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="escrow" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Ethitrust Escrow
                </TabsTrigger>
                <TabsTrigger value="bank" className="gap-2">
                  <Banknote className="h-4 w-4" />
                  Bank / Telebirr
                </TabsTrigger>
              </TabsList>

              <TabsContent value="escrow">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      Ethitrust escrow
                      <Badge variant="outline">{inspectionHours}h inspection</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      Funds are held in Ethitrust escrow until delivery milestones
                      complete. The seller receives an email invite. Your payment is
                      protected for the full inspection period.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                      <li>Buyer protection until escrow releases</li>
                      <li>Seller must accept the escrow invite</li>
                      <li>Status syncs automatically via webhook</li>
                    </ul>
                    {submitError && (
                      <p className="text-sm text-destructive">{submitError}</p>
                    )}
                    <Button
                      className="w-full btn-primary text-lg py-6"
                      disabled={escrowLoading}
                      onClick={handleStartEscrow}
                    >
                      {escrowLoading ? "Creating escrow…" : "Start escrow checkout"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>CBE / Telebirr</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bankStep === "create" ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Create orders first, then pay via CBE or Telebirr and submit
                          your transaction reference for verification.
                        </p>
                        <Button
                          className="w-full"
                          disabled={loading}
                          onClick={handleCreateBankOrders}
                        >
                          {loading ? "Creating orders…" : "Create orders & continue"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Payment provider</Label>
                          <Select
                            value={bankProvider}
                            onValueChange={(v) =>
                              setBankProvider(v as "cbe" | "telebirr")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cbe">CBE</SelectItem>
                              <SelectItem value="telebirr">Telebirr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="txId">Transaction ID</Label>
                          <Input
                            id="txId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Reference from your payment"
                          />
                        </div>
                        {bankProvider === "cbe" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="payerName">Payer name</Label>
                              <Input
                                id="payerName"
                                value={payerName}
                                onChange={(e) => setPayerName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payerAcct">Payer account</Label>
                              <Input
                                id="payerAcct"
                                value={payerAccountNumber}
                                onChange={(e) =>
                                  setPayerAccountNumber(e.target.value)
                                }
                              />
                            </div>
                          </>
                        )}
                        <Button
                          className="w-full"
                          disabled={loading}
                          onClick={handleVerifyBankPayment}
                        >
                          {loading ? "Verifying…" : "Verify payment"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>{orderSummary}</div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
