# Qamar

> Offline-first Quran memorization (hifz) app designed for ADHD learners.

**Name**: **Qamar** (قمر — "the moon"). Lives only in `app.json` and a single i18n string per SPEC §1.

## What this is

An offline-first mobile app that helps people with ADHD memorize the Quran by making progress visible, sessions short, states simple, and revision automatic. Full Quran text bundled offline; per-verse memorization tracking; chunk-based revision scheduler; French translation; per-ayah audio (stream + cache).

See [SPEC.md](SPEC.md) — the single source of truth for what, why, and how.

## Status

**In development.** Content pipeline, `hifz-core` engine, reading view, notes, audio, and the assisted-planning layer are implemented. Dashboard, onboarding, and the notes browser are still stubs. See SPEC §25 for phases and §26 for the v1.0 checklist.

## Stack

Expo (React Native) · TypeScript · Expo Router · NativeWind · Zustand · expo-sqlite · expo-av · FlashList. See SPEC §6.

**Targets**: iOS · Android · **Web** (v1 ships web with feature parity minus audio playback — see SPEC §4, §6, §12.5).

## Development

```bash
npm install
npm run start
```

Requires Node 20+. `.npmrc` sets `legacy-peer-deps` — a transitive `react-dom`
peer range conflicts with React 19.

## Web (PWA)

The web target builds to an installable, offline-capable PWA and deploys to
Cloudflare Pages.

```bash
npm run build:web
npm run serve:web
```

Deployment, the hand-rolled service worker, and the `public/index.html`
substitution rules are documented in [docs/deploy-web.md](docs/deploy-web.md).

## License

- **Code**: MIT — see [LICENSE](LICENSE).
- **Content** (Quran text editions, translations, tajweed data, audio, fonts): third-party datasets under their own licenses. See [LICENSE-CONTENT](LICENSE-CONTENT).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Conventional commits. Every UI PR must state ADHD-doctrine compliance (SPEC §15).
