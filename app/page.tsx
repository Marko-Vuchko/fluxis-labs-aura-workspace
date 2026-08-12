"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { PanelErrorBoundary } from "@/components/panel-error-boundary";
import { BootScreen } from "@/features/boot/boot-screen";
import { AiCopilot } from "@/features/copilot/ai-copilot";
import { ComputeBadge } from "@/features/hud/compute-badge";
import { ControlDeck } from "@/features/hud/control-deck";
import { KpiPanel } from "@/features/hud/kpi-panel";
import { LanguageSwitch } from "@/features/hud/language-switch";
import { MetricsStrip } from "@/features/hud/metrics-strip";
import { MobileDeckDrawer } from "@/features/hud/mobile-deck-drawer";
import { MonthScrubber } from "@/features/hud/month-scrubber";
import { RiskGauge } from "@/features/hud/risk-gauge";
import { SoundToggle } from "@/features/hud/sound-toggle";
import { StatusBadge } from "@/features/hud/status-badge";
import { useNodeHealthAlerts } from "@/features/scene/use-node-health-alerts";
import { useSimulation } from "@/features/simulation/use-simulation";
import { GuidedTour } from "@/features/tour/guided-tour";
import { useViewport } from "@/hooks/use-viewport";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

const SpatialViewport = dynamic(
  () =>
    import("@/features/scene/spatial-viewport").then(
      (mod) => mod.SpatialViewport,
    ),
  { ssr: false },
);

