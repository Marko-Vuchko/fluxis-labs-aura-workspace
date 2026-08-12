const en = {
  brand: {
    name: "Aura Workspace",
    tagline: "Spatial Business Simulator",
    builtBy: "Built by Fluxis Labs",
  },
  ui: {
    adSpend: "Ad Spend",
    price: "Price",
    teamSize: "Team Size",
    opex: "Operating Costs",
    cashReserve: "Cash Reserve",
    seed: "Seed",
    reseed: "RESEED",
    resetSeed: "Fixed seed",
    reseedTooltip:
      "Draws a new random seed to prove this is a live stochastic simulation, not a precomputed table.",
    resetSeedTooltip: "Restore the demo to the fixed seed so the same inputs replay identically.",
    clientsPerHead: "Clients per head",
    costPerHead: "Cost per head",
    capacityEconomics: "Capacity economics",
    perMonth: "per month",
    month: "Month",
    revenue: "Revenue",
    profit: "Profit",
    margin: "Margin",
    endingCash: "Ending cash",
    customers: "Customers",
    churnRate: "Churn rate",
    capacityUsed: "Capacity used",
    cash: "Cash",
    health: "Health",
    runway: "Runway",
    profitable: "PROFITABLE",
    risk: "Risk",
    riskLoss: "Loss probability",
    riskOverload: "Team overload",
    riskVolatility: "Profit volatility",
    riskAdDependency: "Ad dependency",
    annualHistogram: "Annual profit distribution",
    annualBadge: "ANNUAL",
    projectionCurve: "12-month profit projection",
    close: "Close",
    sensitivity: "Sensitivity",
    iterations: "Iterations",
    computeMs: "Compute",
    computing: "COMPUTING",
    linkLost: "LINK LOST",
    stale: "STALE",
    language: "Language",
    english: "English",
    serbian: "Serbian",
    soundOn: "Sound on",
    soundOff: "Sound off",
    enterAura: "ENTER AURA",
    retry: "Retry",
    controlDeck: "Control Deck",
    copilot: "AI Strategic Copilot",
    copilotStale:
      "Connection lost. Copilot is showing the last known figures from the engine.",
    copilotEmpty: "Waiting for engine insights.",
    insightSeverityInfo: "Info",
    insightSeverityWarning: "Warning",
    insightSeverityCritical: "Critical",
    presets: {
      bootstrap: "Bootstrap",
      growth_push: "Growth Push",
      overload_crisis: "Overload Crisis",
      optimized: "Optimized",
    },
    nodes: {
      marketing: "Marketing",
      sales: "Sales",
      support: "Support",
      operations: "Operations",
      profit: "Profit",
      churn: "Churn",
      cash_runway: "Cash Runway",
    },
    status: {
      booting: "Booting",
      ready: "Ready",
      simulating: "Simulating",
      stale: "Stale",
      error: "Error",
    },
  },
  boot: {
    title: "Booting Aura Engine & Synchronizing Python Neural Nodes...",
    attempt: "Connection attempt {attempt}",
    responseMs: "Response time {ms} ms",
    engineVersion: "Engine version {version}",
    numpyWarmup: "NumPy warmup {ms} ms",
    firstSimReady: "First simulation payload received",
    waiting: "Waiting for engine wake...",
    failed: "Engine did not respond. You can retry.",
    ready: "Engine online. Press ENTER AURA to continue.",
  },
  insights: {
    CAP_BREACH:
      "Team capacity exceeded by {overload_pct} percent in month {month}. Demand already outruns what the current headcount can serve.",
    CAP_NEAR_LIMIT:
      "Capacity utilization reaches {capacity_used} percent in month {month}. The team is approaching saturation.",
    CAP_UNDERUSED:
      "Average capacity utilization sits at {capacity_used} percent. Headcount is underused relative to demand.",
    CAP_HIRE_SUGGESTED:
      "Capacity utilization peaks at {capacity_used} percent around month {month}. Additional hiring would relieve the forming bottleneck.",
    CAP_CHURN_FROM_OVERLOAD:
      "Overload is elevating churn to {churn_rate} percent by month {month}. Service strain is leaking customers.",
    PRICE_ABOVE_REFERENCE:
      "Price at {price} USD sits above the reference of {reference} USD. Conversion pressure is building.",
    PRICE_BELOW_REFERENCE:
      "Price at {price} USD sits below the reference of {reference} USD. Volume is easier while margin is thinner.",
    PRICE_CONVERSION_DROP:
      "At {price} USD, conversion is about {conv} percent versus an expected {expected_conv} percent at the reference price point.",
    PRICE_MARGIN_THIN:
      "Contribution margin is thin at {margin} percent. Small cost swings can erase profit.",
    PRICE_STRONGEST_LEVER:
      "Price is currently the strongest lever on profit. Directional moves here shift outcomes more than other inputs.",
    MKT_SATURATION:
      "Ad spend near {ad_spend} USD is hitting diminishing reach at {reach} percent. Extra spend buys less incremental demand.",
    MKT_EFFICIENT:
      "Reach sits at {reach} percent, still inside an efficient advertising band before heavy saturation.",
    MKT_DEPENDENCY_HIGH:
      "Advertising dependency stands at {ad_dependency} percent of the risk mix. Revenue is tightly coupled to paid acquisition.",
    MKT_UNDERSPEND:
      "Ad spend at {ad_spend} USD is well below the half-saturation mark of {half_saturation} USD. Demand is likely under-stimulated.",
    MKT_CAC_ABOVE_LTV:
      "CAC at {cac} USD exceeds LTV at {ltv} USD. Paid growth is destroying unit economics.",
    CASH_RUNWAY_CRITICAL:
      "Cash runway is critical at {runway_months} months. Liquidity risk is immediate.",
    CASH_RUNWAY_WARNING:
      "Cash runway is short at {runway_months} months. Watch burn before the next planning cycle.",
    CASH_PROFITABLE:
      "The firm is cash-flow positive in the projection window. Runway is reported as PROFITABLE.",
    CASH_BURN_RISING:
      "Monthly profit is deteriorating from {early_profit} USD early in the year toward {late_profit} USD later. Reserve coverage is being consumed faster.",
    CASH_LOSS_PROBABILITY:
      "Probability of a monthly loss is {loss_probability} percent. Downside scenarios remain material.",
    REC_TOP_LEVER:
      "{param} is currently the strongest lever on profit. Directional moves here shift outcomes more than other inputs.",
    REC_SECOND_LEVER:
      "{param} ranks as the second sensitivity lever on profit. It is the next place to probe after the primary lever.",
    unknown: "Insight code {code} is not in the dictionary.",
  },
  tour: {
    skip: "Skip tour",
    next: "Next",
    done: "Done",
    step1Title: "Spatial scene",
    step1Body:
      "Seven glowing nodes show operational health. Position and color come from the Python simulation, not from the browser.",
    step2Title: "Control Deck",
    step2Body:
      "Drag the five sliders to reshape the business. Every change asks the engine for a fresh Monte Carlo run.",
    step3Title: "Strategic Copilot",
    step3Body:
      "Three ranked insights explain what the numbers imply. Codes are translated locally so EN and SR stay numerically identical.",
    step4Title: "Presets",
    step4Body:
      "Jump into Bootstrap, Growth Push, Overload Crisis, or Optimized to stage a client-ready story in one click.",
  },
  about: {
    title: "About Aura Workspace",
    subtitle: "A portfolio-grade spatial business simulator by Fluxis Labs.",
    architectureHeading: "Architecture",
    architectureBody:
      "The browser never talks to the simulation host directly. Every request passes through Vercel route handlers that validate input and output, keep secrets server-side, and forward work to a Python FastAPI engine running Monte Carlo math with NumPy and Pandas.",
    monteCarloHeading: "Monte Carlo model",
    monteCarloBody:
      "Each slider change runs 1000 iterations across 12 months. The engine returns percentile bands, risk components, node coordinates, an annual profit histogram, sensitivity ranks, and three insight codes. The client renders those codes from a bilingual dictionary and never invents replacement figures when the link drops.",
    challengesHeading: "Build challenges",
    challengesBody:
      "Cold starts on free compute, strict CSP with nonces, same-origin API fencing, and a hard rule that business math stays off the client. The scene must stay interactive while results refresh, and stale data must remain visible rather than fabricated.",
    githubCta: "View GitHub profile",
    fluxisPlaceholder: "Fluxis Labs site (URL placeholder)",
  },
  test: {
    title: "Simulation harness (temporary)",
    dragHint: "Drag a slider, then release. Debounced requests fire while dragging; a final request fires on release.",
    languageHint: "Switch language to verify labels update without reload.",
    lastRequest: "Last request status",
    rawMonth: "Selected month raw figures",
    rawAnnual: "Annual p50 figures",
    rawInsights: "Insight codes",
  },
} as const;

