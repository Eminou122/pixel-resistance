# PIXEL RESISTANCE — Security audit and public-release readiness

| | |
| --- | --- |
| Repository | `Eminou122/pixel-resistance` (private at the time of the audit) |
| Production | https://pixel-resistance.vercel.app |
| Audited commit | `b6cb6eb` (`main`, identical to `origin/main`) |
| Audit date | 27 November 2026 |
| Final status | **PASS WITH WARNINGS** |

## 1. Executive summary

No credential, private key, token or connection string was found anywhere in the Git history, the GitHub repository settings or the Vercel project. The game is a static single-page app with no backend, no account and no network call of its own: the only data is the player's save, kept in their own browser.

One medium finding was fixed: the site sent no browser security headers. They are now set in `vercel.json`, tested locally against a full play-through, and **take effect only after the next deployment**. A stale code comment was also corrected. The remaining warnings are low-severity privacy and hardening items. Nothing blocks making the repository public.

## 2. Repository inspection

| Check | Result |
| --- | --- |
| Branches | `main` only, local and remote (`git ls-remote` matches local refs) |
| Tags, stashes, releases | None |
| Submodules, Git LFS, `.gitattributes` | None |
| Commits reachable from all refs | 3 |
| Files that ever existed in history | 42 paths, 48 blobs |
| Unreachable objects | None |
| GitHub Actions workflows, Actions secrets | None |
| Deploy keys, webhooks | None |
| Collaborators | Owner only |
| Pull requests, issues | None |
| Branch protection | Not available on a free private repository (GitHub returns 403); available once public |

## 3. Git history scan

**Method.** Gitleaks and TruffleHog are not installed on this machine, and downloading a scanner was not authorised, so a local scanner was written for this audit. No repository content was sent to an external service. It reads every blob reachable from every ref, every unreachable blob and every commit message, and applies these rules:

private keys, AWS keys, GitHub and GitLab tokens, Google API keys, Slack, Stripe, OpenAI/Anthropic and npm tokens, JWTs, Vercel token variables, database connection strings, Firebase configuration and service accounts, Supabase URLs, generic `password/secret/api_key/token = "…"` assignments, local machine paths, e-mail addresses and private-network URLs. It also flags sensitive file names (`.env*`, `.npmrc`, `*.pem`, `*.key`, SSH keys, `credentials*.json`, `.vercel/`, Firebase rules).

**Scanner self-test.** A throw-away repository containing a fake AWS key, a fake GitHub token, a private-key header and a hard-coded API key in a `.env` file that was then deleted: all four were detected, and `.env` was reported as a file present in history.

**Results.**

| Scope | Findings |
| --- | --- |
| Sensitive file names in history | None |
| Secrets in blobs or commit messages | None |
| Local paths, e-mail addresses in files | None |
| `localhost` URLs | `README.md` (development instructions, intended) |

**Limits.** The scanner is pattern-based, with no entropy analysis. Given that the project uses no environment variable and calls no API, the risk of a missed secret is low; a Gitleaks run before publication would remove it (see section 12).

## 4. Credential exposure

No credential is exposed. Nothing requires revocation, rotation or history rewriting.

## 5. Environment and configuration

| Check | Result |
| --- | --- |
| `.env.local` | Exists locally and contains one variable, `VERCEL_OIDC_TOKEN` (created by `vercel link`; short-lived OIDC token). Ignored by `.gitignore` (`*.local`) and never committed. Value not read |
| `.gitignore` | Covers `.env`, `.env.*`, `*.local`, `*.pem`, `*.key`, `.vercel`, `dist`, `node_modules` |
| `.vercel/project.json` | Local only, ignored, never committed |
| Vercel environment variables | None defined (`vercel env ls`) |
| Environment variables in code | None |
| Firebase or any backend | None |
| Source maps | Not generated; requesting a `.map` file in production returns 403 |
| GitHub Actions / deployment scripts | None; Vercel's Git integration builds `npm run build` |
| HTTPS | HTTP redirects to HTTPS (308); HSTS sent by Vercel |
| Local Git identity | This repository's local `user.email` was set to the address linked to the Vercel account, so that pushes are not blocked by Vercel (the same setting NIRD WORLD already uses) |

## 6. Application security

| Area | Result |
| --- | --- |
| XSS / unsafe HTML | No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `iframe` or dynamic `href`. All text is rendered by React, which escapes it |
| i18next `escapeValue: false` | Safe here: translations are static strings rendered as React text, and the only interpolated values are numbers |
| Save integrity | The save in `localStorage` is never trusted: on load, `sanitize()` keeps only known mission ids with the right number of answers, recomputes every score from the answers, filters unknown enemies, modules, places, villagers and achievements, and caps coins spent at coins earned. **Tested:** a save containing invalid JSON loads as a new game, with no crash |
| Language preference | Only `en` is accepted, anything else falls back to French. **Tested** with an HTML payload as the stored value |
| URL input | `/missions/:id` is looked up in the mission list; unknown or still-locked missions show a message. The workshop's `#hash` must match a known module id before it is used |
| Scoring | Rewards are derived from best scores, so replays cannot farm XP or coins (covered by `src/game/game.test.ts`). A player can still edit their own save to claim any result: this is accepted, because there is no server, leaderboard or prize, so it only affects their own browser |
| External resources | Google Fonts only. Sounds are generated with the Web Audio API, pixel art is inline SVG; no third-party script |
| External links | One plain link to https://nird-world.vercel.app (same tab) |
| Authentication, admin features, CORS, redirects | None exist. `Access-Control-Allow-Origin: *` is Vercel's default for static files and exposes nothing not already public |

