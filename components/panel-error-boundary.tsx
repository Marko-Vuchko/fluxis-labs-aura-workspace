"use client";

import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type PanelErrorBoundaryProps = {
  children: ReactNode;
  /** Short label shown in the fallback shell. */
  label: string;
  retryLabel?: string;
  className?: string;
  /** Optional compact mode for dense HUD slots. */
  compact?: boolean;
};

type PanelErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

/**
 * Granular Error Boundary so one panel crash cannot blank the whole workspace.
 */
export class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): PanelErrorBoundaryState {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unexpected render failure";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Aura panel]", this.props.label, error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { label, className, compact = false, retryLabel = "Reinitialize" } =
      this.props;

    return (
      <div
        role="alert"
        className={cn(
          "relative overflow-hidden rounded-xl border border-status-critical/35",
          "bg-[#070b14]/88 shadow-[0_0_40px_-20px_rgb(251_113_133_/_0.55)]",
          "backdrop-blur-md",
          compact ? "p-3" : "p-4",
          className,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 left-2 h-3.5 w-3.5 border-t border-l border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 border-t border-r border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 h-3.5 w-3.5 border-b border-l border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 bottom-2 h-3.5 w-3.5 border-r border-b border-status-critical/70"
        />

        <p className="font-mono text-[10px] tracking-[0.2em] text-status-critical uppercase">
          Signal fault
        </p>
        <p className="mt-1 text-sm text-foreground/90">{label}</p>
        {!compact ? (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {this.state.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={this.handleRetry}
          className={cn(
            "mt-3 inline-flex items-center rounded-md border border-primary/40",
            "bg-primary/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em]",
            "text-primary uppercase transition-colors",
            "hover:bg-primary/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          {retryLabel}
        </button>
      </div>
    );
  }
}
