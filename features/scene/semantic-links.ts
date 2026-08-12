import type { NodeId } from "@/features/simulation/types";

/** Nine semantic threads from PRD 5.5 (not a complete graph). */
export type SemanticLink = {
  readonly from: NodeId;
  readonly to: NodeId;
};

export const SEMANTIC_LINKS = [
  { from: "marketing", to: "sales" },
  { from: "sales", to: "support" },
  { from: "sales", to: "operations" },
  { from: "support", to: "churn" },
  { from: "support", to: "operations" },
  { from: "operations", to: "profit" },
  { from: "churn", to: "profit" },
  { from: "profit", to: "cash_runway" },
  { from: "cash_runway", to: "marketing" },
] as const satisfies readonly SemanticLink[];

export const LINK_COUNT = SEMANTIC_LINKS.length;
