"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

type ArchitectureDiagramProps = {
  className?: string;
  caption: string;
};

/**
 * Static SVG of the request path. No Mermaid runtime, no Three.js.
 */
export function ArchitectureDiagram({
  className,
  caption,
}: ArchitectureDiagramProps) {
  const { t } = useLanguage();

  return (
    <figure className={cn("space-y-3", className)}>
      <svg
        role="img"
        aria-label={caption}
        viewBox="0 0 920 280"
        className="h-auto w-full overflow-visible rounded-xl border border-primary/20 bg-[#070b14]"
      >
        <defs>
          <linearGradient id="aboutFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect width="920" height="280" fill="#05070D" rx="12" />

        <g>
          <rect
            x="36"
            y="70"
            width="200"
            height="140"
            rx="12"
            fill="#0a0f1a"
            stroke="#22D3EE"
            strokeOpacity="0.45"
          />
          <text
            x="136"
            y="108"
            textAnchor="middle"
            fill="#8b95a8"
            fontSize="12"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramBrowser")}
          </text>
          <text
            x="136"
            y="140"
            textAnchor="middle"
            fill="#e8edf5"
            fontSize="16"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramHudScene")}
          </text>
          <text
            x="136"
            y="168"
            textAnchor="middle"
            fill="#22D3EE"
            fontSize="13"
            fontFamily="ui-monospace, monospace"
          >
            {t("about.diagramUseSimulation")}
          </text>
        </g>

        <path
          d="M246 140 H310"
          stroke="url(#aboutFlow)"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrow)"
        />
        <polygon points="310,134 322,140 310,146" fill="#22D3EE" />

        <g>
          <rect
            x="330"
            y="54"
            width="250"
            height="172"
            rx="12"
            fill="#0a0f1a"
            stroke="#22D3EE"
            strokeOpacity="0.45"
          />
          <text
            x="455"
            y="88"
            textAnchor="middle"
            fill="#8b95a8"
            fontSize="12"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramVercel")}
          </text>
          <text
            x="455"
            y="120"
            textAnchor="middle"
            fill="#e8edf5"
            fontSize="15"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramEdge")}
          </text>
          <text
            x="455"
            y="148"
            textAnchor="middle"
            fill="#22D3EE"
            fontSize="13"
            fontFamily="ui-monospace, monospace"
          >
            {t("about.diagramProxyCsp")}
          </text>
          <text
            x="455"
            y="176"
            textAnchor="middle"
            fill="#A855F7"
            fontSize="13"
            fontFamily="ui-monospace, monospace"
          >
            {t("about.diagramRouteZod")}
          </text>
        </g>

        <path
          d="M590 140 H654"
          stroke="url(#aboutFlow)"
          strokeWidth="2"
          fill="none"
        />
        <polygon points="654,134 666,140 654,146" fill="#A855F7" />

        <g>
          <rect
            x="676"
            y="70"
            width="208"
            height="140"
            rx="12"
            fill="#0a0f1a"
            stroke="#A855F7"
            strokeOpacity="0.55"
          />
          <text
            x="780"
            y="108"
            textAnchor="middle"
            fill="#8b95a8"
            fontSize="12"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramRender")}
          </text>
          <text
            x="780"
            y="140"
            textAnchor="middle"
            fill="#e8edf5"
            fontSize="15"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t("about.diagramFastapi")}
          </text>
          <text
            x="780"
            y="168"
            textAnchor="middle"
            fill="#A855F7"
            fontSize="13"
            fontFamily="ui-monospace, monospace"
          >
            {t("about.diagramMonteCarlo")}
          </text>
        </g>
      </svg>
      <figcaption className="text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
