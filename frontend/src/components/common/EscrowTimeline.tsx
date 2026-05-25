import React from "react";
import { Badge } from "../ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Five steps that map 1-to-1 with Ethitrust escrow milestones.
const STEPS = [
  { key: "PENDING", label: "Order Created" },
  { key: "ESCROW_CREATED", label: "Escrow Created" },
  { key: "ESCROW_INVITED", label: "Seller Invited" },
  { key: "ESCROW_ACTIVE", label: "Escrow Active" },
  { key: "ESCROW_COMPLETED", label: "Escrow Released" },
];

const STATUS_RANK: Record<string, number> = STEPS.reduce(
  (acc, step, idx) => ({ ...acc, [step.key]: idx }),
  {} as Record<string, number>
);

// Aliases for legacy/extra backend values that don't have their own step.
// They resolve to the nearest "done" step so existing orders render correctly.
const LEGACY_RANK: Record<string, number> = {
  PAYMENT_PENDING: STATUS_RANK.PENDING,
  // Backend maps Ethitrust "submitted" and "in_review" to these; they sit
  // between Active and Released.
  SELLER_PROCESSING: STATUS_RANK.ESCROW_ACTIVE,
  SHIPPED: STATUS_RANK.ESCROW_ACTIVE,
  DELIVERED: STATUS_RANK.ESCROW_ACTIVE,
};

// escrowStatus values that map to the Active rank (covers direct Ethitrust values
// that arrive before the backend emits the matching orderStatus).
const ESCROW_STATUS_ACTIVE_ALIASES = new Set(["submitted", "in_review"]);

/**
 * Resolve the current progress rank from orderStatus + escrowStatus.
 * Falls back through: STATUS_RANK → LEGACY_RANK → escrowStatus alias → 0.
 */
function resolveTimelineRank(
  orderStatus: string,
  escrowStatus?: string
): number {
  if (STATUS_RANK[orderStatus] !== undefined) return STATUS_RANK[orderStatus];
  if (LEGACY_RANK[orderStatus] !== undefined) return LEGACY_RANK[orderStatus];
  if (escrowStatus) {
    if (escrowStatus === "completed") return STATUS_RANK.ESCROW_COMPLETED;
    if (ESCROW_STATUS_ACTIVE_ALIASES.has(escrowStatus))
      return STATUS_RANK.ESCROW_ACTIVE;
    if (escrowStatus === "active") return STATUS_RANK.ESCROW_ACTIVE;
    if (escrowStatus === "invited") return STATUS_RANK.ESCROW_INVITED;
    if (escrowStatus === "pending") return STATUS_RANK.ESCROW_CREATED;
  }
  return 0;
}

// Display-friendly label for the status badge.
// Avoids showing raw enum strings like SELLER_PROCESSING to users.
const DISPLAY_LABEL: Record<string, string> = {
  PENDING: "Order Created",
  PAYMENT_PENDING: "Order Created",
  ESCROW_CREATED: "Escrow Created",
  ESCROW_INVITED: "Seller Invited",
  ESCROW_ACTIVE: "Escrow Active",
  SELLER_PROCESSING: "Escrow Active",
  SHIPPED: "Escrow Active",
  DELIVERED: "Escrow Active",
  ESCROW_COMPLETED: "Escrow Released",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const TERMINAL_BAD = new Set(["CANCELLED", "EXPIRED", "DISPUTED"]);

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
  const isTerminalBad = TERMINAL_BAD.has(orderStatus);
  const currentRank = isTerminalBad
    ? -1
    : resolveTimelineRank(orderStatus, escrowStatus);

  const displayLabel =
    DISPLAY_LABEL[orderStatus] ?? orderStatus.replace(/_/g, " ");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isTerminalBad ? "destructive" : "secondary"}>
          {displayLabel}
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
          const active = !isTerminalBad && currentRank === stepRank;

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
