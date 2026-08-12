"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/route-error-fallback";
import { LanguageProvider, useLanguage } from "@/lib/i18n/language-provider";
import "./globals.css";

/**
 * Root-layout crash shell. Must render its own <html>/<body> because it
 * replaces the root layout when active.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Aura global]", error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-[#05070d] text-[#e8edf5]" suppressHydrationWarning>
        <LanguageProvider>
          <GlobalErrorBody digest={error.digest} onRetry={reset} />
        </LanguageProvider>
      </body>
    </html>
  );
}

function GlobalErrorBody({
  digest,
  onRetry,
}: {
  digest?: string;
  onRetry: () => void;
}) {
  const { t } = useLanguage();

  return (
    <RouteErrorFallback
      title={t("ui.routeErrorTitle")}
      body={t("ui.routeErrorBody")}
      retryLabel={t("ui.routeErrorRetry")}
      onRetry={onRetry}
      digest={digest}
    />
  );
}