type StringTree<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? StringTree<T[K]>
      : never;
};

const sr = {
  brand: {
    name: "Aura Workspace",
    tagline: "Prostorni poslovni simulator",
    builtBy: "Izradila Fluxis Labs",
  },
  ui: {
    adSpend: "Budzet za reklame",
    price: "Cena",
    teamSize: "Velicina tima",
    opex: "Operativni troskovi",
    cashReserve: "Gotovinska rezerva",
    seed: "Seed",
    reseed: "RESEED",
    resetSeed: "Fiksni seed",
    reseedTooltip:
      "Vuce novi nasumicni seed da dokaze da je ovo ziva stohasticka simulacija, a ne unapred izracunata tabela.",
    resetSeedTooltip:
      "Vraca demo na fiksni seed tako da isti ulazi uvek daju isti rezultat.",
    clientsPerHead: "Klijenata po osobi",
    costPerHead: "Trosak po osobi",
    capacityEconomics: "Ekonomija kapaciteta",
    perMonth: "mesecno",
    month: "Mesec",
    revenue: "Prihod",
    profit: "Profit",
    margin: "Marza",
    endingCash: "Zavrsna gotovina",
    customers: "Klijenti",
    churnRate: "Stopa odliva",
    capacityUsed: "Iskoriscen kapacitet",
    cash: "Gotovina",
    health: "Zdravlje",
    runway: "Runway",
    profitable: "PROFITABILNO",
    risk: "Rizik",
    riskLoss: "Verovatnoca gubitka",
    riskOverload: "Preopterecenje tima",
    riskVolatility: "Volatilnost profita",
    riskAdDependency: "Zavisnost od reklame",
    annualHistogram: "Raspodela godisnjeg profita",
    annualBadge: "GODISNJI",
    projectionCurve: "Dvanaestomesecna projekcija profita",
    close: "Zatvori",
    sensitivity: "Osetljivost",
    iterations: "Iteracije",
    computeMs: "Racunanje",
    computing: "RACUNANJE",
    linkLost: "VEZA IZGUBLJENA",
    stale: "ZASTARELO",
    language: "Jezik",
    english: "Engleski",
    serbian: "Srpski",
    soundOn: "Zvuk ukljucen",
    soundOff: "Zvuk iskljucen",
    enterAura: "UDJI U AURU",
    retry: "Pokusaj ponovo",
    controlDeck: "Kontrolna tabla",
    copilot: "AI strateski kopilot",
    copilotStale:
      "Veza je prekinuta. Kopilot prikazuje poslednje poznate brojke iz engine-a.",
    copilotEmpty: "Cekam uvide engine-a.",
    insightSeverityInfo: "Info",
    insightSeverityWarning: "Upozorenje",
    insightSeverityCritical: "Kriticno",
    presets: {
      bootstrap: "Bootstrap",
      growth_push: "Growth Push",
      overload_crisis: "Overload Crisis",
      optimized: "Optimized",
    },
    nodes: {
      marketing: "Marketing",
      sales: "Prodaja",
      support: "Podrska",
      operations: "Operacije",
      profit: "Profit",
      churn: "Odliv",
      cash_runway: "Cash Runway",
    },
    status: {
      booting: "Pokretanje",
      ready: "Spremno",
      simulating: "Simulacija",
      stale: "Zastarelo",
      error: "Greska",
    },
  },
  boot: {
    title: "Booting Aura Engine & Synchronizing Python Neural Nodes...",
    attempt: "Pokusaj konekcije {attempt}",
    responseMs: "Vreme odgovora {ms} ms",
    engineVersion: "Verzija engine-a {version}",
    numpyWarmup: "NumPy zagrevanje {ms} ms",
    firstSimReady: "Prva simulacija je stigla",
    waiting: "Cekam budenje engine-a...",
    failed: "Engine nije odgovorio. Mozete pokusati ponovo.",
    ready: "Engine je online. Pritisnite UDJI U AURU da nastavite.",
  },
  insights: {
    CAP_BREACH:
      "Kapacitet tima je premasen za {overload_pct} posto u mesecu {month}. Traznja vec nadmasuje ono sto trenutni tim moze da opsluzi.",
    CAP_NEAR_LIMIT:
      "Iskoriscenje kapaciteta dize se na {capacity_used} posto u mesecu {month}. Tim se priblizava saturaciji.",
    CAP_UNDERUSED:
      "Prosecno iskoriscenje kapaciteta je na {capacity_used} posto. Tim je nedovoljno iskoriscen u odnosu na traznju.",
    CAP_HIRE_SUGGESTED:
      "Iskoriscenje kapaciteta dize se na vrh od {capacity_used} posto oko meseca {month}. Dodatno zaposljavanje rasteretilo bi usko grlo koje se formira.",
    CAP_CHURN_FROM_OVERLOAD:
      "Preopterecenje dize odliv na {churn_rate} posto do meseca {month}. Pritisak na servis gubi klijente.",
    PRICE_ABOVE_REFERENCE:
      "Cena od {price} USD je iznad reference od {reference} USD. Pritisak na konverziju raste.",
    PRICE_BELOW_REFERENCE:
      "Cena od {price} USD je ispod reference od {reference} USD. Volumen je laksi, a marza tanja.",
    PRICE_CONVERSION_DROP:
      "Pri ceni od {price} USD, konverzija je oko {conv} posto naspram ocekivanih {expected_conv} posto na referentnoj ceni.",
    PRICE_MARGIN_THIN:
      "Kontribuciona marza je tanka na {margin} posto. Mali skokovi troska mogu obrisati profit.",
    PRICE_STRONGEST_LEVER:
      "Cena je trenutno najjaca poluga na profit. Pomeraji ovde pomeraju ishod vise nego drugi ulazi.",
    MKT_SATURATION:
      "Budzet za reklame oko {ad_spend} USD udara u opadajuci doseg od {reach} posto. Dodatni spend kupuje manje nove traznje.",
    MKT_EFFICIENT:
      "Doseg je na {reach} posto i jos je u efikasnom reklamnom opsegu pre jake saturacije.",
    MKT_DEPENDENCY_HIGH:
      "Zavisnost od reklame stoji na {ad_dependency} posto rizika. Prihod je cvrsto vezan za placenu akviziciju.",
    MKT_UNDERSPEND:
      "Budzet za reklame od {ad_spend} USD je znatno ispod polovine saturacije od {half_saturation} USD. Traznja je verovatno podstimulisana.",
    MKT_CAC_ABOVE_LTV:
      "CAC od {cac} USD premasuje LTV od {ltv} USD. Placeni rast unistava jedinicnu ekonomiju.",
    CASH_RUNWAY_CRITICAL:
      "Cash runway je kritican na {runway_months} meseci. Rizik likvidnosti je neposredan.",
    CASH_RUNWAY_WARNING:
      "Cash runway je kratak na {runway_months} meseci. Pratite burn pre sledeceg plana.",
    CASH_PROFITABLE:
      "Firma je cash-flow pozitivna u projekcionom prozoru. Runway se prikazuje kao PROFITABILNO.",
    CASH_BURN_RISING:
      "Mesecni profit slabi sa {early_profit} USD ranije u godini ka {late_profit} USD kasnije. Rezerva se trosi brze.",
    CASH_LOSS_PROBABILITY:
      "Verovatnoca mesecnog gubitka je {loss_probability} posto. Negativni scenariji i dalje bitno uticu.",
    REC_TOP_LEVER:
      "{param} je trenutno najjaca poluga na profit. Pomeraji ovde pomeraju ishod vise nego drugi ulazi.",
    REC_SECOND_LEVER:
      "{param} je druga poluga osetljivosti na profit. To je sledece mesto za proveru posle primarne poluge.",
    unknown: "Insight kod {code} nije u recniku.",
  },
  tour: {
    skip: "Preskoci turu",
    next: "Dalje",
    done: "Gotovo",
    step1Title: "Prostorna scena",
    step1Body:
      "Sedam svetlecih cvorova pokazuje operativno zdravlje. Polozaj i boja dolaze iz Python simulacije, ne iz browsera.",
    step2Title: "Kontrolna tabla",
    step2Body:
      "Pomerajte pet slajdera da preoblikujete biznis. Svaka promena trazi od engine-a novi Monte Carlo prolaz.",
    step3Title: "Strateski kopilot",
    step3Body:
      "Tri rangirana uvida objasnjavaju sta brojke znace. Kodovi se prevode lokalno, pa EN i SR ostaju brojcano identicni.",
    step4Title: "Presetovi",
    step4Body:
      "Skocite na Bootstrap, Growth Push, Overload Crisis ili Optimized i za jedan klik postavite pricu spremnu za klijenta.",
  },
  about: {
    title: "O Aura Workspace",
    subtitle: "Portfolio prostorni poslovni simulator agencije Fluxis Labs.",
    architectureHeading: "Arhitektura",
    architectureBody:
      "Browser nikada ne razgovara direktno sa hostom simulacije. Svaki zahtev prolazi kroz Vercel route handlere koji validiraju ulaz i izlaz, cuvaju tajne na serveru i prosledjuju posao Python FastAPI engine-u sa Monte Carlo matematikom preko NumPy i Pandas.",
    monteCarloHeading: "Monte Carlo model",
    monteCarloBody:
      "Svaka promena slajdera pokrece 1000 iteracija kroz 12 meseci. Engine vraca percentilne opsege, komponente rizika, koordinate cvorova, histogram godisnjeg profita, rangove osetljivosti i tri insight koda. Klijent te kodove renderuje iz dvojezicnog recnika i nikada ne izmislja zamenske brojke kada veza padne.",
    challengesHeading: "Izazovi izgradnje",
    challengesBody:
      "Cold start na besplatnom compute-u, strogi CSP sa nonce vrednostima, same-origin API ograda i tvrdo pravilo da poslovna matematika ostaje van klijenta. Scena mora da ostane interaktivna dok rezultati stizu, a zastareli podaci moraju da ostanu vidljivi umesto da se izmisle.",
    githubCta: "Pogledaj GitHub profil",
    fluxisPlaceholder: "Fluxis Labs sajt (URL placeholder)",
  },
  test: {
    title: "Simulacioni harness (privremeno)",
    dragHint:
      "Prevucite slajder, zatim otpustite. Debounce zahtevi idu tokom prevlacenja; finalni zahtev ide na otpustanje.",
    languageHint: "Promenite jezik da proverite da se labele menjaju bez reload-a.",
    lastRequest: "Status poslednjeg zahteva",
    rawMonth: "Sirove brojke izabranog meseca",
    rawAnnual: "Godisnje p50 brojke",
    rawInsights: "Insight kodovi",
  },
} as const satisfies StringTree<typeof en>;

