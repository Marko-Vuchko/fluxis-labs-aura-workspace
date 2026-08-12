"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  useId,
  useState,
  type KeyboardEvent,
} from "react";

import { Slider } from "@/components/ui/slider";
import {
  PARAM_RANGES,
  resolveCapacityEconomics,
} from "@/features/simulation/defaults";
import type { PresetId } from "@/features/simulation/presets";
import type {
  SimulationInput,
  SimulationMeta,
  SimulationParamKey,
} from "@/features/simulation/types";
import { formatCompact, formatFull } from "@/lib/i18n/format";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

import { PresetBar } from "./preset-bar";
import { ReseedControl } from "./reseed-control";
import { orbitGuardPointerDown } from "./orbit-gate";
import { playSliderTone as playSoundscapeSliderTone } from "@/lib/audio/soundscape";

const SLIDER_CONFIG: {
  key: SimulationParamKey;
  labelKey: DictionaryKey;
  currency?: boolean;
}[] = [
  { key: "ad_spend", labelKey: "ui.adSpend", currency: true },
  { key: "price", labelKey: "ui.price", currency: true },
  { key: "team_size", labelKey: "ui.teamSize" },
  { key: "opex", labelKey: "ui.opex", currency: true },
  { key: "cash_reserve", labelKey: "ui.cashReserve", currency: true },
];

type DraftParams = Omit<SimulationInput, "seed">;

export type ControlDeckProps = {
  params: SimulationInput;
  meta?: SimulationMeta | null;
  statusBusy?: boolean;
  setParam: (key: SimulationParamKey, value: number) => void;
  commitSimulate: () => void;
  applyPreset: (id: PresetId) => void;
  reseed: () => void;
  resetSeed: () => void;
  className?: string;
};

function useDeckSound() {
  return {
    playSliderTone: (key: SimulationParamKey, value: number) => {
      const range = PARAM_RANGES[key];
      const span = range.max - range.min;
      const normalized = span <= 0 ? 0 : (value - range.min) / span;
      playSoundscapeSliderTone(normalized);
    },
  };
}

function clampToRange(key: SimulationParamKey, value: number): number {
  const range = PARAM_RANGES[key];
  if (!Number.isFinite(value)) {
    return range.min;
  }
  const stepped =
    key === "team_size"
      ? Math.round(value)
      : Math.round(value / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, stepped));
}

function CornerBracket({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-4 w-4 border-primary/60",
        className,
      )}
    />
  );
}

type ParamSliderProps = {
  paramKey: SimulationParamKey;
  labelKey: DictionaryKey;
  value: number;
  currency?: boolean;
  disabled?: boolean;
  onValueChange: (value: number) => void;
  onCommit: () => void;
  onTone: (value: number) => void;
};

function ParamSlider({
  paramKey,
  labelKey,
  value,
  currency = false,
  disabled = false,
  onValueChange,
  onCommit,
  onTone,
}: ParamSliderProps) {
  const { t } = useLanguage();
  const range = PARAM_RANGES[paramKey];
  const labelId = useId();
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const text = draft ?? String(value);

  const label = t(labelKey);
  const liveLabel = currency
    ? formatCompact(value)
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
        value,
      );
  const fullTitle = currency
    ? formatFull(value, "USD", { integers: paramKey !== "price" })
    : String(value);

  const commitText = () => {
    const parsed = Number(text.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) {
      setDraft(null);
      setInvalid(false);
      return;
    }
    const next = clampToRange(paramKey, parsed);
    setInvalid(next !== parsed);
    setDraft(null);
    if (next !== value) {
      onValueChange(next);
      onTone(next);
    }
    onCommit();
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitText();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(null);
      setInvalid(false);
    }
  };

  const nudge = (direction: 1 | -1) => {
    const parsed = Number(text.replace(/,/g, ""));
    const source = Number.isFinite(parsed) ? parsed : value;
    const next = clampToRange(paramKey, source + direction * range.step);
    setDraft(null);
    setInvalid(false);
    if (next !== value) {
      onValueChange(next);
      onTone(next);
    }
    onCommit();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label id={labelId} htmlFor={inputId} className="text-xs text-foreground/85">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm tabular-nums text-primary"
            title={fullTitle}
            aria-live="polite"
          >
            {liveLabel}
          </span>
          <div
            className={cn(
              "flex overflow-hidden rounded-md border bg-background/50",
              "border-primary/25 transition-colors",
              "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
              invalid && "border-destructive/70 ring-1 ring-destructive/30",
              disabled && "opacity-50",
            )}
          >
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={range.min}
              max={range.max}
              step={range.step}
              value={text}
              disabled={disabled}
              aria-labelledby={labelId}
              aria-invalid={invalid}
              aria-describedby={`${inputId}-hint`}
              onFocus={() => {
                setDraft(String(value));
              }}
              onChange={(event) => {
                setDraft(event.target.value);
                setInvalid(false);
              }}
              onBlur={commitText}
              onKeyDown={onInputKeyDown}
              className={cn(
                "h-7 w-[4.75rem] border-0 bg-transparent px-2",
                "font-mono text-xs tabular-nums text-foreground outline-none",
                "max-lg:h-11 max-lg:w-[5.75rem] max-lg:text-sm",
              )}
            />
            <div
              className="flex w-5 flex-col border-l border-primary/20 max-lg:w-8"
              onPointerDown={orbitGuardPointerDown}
            >
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled || value >= range.max}
                aria-label={t("ui.increaseParam", { label })}
                onPointerDown={(event) => {
                  event.preventDefault();
                  nudge(1);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center text-primary/55",
                  "transition-colors hover:bg-primary/10 hover:text-primary",
                  "focus-visible:outline-none focus-visible:bg-primary/15",
                  "disabled:pointer-events-none disabled:opacity-30",
                )}
              >
                <ChevronUp className="size-2.5 max-lg:size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled || value <= range.min}
                aria-label={t("ui.decreaseParam", { label })}
                onPointerDown={(event) => {
                  event.preventDefault();
                  nudge(-1);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center border-t border-primary/20 text-primary/55",
                  "transition-colors hover:bg-primary/10 hover:text-primary",
                  "focus-visible:outline-none focus-visible:bg-primary/15",
                  "disabled:pointer-events-none disabled:opacity-30",
                )}
              >
                <ChevronDown className="size-2.5 max-lg:size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
      <p id={`${inputId}-hint`} className="sr-only">
        {`${label}: ${range.min} to ${range.max}`}
      </p>
      <div
        className="max-lg:min-h-11 max-lg:flex max-lg:items-center"
        onPointerDown={orbitGuardPointerDown}
      >
        <Slider
          value={[value]}
          min={range.min}
          max={range.max}
          step={range.step}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-label={label}
          onValueChange={(next) => {
            const raw = Array.isArray(next) ? next[0] : next;
            if (typeof raw !== "number" || !Number.isFinite(raw)) {
              return;
            }
            const clamped = clampToRange(paramKey, raw);
            onValueChange(clamped);
            onTone(clamped);
          }}
          onValueCommitted={() => {
            onCommit();
          }}
          className={cn(
            "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-primary/15",
            "[&_[data-slot=slider-range]]:bg-primary",
            "[&_[data-slot=slider-range]]:shadow-[0_0_12px_rgb(34_211_238_/_0.55)]",
            "[&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:rounded-full",
            "[&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-primary/80",
            "[&_[data-slot=slider-thumb]]:bg-primary",
            "[&_[data-slot=slider-thumb]]:shadow-[0_0_14px_rgb(34_211_238_/_0.75)]",
            "[&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:hover:ring-2",
            "[&_[data-slot=slider-thumb]]:hover:ring-primary/35",
            "[&_[data-slot=slider-thumb]]:focus-visible:ring-2",
            "[&_[data-slot=slider-thumb]]:focus-visible:ring-primary/45",
            "max-lg:[&_[data-slot=slider-thumb]]:size-11",
            "max-lg:[&_[data-slot=slider-track]]:h-2",
          )}
        />
      </div>
    </div>
  );
}

