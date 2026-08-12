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
    awaitingSimulation: "Awaiting simulation",
    p10: "p10",
    p90: "p90",
    escape: "Esc",
    monthsUnit: "{n} mo",
    monthAbbrev: "M{n}",
    moreActions: "More",
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
    retryConnection: "Retry connection",
    controlDeck: "Control Deck",
    controlDeckOpen: "Open control deck",
    controlDeckClose: "Close control deck",
    copilot: "AI Strategic Copilot",
    copilotStale:
      "Connection lost. Copilot is showing the last known figures from the engine.",
    copilotEmpty: "Waiting for engine insights.",
    previousInsight: "Previous insight",
    nextInsight: "Next insight",
    increaseParam: "Increase {label}",
    decreaseParam: "Decrease {label}",
    insightPosition: "{current} of {total}",
    insightSeverityInfo: "Info",
    insightSeverityWarning: "Warning",
    insightSeverityCritical: "Critical",
    presets: {
      bootstrap: "Bootstrap",
      growth_push: "Growth Push",
      overload_crisis: "Overload Crisis",
      optimized: "Optimized",
    },
    webglUnavailable: "WebGL is unavailable on this device",
    webglContextLost: "Graphics context lost - recovering figures in 2D",
    webglRetry: "Retry 3D",
    sceneFallbackBadge: "Fallback telemetry",
    sceneFallbackBody:
      "All figures below are the last values returned by the Python engine. Nothing here is calculated in the browser.",
    panelFault: "Signal fault",
    panelError: "This panel failed to render",
    panelRetry: "Reinitialize",
    panelUnexpected: "Unexpected render failure",
    routeErrorTitle: "Workspace signal lost",
    routeErrorBody:
      "Aura hit an unexpected fault. Reinitialize to restore the simulator.",
    routeErrorRetry: "Reinitialize",
    notFoundCode: "404",
    notFoundTitle: "Coordinate not found",
    notFoundBody:
      "This path is off the Aura map. Return to the simulator or read the case study.",
    notFoundHome: "Return to simulator",
    notFoundAbout: "About Aura",
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
  a11y: {
    skipToControls: "Skip to controls",
    sceneRegion: "Spatial scene",
    sceneKeyboardHint:
      "The 3D scene is pointer-driven. Use Control Deck, metrics, Copilot, and the month scrubber for full keyboard access. When WebGL is unavailable, a 2D fallback panel exposes the same figures.",
    controlDeckRegion: "Control deck",
    metricsRegion: "Key metrics",
    copilotRegion: "Strategic copilot",
    statusComputing: "Computing simulation",
    statusLinkLost: "Link lost. Showing stale results.",
  },
  errors: {
    aborted: "Request aborted",
    simulateFailed: "Simulate failed ({status})",
    invalidSimulate: "Invalid simulate response",
    simulateRequest: "Simulate request failed",
    healthCheck: "Health check failed",
    invalidHealth: "Invalid health response",
    healthFailed: "Health failed ({status})",
    healthRequest: "Health request failed",
  },
  boot: {
    title: "Booting Aura Engine & Synchronizing Python Neural Nodes...",
    attempt: "Connection attempt {attempt}",
    responseMs: "Response time {ms} ms",
    engineVersion: "Engine version {version}",
    numpyWarmup: "NumPy warmup {ms} ms",
    firstSimReady: "First simulation payload received",
    unreachable: "Health check failed",
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
    restart: "Restart tour",
    progress: "Step {current} of {total}",
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
  shortcuts: {
    kicker: "HUD",
    title: "Keyboard shortcuts",
    slidersLabel: "Sliders",
    sliders:
      "Drag a Control Deck slider to preview. Release to commit a Monte Carlo run and update the shareable URL.",
    escapeLabel: "Escape",
    escape:
      "Closes the node card, guided tour, mobile deck, and this overlay.",
    tourLabel: "Tour",
    tour: "The guided tour walks the scene, Control Deck, Copilot, and presets. Restart it from the header after you finish.",
    toggleHint: "Press ? to show or hide this card.",
    close: "Close",
  },
  about: {
    title: "About Aura Workspace",
    metaTitle: "About - {name}",
    metaDescription:
      "A spatial 3D command center that runs live Monte Carlo SaaS scenarios through a Python engine. Built by Fluxis Labs.",
    subtitle: "A portfolio-grade spatial business simulator by Fluxis Labs.",
    backHome: "Back to simulator",
    architectureHeading: "Architecture",
    architectureBody:
      "The browser never talks to the simulation host directly. Every request passes through Vercel route handlers that validate input and output, keep secrets server-side, and forward work to a Python FastAPI engine running Monte Carlo math with NumPy and Pandas.",
    architectureCaption:
      "Browser to Vercel (WAF, CSP, Zod) to Render FastAPI engine, then back with validated results.",
    diagramBrowser: "Browser",
    diagramHudScene: "HUD + 3D scene",
    diagramUseSimulation: "useSimulation",
    diagramVercel: "Vercel",
    diagramEdge: "DDoS + WAF + BotID",
    diagramProxyCsp: "proxy.ts CSP nonce",
    diagramRouteZod: "Route Handler + Zod",
    diagramRender: "Render Free",
    diagramFastapi: "FastAPI + guards",
    diagramMonteCarlo: "1000 × 12 months",
    monteCarloHeading: "Monte Carlo model",
    monteCarloBody:
      "Think of Monte Carlo as asking the same business question a thousand times with slightly different luck each time. Instead of one optimistic spreadsheet, you get a cloud of plausible futures and a clear sense of how often the plan works.",
    monteCarloStep1Title: "You set the knobs",
    monteCarloStep1Body:
      "Ad spend, price, team size, operating costs, and cash reserve describe how the SaaS firm plans to run for a year.",
    monteCarloStep2Title: "The engine rolls the dice",
    monteCarloStep2Body:
      "Each of the 1000 runs varies lead cost, conversion, and churn within realistic ranges, then steps month by month for 12 months.",
    monteCarloStep3Title: "Capacity is a hard limit",
    monteCarloStep3Body:
      "A fixed team can only serve so many clients. When demand overruns capacity, overload raises churn and squeezes profit.",
    monteCarloStep4Title: "You see ranges, not a single guess",
    monteCarloStep4Body:
      "The UI shows percentile bands, risk components, node health, and plain-language insights. The browser never invents replacement numbers if the link drops.",
    challengesHeading: "Technical challenges",
    challengesIntro:
      "The hard parts were not the 3D glow. They were trust, latency, and keeping every figure honest under failure.",
    challenge1Title: "Cold starts on free compute",
    challenge1Body:
      "Render Free can sleep. The boot screen pings health, shows real wake telemetry, and only unlocks ENTER AURA after the engine answers.",
    challenge2Title: "Secrets stay server-side",
    challenge2Body:
      "The browser never learns the Render URL or shared secret. Route handlers validate with Zod, attach the key, and return generic errors on failure.",
    challenge3Title: "Math never runs in the browser",
    challenge3Body:
      "When the link is lost, the scene keeps the last Python result marked stale. No client-side fallback arithmetic is allowed.",
    challenge4Title: "Strict CSP and same-origin fencing",
    challenge4Body:
      "Nonce-based CSP, BotID on simulate, and Origin checks keep the public demo from becoming an open proxy into the engine.",
    linksHeading: "Links",
    githubCta: "View GitHub profile",
    repoCta: "View source on GitHub",
    contactHeading: "Work with Fluxis Labs",
    contactBody:
      "Aura Workspace is the lead portfolio exhibit for Fluxis Labs - spatial simulation, WebGL craft, and production-grade security in one demo.",
    contactCta: "Visit Fluxis Labs",
    contactCtaGithub: "Contact on GitHub",
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
    adSpend: "Budžet za reklame",
    price: "Cena",
    teamSize: "Veličina tima",
    opex: "Operativni troškovi",
    cashReserve: "Gotovinska rezerva",
    seed: "Seed",
    reseed: "RESEED",
    resetSeed: "Fiksni seed",
    reseedTooltip:
      "Vuče novi nasumični seed da dokaže da je ovo živa stohastička simulacija, a ne unapred izračunata tabela.",
    resetSeedTooltip:
      "Vraća demo na fiksni seed tako da isti ulazi uvek daju isti rezultat.",
    clientsPerHead: "Klijenata po osobi",
    costPerHead: "Trošak po osobi",
    capacityEconomics: "Ekonomija kapaciteta",
    perMonth: "mesečno",
    month: "Mesec",
    revenue: "Prihod",
    profit: "Profit",
    margin: "Marža",
    endingCash: "Završna gotovina",
    customers: "Klijenti",
    churnRate: "Stopa odliva",
    capacityUsed: "Iskorišćen kapacitet",
    cash: "Gotovina",
    health: "Zdravlje",
    runway: "Runway",
    profitable: "PROFITABILNO",
    awaitingSimulation: "Čekam simulaciju",
    p10: "p10",
    p90: "p90",
    escape: "Esc",
    monthsUnit: "{n} mes.",
    monthAbbrev: "M{n}",
    moreActions: "Još",
    risk: "Rizik",
    riskLoss: "Verovatnoća gubitka",
    riskOverload: "Preopterećenje tima",
    riskVolatility: "Volatilnost profita",
    riskAdDependency: "Zavisnost od reklame",
    annualHistogram: "Raspodela godišnjeg profita",
    annualBadge: "GODIŠNJI",
    projectionCurve: "Dvanaestomesečna projekcija profita",
    close: "Zatvori",
    sensitivity: "Osetljivost",
    iterations: "Iteracije",
    computeMs: "Računanje",
    computing: "RAČUNANJE",
    linkLost: "VEZA IZGUBLJENA",
    stale: "ZASTARELO",
    language: "Jezik",
    english: "Engleski",
    serbian: "Srpski",
    soundOn: "Zvuk uključen",
    soundOff: "Zvuk isključen",
    enterAura: "UĐI U AURU",
    retry: "Pokušaj ponovo",
    retryConnection: "Ponovo poveži",
    controlDeck: "Kontrolna tabla",
    controlDeckOpen: "Otvori kontrolnu tablu",
    controlDeckClose: "Zatvori kontrolnu tablu",
    copilot: "AI strateški kopilot",
    copilotStale:
      "Veza je prekinuta. Kopilot prikazuje poslednje poznate brojke iz engine-a.",
    copilotEmpty: "Čekam uvide engine-a.",
    previousInsight: "Prethodni uvid",
    nextInsight: "Sledeći uvid",
    increaseParam: "Povećaj {label}",
    decreaseParam: "Smanji {label}",
    insightPosition: "{current} od {total}",
    insightSeverityInfo: "Info",
    insightSeverityWarning: "Upozorenje",
    insightSeverityCritical: "Kritično",
    presets: {
      bootstrap: "Početak",
      growth_push: "Guranje rasta",
      overload_crisis: "Kriza preopterećenja",
      optimized: "Optimizovano",
    },
    webglUnavailable: "WebGL nije dostupan na ovom uređaju",
    webglContextLost: "Grafički kontekst izgubljen - brojke ostaju u 2D prikazu",
    webglRetry: "Pokušaj 3D ponovo",
    sceneFallbackBadge: "Zamenska telemetrija",
    sceneFallbackBody:
      "Sve brojke ispod su poslednje vrednosti koje je vratio Python engine. Ništa ovde se ne računa u browseru.",
    panelFault: "Signal greške",
    panelError: "Ovaj panel nije uspeo da se prikaže",
    panelRetry: "Ponovo pokreni",
    panelUnexpected: "Neočekivan pad pri renderu",
    routeErrorTitle: "Signal radnog prostora izgubljen",
    routeErrorBody:
      "Aura je naišla na neočekivanu grešku. Ponovo pokreni da vratiš simulator.",
    routeErrorRetry: "Ponovo pokreni",
    notFoundCode: "404",
    notFoundTitle: "Koordinata nije pronađena",
    notFoundBody:
      "Ova putanja je van mape Aure. Vrati se na simulator ili pročitaj studiju slučaja.",
    notFoundHome: "Nazad na simulator",
    notFoundAbout: "O Auri",
    nodes: {
      marketing: "Marketing",
      sales: "Prodaja",
      support: "Podrška",
      operations: "Operacije",
      profit: "Profit",
      churn: "Odliv",
      cash_runway: "Trajanje gotovine",
    },
    status: {
      booting: "Pokretanje",
      ready: "Spremno",
      simulating: "Simulacija",
      stale: "Zastarelo",
      error: "Greška",
    },
  },
  a11y: {
    skipToControls: "Preskoči na kontrole",
    sceneRegion: "Prostorna scena",
    sceneKeyboardHint:
      "3D scena se upravlja pokazivačem. Za pun pristup tastaturom koristi Kontrolnu tablu, metrike, Kopilot i scrubber meseca. Kada WebGL nije dostupan, 2D zamenski panel prikazuje iste brojke.",
    controlDeckRegion: "Kontrolna tabla",
    metricsRegion: "Ključne metrike",
    copilotRegion: "Strateški kopilot",
    statusComputing: "Računanje simulacije",
    statusLinkLost: "Veza izgubljena. Prikazuju se zastareli rezultati.",
  },
  errors: {
    aborted: "Zahtev je otkazan",
    simulateFailed: "Simulacija nije uspela ({status})",
    invalidSimulate: "Nevažeći odgovor simulacije",
    simulateRequest: "Zahtev za simulaciju nije uspeo",
    healthCheck: "Health provera nije uspela",
    invalidHealth: "Nevažeći health odgovor",
    healthFailed: "Health nije uspeo ({status})",
    healthRequest: "Health zahtev nije uspeo",
  },
  boot: {
    title: "Pokretanje Aura Engine-a i sinhronizacija Python neuralnih čvorova...",
    attempt: "Pokušaj konekcije {attempt}",
    responseMs: "Vreme odgovora {ms} ms",
    engineVersion: "Verzija engine-a {version}",
    numpyWarmup: "NumPy zagrevanje {ms} ms",
    firstSimReady: "Prva simulacija je stigla",
    unreachable: "Health provera nije uspela",
    waiting: "Čekam buđenje engine-a...",
    failed: "Engine nije odgovorio. Možete pokušati ponovo.",
    ready: "Engine je online. Pritisnite UĐI U AURU da nastavite.",
  },
  insights: {
    CAP_BREACH:
      "Kapacitet tima je premašen za {overload_pct} posto u mesecu {month}. Tražnja već nadmašuje ono što trenutni tim može da opsluži.",
    CAP_NEAR_LIMIT:
      "Iskorišćenje kapaciteta diže se na {capacity_used} posto u mesecu {month}. Tim se približava saturaciji.",
    CAP_UNDERUSED:
      "Prosečno iskorišćenje kapaciteta je na {capacity_used} posto. Tim je nedovoljno iskorišćen u odnosu na tražnju.",
    CAP_HIRE_SUGGESTED:
      "Iskorišćenje kapaciteta diže se na vrh od {capacity_used} posto oko meseca {month}. Dodatno zapošljavanje rasteretilo bi usko grlo koje se formira.",
    CAP_CHURN_FROM_OVERLOAD:
      "Preopterećenje diže odliv na {churn_rate} posto do meseca {month}. Pritisak na servis gubi klijente.",
    PRICE_ABOVE_REFERENCE:
      "Cena od {price} USD je iznad reference od {reference} USD. Pritisak na konverziju raste.",
    PRICE_BELOW_REFERENCE:
      "Cena od {price} USD je ispod reference od {reference} USD. Volumen je lakši, a marža tanja.",
    PRICE_CONVERSION_DROP:
      "Pri ceni od {price} USD, konverzija je oko {conv} posto naspram očekivanih {expected_conv} posto na referentnoj ceni.",
    PRICE_MARGIN_THIN:
      "Kontribuciona marža je tanka na {margin} posto. Mali skokovi troška mogu obrisati profit.",
    PRICE_STRONGEST_LEVER:
      "Cena je trenutno najjača poluga na profit. Pomeraji ovde pomeraju ishod više nego drugi ulazi.",
    MKT_SATURATION:
      "Budžet za reklame oko {ad_spend} USD udara u opadajući doseg od {reach} posto. Dodatni spend kupuje manje nove tražnje.",
    MKT_EFFICIENT:
      "Doseg je na {reach} posto i još je u efikasnom reklamnom opsegu pre jake saturacije.",
    MKT_DEPENDENCY_HIGH:
      "Zavisnost od reklame stoji na {ad_dependency} posto rizika. Prihod je čvrsto vezan za plaćenu akviziciju.",
    MKT_UNDERSPEND:
      "Budžet za reklame od {ad_spend} USD je znatno ispod polovine saturacije od {half_saturation} USD. Tražnja je verovatno podstimulisana.",
    MKT_CAC_ABOVE_LTV:
      "CAC od {cac} USD premašuje LTV od {ltv} USD. Plaćeni rast uništava jediničnu ekonomiju.",
    CASH_RUNWAY_CRITICAL:
      "Trajanje gotovine je kritično na {runway_months} meseci. Rizik likvidnosti je neposredan.",
    CASH_RUNWAY_WARNING:
      "Trajanje gotovine je kratko na {runway_months} meseci. Pratite burn pre sledećeg plana.",
    CASH_PROFITABLE:
      "Firma je cash-flow pozitivna u projekcionom prozoru. Runway se prikazuje kao PROFITABILNO.",
    CASH_BURN_RISING:
      "Mesečni profit slabi sa {early_profit} USD ranije u godini ka {late_profit} USD kasnije. Rezerva se troši brže.",
    CASH_LOSS_PROBABILITY:
      "Verovatnoća mesečnog gubitka je {loss_probability} posto. Negativni scenariji i dalje bitno utiču.",
    REC_TOP_LEVER:
      "{param} je trenutno najjača poluga na profit. Pomeraji ovde pomeraju ishod više nego drugi ulazi.",
    REC_SECOND_LEVER:
      "{param} je druga poluga osetljivosti na profit. To je sledeće mesto za proveru posle primarne poluge.",
    unknown: "Insight kod {code} nije u rečniku.",
  },
  tour: {
    skip: "Preskoči turu",
    next: "Dalje",
    done: "Gotovo",
    restart: "Ponovo pokreni turu",
    progress: "Korak {current} od {total}",
    step1Title: "Prostorna scena",
    step1Body:
      "Sedam svetlećih čvorova pokazuje operativno zdravlje. Položaj i boja dolaze iz Python simulacije, ne iz browsera.",
    step2Title: "Kontrolna tabla",
    step2Body:
      "Pomerajte pet slajdera da preoblikujete biznis. Svaka promena traži od engine-a novi Monte Carlo prolaz.",
    step3Title: "Strateški kopilot",
    step3Body:
      "Tri rangirana uvida objašnjavaju šta brojke znače. Kodovi se prevode lokalno, pa EN i SR ostaju brojčano identični.",
    step4Title: "Presetovi",
    step4Body:
      "Skočite na Početak, Guranje rasta, Kriza preopterećenja ili Optimizovano i za jedan klik postavite priču spremnu za klijenta.",
  },
  shortcuts: {
    kicker: "HUD",
    title: "Prečice na tastaturi",
    slidersLabel: "Slajderi",
    sliders:
      "Povucite slajder na kontrolnoj tabli za pregled. Pustite da se pošalje Monte Carlo prolaz i ažurira URL za deljenje.",
    escapeLabel: "Escape",
    escape:
      "Zatvara karticu čvora, vođenu turu, mobilnu tablu i ovaj overlay.",
    tourLabel: "Tura",
    tour: "Vođena tura prolazi scenu, kontrolnu tablu, kopilot i presetove. Ponovo je pokrenite iz zaglavlja kad završite.",
    toggleHint: "Pritisnite ? da prikažete ili sakrijete ovu karticu.",
    close: "Zatvori",
  },
  about: {
    title: "O Aura Workspace",
    metaTitle: "O projektu - {name}",
    metaDescription:
      "Prostorni 3D komandni centar koji pokreće uživo Monte Carlo SaaS scenarije preko Python engine-a. Izradila Fluxis Labs.",
    subtitle: "Portfolio prostorni poslovni simulator agencije Fluxis Labs.",
    backHome: "Nazad na simulator",
    architectureHeading: "Arhitektura",
    architectureBody:
      "Browser nikada ne razgovara direktno sa hostom simulacije. Svaki zahtev prolazi kroz Vercel route handlere koji validiraju ulaz i izlaz, čuvaju tajne na serveru i prosleđuju posao Python FastAPI engine-u sa Monte Carlo matematikom preko NumPy i Pandas.",
    architectureCaption:
      "Browser ka Vercel-u (WAF, CSP, Zod), zatim ka Render FastAPI engine-u, pa nazad sa validiranim rezultatima.",
    diagramBrowser: "Browser",
    diagramHudScene: "HUD + 3D scena",
    diagramUseSimulation: "useSimulation",
    diagramVercel: "Vercel",
    diagramEdge: "DDoS + WAF + BotID",
    diagramProxyCsp: "proxy.ts CSP nonce",
    diagramRouteZod: "Route Handler + Zod",
    diagramRender: "Render Free",
    diagramFastapi: "FastAPI + zaštita",
    diagramMonteCarlo: "1000 × 12 meseci",
    monteCarloHeading: "Monte Carlo model",
    monteCarloBody:
      "Zamislite Monte Carlo kao isto poslovno pitanje postavljeno hiljadu puta, svaki put sa malo drugačijom srećom. Umesto jedne optimističke tabele dobijate oblak uverljivih budućnosti i jasan osećaj koliko često plan stvarno radi.",
    monteCarloStep1Title: "Vi podešavate poluge",
    monteCarloStep1Body:
      "Budžet za reklame, cena, veličina tima, operativni troškovi i gotovinska rezerva opisuju kako SaaS firma planira da radi godinu dana.",
    monteCarloStep2Title: "Engine baca kockice",
    monteCarloStep2Body:
      "Svaki od 1000 prolaza varira cenu leada, konverziju i odliv u realističkim opsezima, zatim ide mesec po mesec kroz 12 meseci.",
    monteCarloStep3Title: "Kapacitet je tvrda granica",
    monteCarloStep3Body:
      "Fiksni tim može da opsluži ograničen broj klijenata. Kada tražnja premašuje kapacitet, preopterećenje diže odliv i stiskuje profit.",
    monteCarloStep4Title: "Vidite opsege, ne jednu pretpostavku",
    monteCarloStep4Body:
      "UI prikazuje percentilne opsege, komponente rizika, zdravlje čvorova i uvide običnim jezikom. Browser nikada ne izmišlja zamenske brojke ako veza padne.",
    challengesHeading: "Tehnički izazovi",
    challengesIntro:
      "Najteže nije bio 3D sjaj. Najteži su bili poverenje, latencija i da svaka brojka ostane poštena i kad nešto pukne.",
    challenge1Title: "Cold start na besplatnom compute-u",
    challenge1Body:
      "Render Free može da zaspi. Boot ekran pinguje health, pokazuje stvarnu telemetriju buđenja i otključava UĐI U AURU tek kad engine odgovori.",
    challenge2Title: "Tajne ostaju na serveru",
    challenge2Body:
      "Browser nikada ne sazna Render URL ni deljenu tajnu. Route handleri validiraju Zod-om, dodaju ključ i vraćaju generičke greške pri padu.",
    challenge3Title: "Matematika nikad ne ide u browser",
    challenge3Body:
      "Kad veza padne, scena zadržava poslednji Python rezultat označen kao zastareo. Klijentska zamenska aritmetika nije dozvoljena.",
    challenge4Title: "Strogi CSP i same-origin ograda",
    challenge4Body:
      "CSP sa nonce vrednostima, BotID na simulate i Origin provere sprečavaju da javni demo postane otvoreni proxy ka engine-u.",
    linksHeading: "Linkovi",
    githubCta: "Pogledaj GitHub profil",
    repoCta: "Pogledaj izvorni kod na GitHub-u",
    contactHeading: "Radite sa Fluxis Labs",
    contactBody:
      "Aura Workspace je vodeći portfolio eksponat Fluxis Labs-a - prostorna simulacija, WebGL zanat i produkcijski ozbiljna bezbednost u jednom demou.",
    contactCta: "Posetite Fluxis Labs",
    contactCtaGithub: "Kontakt preko GitHub-a",
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
export const LOCALE_COOKIE_KEY = "aura.locale";

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
