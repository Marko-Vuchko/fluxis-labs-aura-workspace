"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { PanelErrorBoundary } from "@/components/panel-error-boundary";
import { BootScreen } from "@/features/boot/boot-screen";
import { AiCopilot } from "@/features/copilot/ai-copilot";
import { BuiltByMark } from "@/features/hud/built-by-mark";
import { ComputeBadge } from "@/features/hud/compute-badge";
import { ControlDeck } from "@/features/hud/control-deck";
import { HeaderOverflowMenu } from "@/features/hud/header-overflow-menu";
import { KeyboardCheatsheet } from "@/features/hud/keyboard-cheatsheet";
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
import { TourRestart } from "@/features/tour/tour-restart";
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
    statusBusy: simulation.status === "simulating",
    setParam: simulation.setParam,
    commitSimulate: simulation.commitSimulate,
    applyPreset: simulation.applyPreset,
    reseed: simulation.reseed,
    resetSeed: simulation.resetSeed,
  };

  return (
    <main
      className="relative h-dvh w-full overflow-hidden overscroll-none bg-background text-foreground"
      aria-label={t("brand.name")}
    >
      <a
        href={isNarrow ? "#aura-control-deck-trigger" : "#aura-controls"}
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-3 focus:left-3 focus:z-[100]",
          "focus:rounded-md focus:border focus:border-primary/50",
          "focus:bg-[#070b14] focus:px-3 focus:py-2",
          "focus:font-mono focus:text-xs focus:tracking-[0.14em] focus:text-primary focus:uppercase",
          "focus:shadow-[0_0_24px_-8px_rgb(34_211_238_/_0.55)]",
          "focus:outline-none focus:ring-2 focus:ring-primary/45",
        )}
      >
        {t("a11y.skipToControls")}
      </a>

      <p id="aura-scene-keyboard-hint" className="sr-only">
        {t("a11y.sceneKeyboardHint")}
      </p>

      <div
        role="region"
        aria-label={t("a11y.sceneRegion")}
        aria-describedby="aura-scene-keyboard-hint"
        className={cn(
          "z-0 transform-gpu contain-paint",
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
            stale={stale}
            className="h-full w-full"
          />
        </PanelErrorBoundary>
      </div>

      {isNarrow ? (
        <div className="pointer-events-none relative z-10 h-full">
          <header
            className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pt-3"
            aria-label={t("brand.name")}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <BuiltByMark compact />
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <PanelErrorBoundary label={t("ui.status.ready")} compact>
                  <StatusBadge
                    status={simulation.status}
                    onRetry={simulation.commitSimulate}
                  />
                </PanelErrorBoundary>
                <PanelErrorBoundary label={t("ui.computeMs")} compact>
                  <ComputeBadge meta={simulation.result?.meta} />
                </PanelErrorBoundary>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PanelErrorBoundary label={t("ui.language")} compact>
                <LanguageSwitch />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.soundOn")} compact>
                <SoundToggle />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.moreActions")} compact>
                <HeaderOverflowMenu />
              </PanelErrorBoundary>
            </div>
          </header>

          <div
            id="aura-controls"
            className="pointer-events-auto absolute inset-x-0 top-[50dvh] bottom-0 z-10 flex flex-col gap-2 px-3 pb-[3.5rem] pt-2"
          >
            <section aria-label={t("a11y.metricsRegion")}>
              <PanelErrorBoundary label={t("ui.revenue")}>
                <MetricsStrip
                  month={month}
                  risk={month?.risk ?? null}
                  currency={currency}
                  stale={stale}
                  className="shrink-0"
                />
              </PanelErrorBoundary>
            </section>

            <section
              aria-label={t("a11y.copilotRegion")}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <PanelErrorBoundary label={t("ui.copilot")}>
                <AiCopilot
                  insights={month?.insights ?? null}
                  sensitivity={simulation.result?.sensitivity}
                  selectedMonth={simulation.selectedMonth}
                  status={simulation.status}
                  onRetry={simulation.commitSimulate}
                  compact
                />
              </PanelErrorBoundary>
            </section>

            <PanelErrorBoundary label={t("ui.month")}>
              <MonthScrubber
                selectedMonth={simulation.selectedMonth}
                onMonthChange={simulation.setSelectedMonth}
                onMonthCommit={simulation.syncShareUrl}
                className="max-w-none shrink-0"
                enlargeTouch
              />
            </PanelErrorBoundary>
          </div>

          <MobileDeckDrawer {...deckProps} />
        </div>
      ) : (
        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header
            className="pointer-events-auto flex items-start justify-between gap-3 px-4 pt-4 sm:px-6"
            aria-label={t("brand.name")}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <BuiltByMark className="mr-1" />
              <div className="flex flex-wrap items-center gap-2">
                <PanelErrorBoundary label={t("ui.status.ready")} compact>
                  <StatusBadge
                    status={simulation.status}
                    onRetry={simulation.commitSimulate}
                  />
                </PanelErrorBoundary>
                <PanelErrorBoundary label={t("ui.computeMs")} compact>
                  <ComputeBadge meta={simulation.result?.meta} />
                </PanelErrorBoundary>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PanelErrorBoundary label={t("ui.language")} compact>
                <LanguageSwitch />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("tour.restart")} compact>
                <TourRestart />
              </PanelErrorBoundary>
              <PanelErrorBoundary label={t("ui.soundOn")} compact>
                <SoundToggle />
              </PanelErrorBoundary>
            </div>
          </header>

          <div
            id="aura-controls"
            className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:pb-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] xl:gap-6 xl:px-6"
          >
            <aside
              className="pointer-events-auto min-h-0 min-w-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
              aria-label={t("a11y.controlDeckRegion")}
            >
              <PanelErrorBoundary
                label={t("ui.controlDeck")}
                retryLabel={t("ui.panelRetry")}
              >
                <ControlDeck {...deckProps} />
              </PanelErrorBoundary>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto overscroll-contain xl:gap-4 [scrollbar-width:thin]">
              <div
                className="pointer-events-auto ml-auto flex w-full max-w-xs flex-col gap-2 xl:max-w-sm xl:gap-3"
                aria-label={t("a11y.metricsRegion")}
              >
                <PanelErrorBoundary label={t("ui.revenue")}>
                  <KpiPanel month={month} currency={currency} stale={stale} />
                </PanelErrorBoundary>
                <PanelErrorBoundary label={t("ui.risk")}>
                  <RiskGauge risk={month?.risk ?? null} stale={stale} />
                </PanelErrorBoundary>
              </div>

              {/* Open orbit / hover target through the HUD stack */}
              <div className="min-h-24 flex-1" aria-hidden />

              <div className="pointer-events-auto mx-auto w-full max-w-xl space-y-3 xl:max-w-2xl xl:space-y-4">
                <section aria-label={t("a11y.copilotRegion")}>
                  <PanelErrorBoundary label={t("ui.copilot")}>
                    <AiCopilot
                      insights={month?.insights ?? null}
                      sensitivity={simulation.result?.sensitivity}
                      selectedMonth={simulation.selectedMonth}
                      status={simulation.status}
                      onRetry={simulation.commitSimulate}
                    />
                  </PanelErrorBoundary>
                </section>
                <PanelErrorBoundary label={t("ui.month")}>
                  <MonthScrubber
                    selectedMonth={simulation.selectedMonth}
                    onMonthChange={simulation.setSelectedMonth}
                    onMonthCommit={simulation.syncShareUrl}
                  />
                </PanelErrorBoundary>
              </div>
            </section>
          </div>
        </div>
      )}

      <GuidedTour active={hasEnteredAura && firstSimReady} />
      <KeyboardCheatsheet />
    </main>
  );
}

declare global {
  interface Window {
    __AURA_FORCE_SCENE_FALLBACK?: (enabled: boolean) => void;
  }
}
