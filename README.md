# Eco Chromium Browser (MVP)

To je začetna implementacija lahkega namiznega brskalnika na osnovi **Chromiuma** preko **Electron**.

## Kaj podpira

- Navigacija (nazaj, naprej, osveži, URL/iskanje).
- Chromium rendering preko `webview`.
- Enostaven "password manager":
  - shranjevanje gesel,
  - brisanje,
  - uvoz iz JSON/CSV,
  - izvoz v JSON.
- Enostaven "Eco način" (varčevanje):
  - mute audio ko je izklopljen,
  - app-level energy toggle preko Electron `powerSaveBlocker`.

## Zagon

```bash
npm install
npm start
```

## Opomba

To je **MVP** in ne popolna zamenjava Google Chrome. Za "Chrome-level" funkcionalnosti (sinhronizacija accounta, extension ecosystem, sandbox hardening, anti-phishing, full autofill engine, multi-process policy tuning, SafeBrowsing, enterprise policy, crash reporting, update channels) je potreben bistveno večji razvojni obseg.