export default function AuraWorkspacePage() {
  const simulation = useSimulation();
  const { t } = useLanguage();
  const { isNarrow } = useViewport();
  const [hasEnteredAura, setHasEnteredAura] = useState(false);
  const [forceSceneFallback, setForceSceneFallback] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const firstSimReady = simulation.result !== null;

  useEffect(() => {
    window.__AURA_FORCE_SCENE_FALLBACK = (enabled: boolean) => {
      setForceSceneFallback(enabled);
    };
    return () => {
      delete window.__AURA_FORCE_SCENE_FALLBACK;
    };
  }, []);

  const month =
    simulation.result?.months.find(
      (entry) => entry.index === simulation.selectedMonth,
    ) ?? null;
  const nodes = month?.nodes ?? null;

  useNodeHealthAlerts(nodes, hasEnteredAura);

  if (!hasEnteredAura) {
    return (
      <BootScreen
        status={simulation.status}
        error={simulation.error}
        bootAttempt={simulation.bootAttempt}
        bootAttempts={simulation.bootAttempts}
        health={simulation.health}
        firstSimReady={firstSimReady}
        onRetry={simulation.retryBoot}
        onEnter={() => {
          setHasEnteredAura(true);
        }}
      />
    );
  }

  const stale = simulation.status === "stale";
  const currency = simulation.result?.meta.currency ?? "USD";

  const deckProps = {
    params: simulation.params,
    meta: simulation.result?.meta,
    statusBusy: false as const,
    setParam: simulation.setParam,
    commitSimulate: simulation.commitSimulate,
    applyPreset: simulation.applyPreset,
    reseed: simulation.reseed,
    resetSeed: simulation.resetSeed,
  };

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <div
        className={cn(
          "z-0",
          isNarrow
            ? "absolute inset-x-0 top-0 h-[50dvh]"
            : "absolute inset-0",
        )}
      >
        <PanelErrorBoundary label={t("ui.webglUnavailable")}>
          <SpatialViewport
            nodes={nodes}
            month={month}
            months={simulation.result?.months ?? null}
            histogram={simulation.result?.histogram ?? null}
            annual={simulation.result?.annual ?? null}
            selectedMonth={simulation.selectedMonth}
            currency={currency}
            reduceMotion={reduceMotion}
            forceFallback={forceSceneFallback}
            className="h-full w-full"
          />
        </PanelErrorBoundary>
      </div>

      {isNarrow ? (
        <div className="pointer-events-none relative z-10 min-h-dvh">
          <header className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <PanelErrorBoundary label={t("ui.status.ready")} compact>
                <StatusBadge status={simulation.status} />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.computeMs")} compact>
                <ComputeBadge meta={simulation.result?.meta} />
              </PanelErrorBoundary>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PanelErrorBoundary label={t("ui.language")} compact>
                <LanguageSwitch />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.soundOn")} compact>
                <SoundToggle />
              </PanelErrorBoundary>
            </div>
          </header>

          <div className="pointer-events-auto absolute inset-x-0 top-[50dvh] bottom-0 z-10 flex flex-col gap-2 px-3 pb-[3.5rem] pt-2">
            <PanelErrorBoundary label={t("ui.revenue")}>
              <MetricsStrip
                month={month}
                risk={month?.risk ?? null}
                currency={currency}
                stale={stale}
                className="shrink-0"
              />
            </PanelErrorBoundary>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PanelErrorBoundary label={t("ui.copilot")}>
                <AiCopilot
                  insights={simulation.result?.insights ?? null}
                  sensitivity={simulation.result?.sensitivity}
                  selectedMonth={simulation.selectedMonth}
                  status={simulation.status}
                  compact
                />
              </PanelErrorBoundary>
            </div>

            <PanelErrorBoundary label={t("ui.month")}>
              <MonthScrubber
                selectedMonth={simulation.selectedMonth}
                onMonthChange={simulation.setSelectedMonth}
                className="max-w-none shrink-0"
                enlargeTouch
              />
            </PanelErrorBoundary>
          </div>

          <MobileDeckDrawer {...deckProps} />
        </div>
      ) : (
        <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
          <header className="pointer-events-auto flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <PanelErrorBoundary label={t("ui.status.ready")} compact>
                <StatusBadge status={simulation.status} />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.computeMs")} compact>
                <ComputeBadge meta={simulation.result?.meta} />
              </PanelErrorBoundary>
            </div>
            <div className="flex items-center gap-2">
              <PanelErrorBoundary label={t("ui.language")} compact>
                <LanguageSwitch />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.soundOn")} compact>
                <SoundToggle />
              </PanelErrorBoundary>
            </div>
          </header>

          <div className="grid flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:pb-6">
            <aside className="pointer-events-auto min-w-0 lg:self-start">
              <PanelErrorBoundary
                label={t("ui.controlDeck")}
                retryLabel={t("ui.panelRetry")}
              >
                <ControlDeck {...deckProps} />
              </PanelErrorBoundary>
            </aside>

            <section className="flex min-w-0 flex-col gap-4">
              <div className="pointer-events-auto ml-auto flex w-full max-w-md flex-col gap-3 lg:max-w-sm">
                <PanelErrorBoundary label={t("ui.revenue")}>
                  <KpiPanel month={month} currency={currency} stale={stale} />
                </PanelErrorBoundary>
                <PanelErrorBoundary label={t("ui.risk")}>
                  <RiskGauge risk={month?.risk ?? null} stale={stale} />
                </PanelErrorBoundary>
              </div>

              {/* Open orbit / hover target through the HUD stack */}
              <div className="min-h-24 flex-1" aria-hidden />

              <div className="pointer-events-auto mx-auto w-full max-w-2xl space-y-4">
                <PanelErrorBoundary label={t("ui.copilot")}>
                  <AiCopilot
                    insights={simulation.result?.insights ?? null}
                    sensitivity={simulation.result?.sensitivity}
                    selectedMonth={simulation.selectedMonth}
                    status={simulation.status}
                  />
                </PanelErrorBoundary>
                <PanelErrorBoundary label={t("ui.month")}>
                  <MonthScrubber
                    selectedMonth={simulation.selectedMonth}
                    onMonthChange={simulation.setSelectedMonth}
                  />
                </PanelErrorBoundary>
              </div>
            </section>
          </div>
        </div>
      )}

      <GuidedTour active={hasEnteredAura && firstSimReady} />
    </main>
  );
}

declare global {
  interface Window {
    __AURA_FORCE_SCENE_FALLBACK?: (enabled: boolean) => void;
  }
}
