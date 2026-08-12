"use client";

import { useState } from "react";

import { BootScreen } from "@/features/boot/boot-screen";
import { ControlDeck } from "@/features/hud/control-deck";
import { useSimulation } from "@/features/simulation/use-simulation";
import { formatCompact, formatFull } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { DictionaryKey } from "@/lib/i18n/dictionary";

function statusLabelKey(
  status: ReturnType<typeof useSimulation>["status"],
): DictionaryKey {
  switch (status) {
    case "booting":
      return "ui.status.booting";
    case "ready":
      return "ui.status.ready";
    case "simulating":
      return "ui.status.simulating";
    case "stale":
      return "ui.status.stale";
    case "error":
      return "ui.status.error";
  }
}

export default function SimulationHarnessPage() {
  const { t, locale, setLocale } = useLanguage();
  const simulation = useSimulation();
  const [hasEnteredAura, setHasEnteredAura] = useState(false);

  const firstSimReady = simulation.result !== null;

  // Boot screen owns the viewport until ENTER AURA. First sim completes during boot.
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

  const month = simulation.result?.months.find(
    (entry) => entry.index === simulation.selectedMonth,
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 bg-background px-4 py-8 text-foreground lg:flex-row lg:items-start">
      <ControlDeck
        params={simulation.params}
        meta={simulation.result?.meta}
        statusBusy={
          simulation.status === "booting" || simulation.status === "simulating"
        }
        setParam={simulation.setParam}
        commitSimulate={simulation.commitSimulate}
        applyPreset={simulation.applyPreset}
        reseed={simulation.reseed}
        resetSeed={simulation.resetSeed}
        className="lg:sticky lg:top-6"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm text-primary">{t("brand.name")}</p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">
            {t("test.title")}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("test.dragHint")}
          </p>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("test.languageHint")}
          </p>
        </header>

        <section className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{t("ui.language")}:</span>
          <button
            type="button"
            className="rounded border border-border px-3 py-1 text-sm"
            onClick={() => setLocale("en")}
            data-active={locale === "en"}
          >
            {t("ui.english")}
          </button>
          <button
            type="button"
            className="rounded border border-border px-3 py-1 text-sm"
            onClick={() => setLocale("sr")}
            data-active={locale === "sr"}
          >
            {t("ui.serbian")}
          </button>
          <span className="font-mono text-xs text-muted-foreground">
            locale={locale}
          </span>
        </section>

        <section className="space-y-2 rounded border border-border p-4 font-mono text-sm">
          <h2 className="font-sans text-lg font-medium">{t("test.lastRequest")}</h2>
          <p>
            {t("test.lastRequest")}: {t(statusLabelKey(simulation.status))}
          </p>
          <p>
            bootAttempt={simulation.bootAttempt} error=
            {simulation.error ?? "null"}
          </p>
          <p>
            health=
            {simulation.health
              ? `${simulation.health.engine_version} uptime_s=${simulation.health.uptime_s} numpy_warmup_ms=${simulation.health.numpy_warmup_ms}`
              : "null"}
          </p>
          <p>
            seed={simulation.params.seed ?? "default"} selectedMonth=
            {simulation.selectedMonth}
          </p>
          <label className="flex items-center gap-3 font-sans text-sm">
            <span>{t("ui.month")}</span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={simulation.selectedMonth}
              onChange={(event) => {
                simulation.setSelectedMonth(Number(event.target.value));
              }}
            />
            <span className="font-mono">{simulation.selectedMonth}</span>
          </label>
        </section>

        <section className="space-y-2 rounded border border-border p-4 font-mono text-sm">
          <h2 className="font-sans text-lg font-medium">{t("test.rawAnnual")}</h2>
          {simulation.result ? (
            <pre className="overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(
                {
                  meta: simulation.result.meta,
                  annual_p50: {
                    revenue: simulation.result.annual.revenue[1],
                    profit: simulation.result.annual.profit[1],
                    margin: simulation.result.annual.margin[1],
                    ending_cash: simulation.result.annual.ending_cash[1],
                  },
                  annual_band: {
                    profit_p10: simulation.result.annual.profit[0],
                    profit_p90: simulation.result.annual.profit[2],
                  },
                },
                null,
                2,
              )}
            </pre>
          ) : (
            <p>null</p>
          )}
        </section>

        <section className="space-y-2 rounded border border-border p-4 font-mono text-sm">
          <h2 className="font-sans text-lg font-medium">{t("test.rawMonth")}</h2>
          {month ? (
            <pre className="overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(
                {
                  index: month.index,
                  revenue: month.revenue,
                  profit: month.profit,
                  margin: month.margin,
                  customers: month.customers,
                  churn_rate: month.churn_rate,
                  capacity_used: month.capacity_used,
                  cash: month.cash,
                  runway_months: month.runway_months,
                  risk: month.risk,
                },
                null,
                2,
              )}
            </pre>
          ) : (
            <p>null</p>
          )}
        </section>

        <section className="space-y-2 rounded border border-border p-4 font-mono text-sm">
          <h2 className="font-sans text-lg font-medium">{t("test.rawInsights")}</h2>
          {simulation.result ? (
            <ul className="space-y-3">
              {simulation.result.insights.map((insight) => {
                const key = `insights.${insight.code}` as DictionaryKey;
                return (
                  <li key={`${insight.code}-${insight.severity}`}>
                    <div>
                      {insight.code} / {insight.severity}
                    </div>
                    <div className="font-sans text-foreground">
                      {t(key, insight.params)}
                    </div>
                    <div>{JSON.stringify(insight.params)}</div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>null</p>
          )}
        </section>

        {simulation.status === "error" ? (
          <button
            type="button"
            className="w-fit rounded border border-border px-3 py-2 text-sm"
            onClick={() => simulation.retryBoot()}
          >
            {t("ui.retry")}
          </button>
        ) : null}

        <p className="font-mono text-xs text-muted-foreground">
          month revenue compact={month ? formatCompact(month.revenue[1]) : "-"}{" "}
          full={month ? formatFull(month.revenue[1]) : "-"}
        </p>
      </div>
    </main>
  );
}
