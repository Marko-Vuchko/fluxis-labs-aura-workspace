# Vercel WAF - pripremljena pravila (ne objavljivati iz agenta)

Ovaj fajl je runbook za **vlasnika naloga**. Agent ne sme da pokrene `vercel firewall publish` niti Attack Challenge Mode.

Preduslov: projekat je povezan (`vercel link`) i CLI je ulogovan na nalog koji poseduje Aura Workspace.

Svako novo pravilo se prvo dodaje sa `--action log`. Publish radi vlasnik, posle pregleda saobraćaja.

## 1. Rate limit na `/api` po IP-u

Prvo samo log (ne blokira nikoga):

```bash
vercel firewall rules add "Rate limit /api by IP" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --action log \
  --yes
```

Posle pregleda logova, zameniti akciju pravim rate limitom. Prozor od 60 s i 60 zahteva po IP-u je startna vrednost (Render i engine i dalje imaju sopstveni cap). `--rate-limit-action log` i dalje ne kaznjava klijenta; prebaci na `rate_limit` tek kada dashboard pokaze da pogađa samo zloupotrebu.

```bash
vercel firewall rules edit "Rate limit /api by IP" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 60 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes
```

Kada je log čist, zategni kaznu:

```bash
vercel firewall rules edit "Rate limit /api by IP" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 60 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes
```

## 2. Blokada exploit sondi

```bash
vercel firewall rules add "Block exploit probes" \
  --condition '{"type":"path","op":"inc","value":["/wp-admin","/.env","/.git/config","/phpmyadmin"]}' \
  --action log \
  --yes
```

Posle pregleda, deny samo u preview okruzenju:

```bash
vercel firewall rules edit "Block exploit probes" \
  --action deny \
  --condition '{"type":"path","op":"inc","value":["/wp-admin","/.env","/.git/config","/phpmyadmin"]}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --yes
```

Kada preview potvrdi da pravi korisnici nisu pogođeni, deny u produkciji:

```bash
vercel firewall rules edit "Block exploit probes" \
  --action deny \
  --condition '{"type":"path","op":"inc","value":["/wp-admin","/.env","/.git/config","/phpmyadmin"]}' \
  --yes
```

## 3. Odbijanje metoda koje aplikacija ne koristi

Aplikacija koristi `GET`, `HEAD` i `POST`. Ostalo (PUT, PATCH, DELETE, TRACE, CONNECT, ...) se prvo loguje:

```bash
vercel firewall rules add "Reject unused HTTP methods" \
  --condition '{"type":"method","op":"ninc","value":["GET","HEAD","POST"]}' \
  --action log \
  --yes
```

Isti postupni rollout kao gore: deny u preview, zatim deny u produkciji.

```bash
vercel firewall rules edit "Reject unused HTTP methods" \
  --action deny \
  --condition '{"type":"method","op":"ninc","value":["GET","HEAD","POST"]}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --yes
```

```bash
vercel firewall rules edit "Reject unused HTTP methods" \
  --action deny \
  --condition '{"type":"method","op":"ninc","value":["GET","HEAD","POST"]}' \
  --yes
```

## Redosled publish-ovanja

Pravila se **stage-uju** kao draft. Nista nije zivo dok vlasnik ne objavi.

1. Dodaj sva tri pravila sa `--action log`.
2. Pregledaj draft: `vercel firewall diff`
3. Objavi log fazu: `vercel firewall publish --yes` (samo vlasnik)
4. Gledaj pogotke u dashboardu: `https://vercel.com/<team>/<project>/firewall/traffic?filter=<ruleId>`
5. Tek onda menjaj akciju (preview deny, pa produkcija) i ponovo `publish`.
6. Ako draft nije dobar: `vercel firewall discard --yes`

Agent ne pokreće korake 3-6.

## Runbook: Attack Challenge Mode

Vercel ovo zove **Attack Mode**. Neprovereni posetioci dobijaju challenge stranicu. Verifikovani botovi i search crawler-i su izuzeti. Uključivanje je **odmah** (nije draft) i CLI zahteva interaktivnu potvrdu, zato to radi isključivo vlasnik naloga.

### Kada uključiti

- Nagli skok 5xx / timeout-ova na `/api/simulate`
- Firewall logovi pokazuju masovne probe ili flood sa mnogo IP-ova
- Render health check ili Vercel funkcije padaju pod opterećenjem koje DDoS sloj još nije ućutkao

### Kako uključiti (vlasnik)

```bash
vercel firewall attack-mode enable --duration 1h --yes
```

Dužine koje CLI prihvata: `1h` (podrazumevano), `6h`, `24h`. Počni sa `1h`.

### Šta raditi dok je uključen

1. Potvrdi u `vercel firewall overview` da je Attack Mode aktivan.
2. Otvori Firewall traffic view i proveri da pravi korisnici mogu da prođu challenge.
3. Ne isključuj platform DDoS mitigations (`vercel firewall system-mitigations pause` je zabranjen osim ako debuguješ false positive, i tada ga odmah vrati).
4. Ako napad traje, produži novim `enable --duration 6h` pre isteka.

### Kako isključiti

```bash
vercel firewall attack-mode disable --yes
```

Isključi čim saobraćaj padne na uobičajen nivo. Attack Mode nije zamena za stalna WAF pravila iz ovog dokumenta.

### Rollback stalnih pravila

Ako custom pravilo pogodi prave korisnike:

```bash
vercel firewall rules edit "Ime pravila" --action log --yes
vercel firewall publish --yes
```

Hitnije: `vercel firewall rules disable "Ime pravila"` pa `publish`.
