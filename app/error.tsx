"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/route-error-fallback";
import { useLanguage } from "@/lib/i18n/language-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Aura route]", error);
    }
  }, [error]);

  return (
    <RouteErrorFallback
      title={t("ui.routeErrorTitle")}
      body={t("ui.routeErrorBody")}
      retryLabel={t("ui.routeErrorRetry")}
      onRetry={reset}
      digest={error.digest}
    />
  );
}