export const dictionary = {
  en,
  sr,
} as const;

export type Locale = keyof typeof dictionary;
export type Dictionary = (typeof dictionary)[Locale];

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? Join<K, LeafPaths<T[K]>>
      : never;
}[keyof T & string];

export type DictionaryKey = LeafPaths<(typeof dictionary)["en"]>;

export const LOCALES: readonly Locale[] = ["en", "sr"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "aura.locale";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "sr";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionary[locale];
}

export function getMessage(
  locale: Locale,
  key: DictionaryKey,
): string {
  const parts = key.split(".");
  let current: unknown = dictionary[locale];

  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(part in current)
    ) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : key;
}

/**
 * Text-only interpolation. Replaces {name} tokens from params.
 * Never returns HTML.
 */
export function interpolate(
  template: string,
  params?: Readonly<Record<string, string | number>>,
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      return match;
    }
    return String(value);
  });
}

export function translate(
  locale: Locale,
  key: DictionaryKey,
  params?: Readonly<Record<string, string | number>>,
): string {
  return interpolate(getMessage(locale, key), params);
}

export type InsightDictionaryKey = `insights.${keyof typeof en.insights}`;

export function isInsightKey(key: string): key is InsightDictionaryKey {
  return key.startsWith("insights.") && key.slice("insights.".length) in en.insights;
}