export function ControlDeck({
  params,
  meta = null,
  statusBusy = false,
  setParam,
  commitSimulate,
  applyPreset,
  reseed,
  resetSeed,
  className,
}: ControlDeckProps) {
  const { t } = useLanguage();
  const { playSliderTone } = useDeckSound();
  const [animatedParams, setAnimatedParams] = useState<DraftParams | null>(
    null,
  );

  const displayParams: DraftParams = animatedParams ?? {
    ad_spend: params.ad_spend,
    price: params.price,
    team_size: params.team_size,
    opex: params.opex,
    cash_reserve: params.cash_reserve,
  };

  const economics = resolveCapacityEconomics(meta);
  const seed = params.seed ?? meta?.seed ?? 0;
  const disabled = statusBusy;

  return (
    <section
      aria-label={t("ui.controlDeck")}
      data-tour="controlDeck"
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-xl",
        "border border-primary/18 bg-[#070b14]/78 p-4 shadow-[0_0_28px_-22px_rgb(34_211_238_/_0.32)]",
        "backdrop-blur-md",
        className,
      )}
    >
      <CornerBracket className="top-2 left-2 border-t border-l" />
      <CornerBracket className="top-2 right-2 border-t border-r" />
      <CornerBracket className="bottom-2 left-2 border-b border-l" />
      <CornerBracket className="right-2 bottom-2 border-r border-b" />

      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-sm font-medium tracking-[0.18em] text-primary/90 uppercase">
          {t("ui.controlDeck")}
        </h2>
      </header>

      <div className="space-y-4">
        {SLIDER_CONFIG.map((slider) => (
          <ParamSlider
            key={slider.key}
            paramKey={slider.key}
            labelKey={slider.labelKey}
            value={displayParams[slider.key]}
            currency={slider.currency}
            disabled={disabled || animatedParams !== null}
            onTone={(next) => {
              playSliderTone(slider.key, next);
            }}
            onValueChange={(next) => {
              setParam(slider.key, next);
            }}
            onCommit={commitSimulate}
          />
        ))}
      </div>

      <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground/65">
        <span className="uppercase tracking-[0.12em]">
          {t("ui.capacityEconomics")}
        </span>
        <span className="mx-1.5 text-muted-foreground/35">·</span>
        {t("ui.clientsPerHead")} {economics.clientsPerHead}
        <span className="mx-1.5 text-muted-foreground/35">·</span>
        {t("ui.costPerHead")}{" "}
        {formatFull(economics.costPerHead, "USD", { integers: true })}{" "}
        {t("ui.perMonth")}
      </p>

      <div
        className="mt-4 space-y-3 border-t border-primary/10 pt-4"
        data-tour="presets"
      >
        <PresetBar
          currentParams={displayParams}
          disabled={disabled || animatedParams !== null}
          onDisplayParams={(next) => {
            setAnimatedParams(next);
          }}
          onApplyPreset={(id) => {
            applyPreset(id);
            setAnimatedParams(null);
          }}
          onCommit={commitSimulate}
        />

        <ReseedControl
          seed={seed}
          disabled={disabled || animatedParams !== null}
          onReseed={reseed}
          onResetSeed={resetSeed}
        />
      </div>
    </section>
  );
}