## 7. Dependencies

| Check | Result |
| --- | --- |
| Package manager | npm 11.6.2 (Node 24.11.1), `package-lock.json` v3 |
| Direct dependencies | 8 runtime (`react`, `react-dom`, `react-router`, `motion`, `lucide-react`, `zustand`, `i18next`, `react-i18next`), 7 build-time |
| `npm audit` (all) | **0 vulnerabilities** |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit signatures` | 102 packages with verified registry signatures, 59 with verified attestations, none invalid |
| Install scripts | `esbuild`, `fsevents` (expected, build tools only) |
| Licences of the runtime tree | MIT (16), ISC (1), 0BSD (1), Apache-2.0 (1: `typescript`, a peer dependency of `react-i18next` used at build time): all compatible with MIT |
| Outdated, same major | None |
| Outdated, new major (not recommended now) | `vite` 8, `@vitejs/plugin-react` 6, `motion` 14, `react-router` 8, `typescript` 7 |
| Abandoned packages | None |

No dependency was changed in this audit.

## 8. Licence and documentation

| Check | Result |
| --- | --- |
| `LICENSE` | MIT, "Copyright (c) 2025 PIXEL RESISTANCE contributors" |
| `README.md` | Present: screens and routes, progression rules, code layout, `npm install`, `npm run dev`, `typecheck`, `test`, `build`, `preview`, Node ≥ 22, Vercel output; commands verified in this audit |
| Third-party attribution | Press Start 2P, VT323, Instrument Sans (SIL OFL 1.1), Lucide (ISC); pixel art and sounds are original and generated in code |
| Personal information in files | None |

## 9. Remediation performed (not committed, not deployed)

| Finding | Change |
| --- | --- |
| M-1 Missing security headers | `vercel.json` now sends, on every route: `Content-Security-Policy` (`default-src 'self'`, scripts from the site only, styles and fonts from the site and Google Fonts only, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment, USB off), `Cross-Origin-Opener-Policy: same-origin` |
| Documentation | `src/i18n.ts`: a comment still described the game as part of the NIRD WORLD site; corrected |

**How the CSP was tested.** The production build was served locally with exactly these headers and the SPA rewrite, then played: new game, mission 1 through to its result screen (confetti and sound), an enemy file dialog and the village map. No CSP violation, no console error; Press Start 2P, VT323 and Instrument Sans all loaded.

## 10. Tests and build

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` (game rules: FR/EN parity, anti-farming, unlock order, corrupted saves) | 7 / 7 pass |
| `npm run build` | Pass |
| axe-core (WCAG 2.2 AA) on every screen in production | 0 violations (after the fixes deployed earlier the same day) |

## 11. Findings and remaining risks

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| M-1 | Medium | No CSP, clickjacking or MIME-sniffing protection headers | Fixed in `vercel.json`; **needs a deployment** |
| L-1 | Low | Commit metadata contains two author e-mail addresses (a personal and an institutional one). They become visible once the repository is public | Accepted. Rewriting history is not recommended; the GitHub "noreply" address can be used for future commits |
| L-2 | Low | Google Fonts is loaded from Google's servers, which receive each visitor's IP address | Open. Self-hosting the three fonts would remove it |
| L-3 | Low | No secret scanning, push protection, Dependabot alerts or rule on `main` (not available for free private repositories) | To enable after publication (section 12) |
| L-4 | Low | Saves can be edited by the player | Accepted by design (no server or leaderboard); the sanitizer prevents crashes and impossible states |
| I-1 | Info | Secret scan is pattern-based, not Gitleaks | Optional Gitleaks run before publication |
| I-2 | Info | React Router logs a "No HydrateFallback element" warning on first load | Harmless; not a security issue |
| I-3 | Info | Two blocked deployments from earlier today remain in the Vercel deployment list | Harmless; can be deleted from the Vercel dashboard |

## 12. Public-release readiness

**Status: PASS WITH WARNINGS.** No secret has ever been committed and there is no critical or high finding. Before or right after making the repository public:

1. Commit and push the `vercel.json` and `src/i18n.ts` changes, then check the headers at https://pixel-resistance.vercel.app (`curl -I`).
2. Optional: run Gitleaks once on the full history (`gitleaks git .`, or `gitleaks detect` on versions before 8.19) as a second opinion.
3. Change the visibility (repository owner only).
4. Then enable, under *Settings → Code security*: secret scanning, push protection and Dependabot alerts; and add a ruleset on `main` that blocks force-pushes and deletion.
