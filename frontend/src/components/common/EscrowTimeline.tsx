import React from "react";
import { Badge } from "../ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PENDING", label: "Order Created" },
  { key: "ESCROW_CREATED", label: "Escrow Created" },
  { key: "ESCROW_INVITED", label: "Seller Invited" },
  { key: "ESCROW_ACTIVE", label: "Escrow Active" },
  { key: "SELLER_PROCESSING", label: "Seller Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "ESCROW_COMPLETED", label: "Escrow Released" },
];

const STATUS_RANK: Record<string, number> = STEPS.reduce(
  (acc, step, idx) => ({ ...acc, [step.key]: idx }),
  {} as Record<string, number>
);

STATUS_RANK.DISPUTED = 6;
STATUS_RANK.CANCELLED = -1;
STATUS_RANK.EXPIRED = -1;
STATUS_RANK.PAYMENT_PENDING = 0;

interface EscrowTimelineProps {
  orderStatus?: string;
  escrowStatus?: string;
  inspectionPeriodHours?: number;
  escrowCreatedAt?: string;
  escrowCompletedAt?: string;
  className?: string;
}

export function EscrowTimeline({
  orderStatus = "PENDING",
  escrowStatus,
  inspectionPeriodHours,
  escrowCreatedAt,
  escrowCompletedAt,
  className,
}: EscrowTimelineProps) {
  const currentRank = STATUS_RANK[orderStatus] ?? 0;
  const isTerminalBad =
    orderStatus === "CANCELLED" ||
    orderStatus === "EXPIRED" ||
    orderStatus === "DISPUTED";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isTerminalBad ? "destructive" : "secondary"}>
          {orderStatus.replace(/_/g, " ")}
        </Badge>
        {escrowStatus && (
          <Badge variant="outline">Escrow: {escrowStatus}</Badge>
        )}
        {inspectionPeriodHours != null && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {inspectionPeriodHours}h inspection
          </Badge>
        )}
      </div>

      <ol className="relative border-l border-border ml-3 space-y-4">
        {STEPS.map((step) => {
          const stepRank = STATUS_RANK[step.key];
          const done = !isTerminalBad && currentRank >= stepRank;
          const active = orderStatus === step.key;

          return (
            <li key={step.key} className="ml-4">
              <span
                className={cn(
                  "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border",
                  done && "border-primary text-primary",
                  active && "border-primary bg-primary/10"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
              <p
                className={cn(
                  "text-sm font-medium",
                  done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>

      {(escrowCreatedAt || escrowCompletedAt) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {escrowCreatedAt && (
            <p>Escrow created: {new Date(escrowCreatedAt).toLocaleString()}</p>
          )}
          {escrowCompletedAt && (
            <p>
              Escrow completed: {new Date(escrowCompletedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {orderStatus === "DISPUTED" && (
        <p className="text-sm text-destructive">
          This order is under dispute. Our team will review and contact you.
        </p>
      )}
    </div>
  );
}

export default EscrowTimeline;
