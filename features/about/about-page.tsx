"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ArchitectureDiagram } from "@/features/about/architecture-diagram";
import { LanguageSwitch } from "@/features/hud/language-switch";
import { CornerBracket } from "@/features/hud/hud-chrome";
import { useLanguage } from "@/lib/i18n/language-provider";
import {
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
  SITE_NAME,
  getContactCta,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

const CHALLENGE_KEYS = [
  {
    title: "about.challenge1Title",
    body: "about.challenge1Body",
  },
  {
    title: "about.challenge2Title",
    body: "about.challenge2Body",
  },
  {
    title: "about.challenge3Title",
    body: "about.challenge3Body",
  },
  {
    title: "about.challenge4Title",
    body: "about.challenge4Body",
  },
] as const;

const MONTE_STEPS = [
  {
    title: "about.monteCarloStep1Title",
    body: "about.monteCarloStep1Body",
  },
  {
    title: "about.monteCarloStep2Title",
    body: "about.monteCarloStep2Body",
  },
  {
    title: "about.monteCarloStep3Title",
    body: "about.monteCarloStep3Body",
  },
  {
    title: "about.monteCarloStep4Title",
    body: "about.monteCarloStep4Body",
  },
] as const;

function SectionPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/18 bg-[#070b14]/78 p-5 sm:p-6",
        "shadow-[0_0_28px_-22px_rgb(34_211_238_/_0.28)] backdrop-blur-md",
        className,
      )}
    >
      <CornerBracket className="top-2 left-2 border-t border-l" />
      <CornerBracket className="top-2 right-2 border-t border-r" />
      <CornerBracket className="bottom-2 left-2 border-b border-l" />
      <CornerBracket className="right-2 bottom-2 border-r border-b" />
      {children}
    </section>
  );
}

export function AboutPageContent() {
  const { t } = useLanguage();
  const contact = getContactCta();

  return (
    <main className="relative min-h-dvh bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgb(34_211_238_/_0.1),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgb(168_85_247_/_0.07),_transparent_50%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              {SITE_NAME}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("about.title")}
            </h1>
            <p className="max-w-xl text-muted-foreground">
              {t("about.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitch />
            <Link
              href="/"
              className="rounded-xl border border-primary/25 px-3 py-1.5 text-sm text-primary transition hover:border-primary/50 hover:bg-primary/10"
            >
              {t("about.backHome")}
            </Link>
          </div>
        </header>

        <SectionPanel>
          <h2 className="text-xl font-semibold text-primary">
            {t("about.architectureHeading")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("about.architectureBody")}
          </p>
          <div className="mt-5">
            <ArchitectureDiagram caption={t("about.architectureCaption")} />
          </div>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold text-primary">
            {t("about.monteCarloHeading")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("about.monteCarloBody")}
          </p>
          <ol className="mt-5 space-y-4">
            {MONTE_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 font-mono text-xs text-primary">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-foreground">
                    {t(step.title)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(step.body)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold text-primary">
            {t("about.challengesHeading")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("about.challengesIntro")}
          </p>
          <ul className="mt-5 space-y-4">
            {CHALLENGE_KEYS.map((item) => (
              <li
                key={item.title}
                className="border-l-2 border-accent/50 pl-4"
              >
                <h3 className="font-medium text-foreground">
                  {t(item.title)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(item.body)}
                </p>
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold text-primary">
            {t("about.linksHeading")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/85"
            >
              {t("about.repoCta")}
            </a>
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-primary/25 px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/10"
            >
              {t("about.githubCta")}
            </a>
          </div>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold text-primary">
            {t("about.contactHeading")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("about.contactBody")}
          </p>
          <a
            href={contact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-xl border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/10"
          >
            {contact.kind === "fluxis"
              ? t("about.contactCta")
              : t("about.contactCtaGithub")}
          </a>
        </SectionPanel>
      </div>
    </main>
  );
}
