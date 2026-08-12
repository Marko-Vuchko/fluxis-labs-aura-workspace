"use client";

import { useState } from "react";

import { BootScreen } from "@/features/boot/boot-screen";
import { ComputeBadge } from "@/features/hud/compute-badge";
import { ControlDeck } from "@/features/hud/control-deck";
import { KpiPanel } from "@/features/hud/kpi-panel";
import { LanguageSwitch } from "@/features/hud/language-switch";
import { MonthScrubber } from "@/features/hud/month-scrubber";
import { RiskGauge } from "@/features/hud/risk-gauge";
import { SoundToggle } from "@/features/hud/sound-toggle";
import { StatusBadge } from "@/features/hud/status-badge";
import { useSimulation } from "@/features/simulation/use-simulation";

export default function AuraWorkspacePage() {
  const simulation = useSimulation();
  const [hasEnteredAura, setHasEnteredAura] = useState(false);

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

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      {/* Scene placeholder - filled in a later phase */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(34_211_238_/_0.07),transparent_55%),radial-gradient(ellipse_at_top,rgb(168_85_247_/_0.06),transparent_40%)]"
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
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
          <aside className="min-w-0 lg:self-start">
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
            <div className="ml-auto flex w-full max-w-md flex-col gap-3 lg:max-w-sm">
              <KpiPanel month={month} currency={currency} stale={stale} />
              <RiskGauge risk={month?.risk ?? null} stale={stale} />
            </div>

            {/* Scene / Copilot placeholders occupy the middle band */}
            <div className="min-h-24 flex-1" aria-hidden />

            <div className="mx-auto w-full max-w-xl">
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
