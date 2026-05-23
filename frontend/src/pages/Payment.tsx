import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAppContext } from "../context/AppContext";
import { API_URL } from "../../constants";

const Payment = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [feedback, setFeedback] = useState<{ kind: "error"; message: string } | null>(null);
  const [escrowStarted, setEscrowStarted] = useState(false);
  const [lastEscrowId, setLastEscrowId] = useState<string | null>(null);
  const feedbackTimerRef = React.useRef<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = state.cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = subtotal;

  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  if (escrowStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg card-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">Escrow started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Ethitrust was asked to hold funds for this order. The seller
              receives an email invite. Complete any remaining steps in Ethitrust.
              When the escrow completes, your order is updated automatically.
            </p>
            {lastEscrowId && (
              <p className="text-xs font-mono text-muted-foreground break-all">
                Escrow ID: {lastEscrowId}
              </p>
            )}
            <Button className="w-full btn-primary" onClick={() => navigate("/")}>
              Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.cart.length === 0 && !escrowStarted) {
    navigate("/cart");
    return null;
  }

  const handleStartEscrow = async () => {
    setSubmitError("");
    setFeedback(null);
    setSubmitting(true);
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        throw new Error("Please log in to complete checkout.");
      }
      const user = JSON.parse(stored);
      const token = user?.token as string | undefined;
      if (!token) {
        throw new Error("Missing auth token.");
      }

      const items = state.cart.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
      }));

      const createRes = await fetch(`${API_URL}/orders/checkout-escrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const created = await createRes.json();
      if (!createRes.ok) {
        throw new Error(
          created?.message ||
            created?.error ||
            "Failed to create Ethitrust escrow."
        );
      }

      if (created?.escrowId) {
        setLastEscrowId(String(created.escrowId));
      }
      setEscrowStarted(true);
      dispatch({ type: "CLEAR_CART" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      setFeedback({ kind: "error", message });
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Checkout</h1>
          <p className="text-xl text-primary-foreground/90">
            Secure payment held in Ethitrust escrow
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

        {feedback && feedback.kind === "error" && (
          <div className="fixed top-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
            <Card className="relative shadow-lg border-rose-500 bg-rose-50">
              <button
                aria-label="Close notification"
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (feedbackTimerRef.current) {
                    window.clearTimeout(feedbackTimerRef.current);
                    feedbackTimerRef.current = null;
                  }
                  setFeedback(null);
                }}
              >
                ×
              </button>
              <CardContent className="py-4 pr-8">
                <div className="text-sm text-rose-700">{feedback.message}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  Ethitrust escrow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Proceeding creates a one-time Ethitrust escrow for your cart
                  total. The seller receives an invite by email to accept the
                  escrow. Funds are protected until milestones in the escrow
                  workflow complete. Your order is marked paid when Ethitrust
                  sends the <span className="font-medium">escrow.completed</span>{" "}
                  event to our server.
                </p>
                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full btn-primary text-lg py-6"
                  disabled={submitting}
                  onClick={handleStartEscrow}
                >
                  {submitting ? "Creating escrow…" : "Start escrow checkout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
