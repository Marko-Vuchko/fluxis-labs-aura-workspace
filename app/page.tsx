"use client";

import { PRESETS } from "@/features/simulation/presets";
import { useSimulation } from "@/features/simulation/use-simulation";
import type { SimulationParamKey } from "@/features/simulation/types";
import { formatCompact, formatFull } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { DictionaryKey } from "@/lib/i18n/dictionary";

const SLIDERS: {
  key: SimulationParamKey;
  labelKey: DictionaryKey;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "ad_spend",
    labelKey: "ui.adSpend",
    min: 0,
    max: 50_000,
    step: 100,
  },
  {
    key: "price",
    labelKey: "ui.price",
    min: 10,
    max: 2_000,
    step: 1,
  },
  {
    key: "team_size",
    labelKey: "ui.teamSize",
    min: 1,
    max: 50,
    step: 1,
  },
  {
    key: "opex",
    labelKey: "ui.opex",
    min: 0,
    max: 100_000,
    step: 100,
  },
  {
    key: "cash_reserve",
    labelKey: "ui.cashReserve",
    min: 0,
    max: 500_000,
    step: 1_000,
  },
];

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
  const month = simulation.result?.months.find(
    (entry) => entry.index === simulation.selectedMonth,
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 bg-background px-4 py-8 text-foreground">
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

      <section className="space-y-3 rounded border border-border p-4">
        <h2 className="text-lg font-medium">{t("ui.controlDeck")}</h2>
        {SLIDERS.map((slider) => (
          <label key={slider.key} className="block space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>{t(slider.labelKey)}</span>
              <span className="font-mono" title={formatFull(simulation.params[slider.key])}>
                {formatCompact(simulation.params[slider.key])}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={simulation.params[slider.key]}
              onChange={(event) => {
                simulation.setParam(slider.key, Number(event.target.value));
              }}
              onPointerUp={() => {
                simulation.commitSimulate();
              }}
              onKeyUp={() => {
                simulation.commitSimulate();
              }}
              className="w-full"
            />
          </label>
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="rounded border border-border px-3 py-1 text-sm"
              onClick={() => simulation.applyPreset(preset.id)}
            >
              {t(`ui.${preset.labelKey}`)}
            </button>
          ))}
        </div>
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
    </main>
  );
}
