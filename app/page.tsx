"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

import { BootScreen } from "@/features/boot/boot-screen";
import { AiCopilot } from "@/features/copilot/ai-copilot";
import { ComputeBadge } from "@/features/hud/compute-badge";
import { ControlDeck } from "@/features/hud/control-deck";
import { KpiPanel } from "@/features/hud/kpi-panel";
import { LanguageSwitch } from "@/features/hud/language-switch";
import { MonthScrubber } from "@/features/hud/month-scrubber";
import { RiskGauge } from "@/features/hud/risk-gauge";
import { SoundToggle } from "@/features/hud/sound-toggle";
import { StatusBadge } from "@/features/hud/status-badge";
import { useSimulation } from "@/features/simulation/use-simulation";

const SpatialCanvas = dynamic(
  () =>
    import("@/features/scene/spatial-canvas").then((mod) => mod.SpatialCanvas),
  { ssr: false },
);

export default function AuraWorkspacePage() {
  const simulation = useSimulation();
  const [hasEnteredAura, setHasEnteredAura] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const firstSimReady = simulation.result !== null;

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

  const month =
    simulation.result?.months.find(
      (entry) => entry.index === simulation.selectedMonth,
    ) ?? null;
  const stale = simulation.status === "stale";
  const currency = simulation.result?.meta.currency ?? "USD";
  const nodes = month?.nodes ?? null;

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-0 z-0">
        <SpatialCanvas
          nodes={nodes}
          month={month}
          months={simulation.result?.months ?? null}
          histogram={simulation.result?.histogram ?? null}
          selectedMonth={simulation.selectedMonth}
          currency={currency}
          reduceMotion={reduceMotion}
          className="h-full w-full"
        />
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <header className="pointer-events-auto flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={simulation.status} />
            <ComputeBadge meta={simulation.result?.meta} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <SoundToggle />
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:pb-6">
          <aside className="pointer-events-auto min-w-0 lg:self-start">
            <ControlDeck
              params={simulation.params}
              meta={simulation.result?.meta}
              statusBusy={false}
              setParam={simulation.setParam}
              commitSimulate={simulation.commitSimulate}
              applyPreset={simulation.applyPreset}
              reseed={simulation.reseed}
              resetSeed={simulation.resetSeed}
            />
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <div className="pointer-events-auto ml-auto flex w-full max-w-md flex-col gap-3 lg:max-w-sm">
              <KpiPanel month={month} currency={currency} stale={stale} />
              <RiskGauge risk={month?.risk ?? null} stale={stale} />
            </div>

            {/* Open orbit / hover target through the HUD stack */}
            <div className="min-h-24 flex-1" aria-hidden />

            <div className="pointer-events-auto mx-auto w-full max-w-2xl space-y-4">
              <AiCopilot
                insights={simulation.result?.insights ?? null}
                sensitivity={simulation.result?.sensitivity}
                selectedMonth={simulation.selectedMonth}
                status={simulation.status}
              />
              <MonthScrubber
                selectedMonth={simulation.selectedMonth}
                onMonthChange={simulation.setSelectedMonth}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
