# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server
ng serve

# Production build
ng build --configuration production

# Watch mode (development)
ng build --watch --configuration development

# Run unit tests
ng test

# Run a single test file
ng test --include='**/auth.service.spec.ts'

# Serve built output
npm start   # runs: serve -s dist/dental
```

Requires **Node ≥ 22** (`engines` in `package.json`).

## Architecture Overview

**DentiPro** is an Angular 19 dental clinic directory/marketplace for Romania. It connects patients with dental clinics.

### Tech Stack

- **Angular 19** with standalone components (no NgModules) and lazy-loaded routes via `loadComponent()`
- **PrimeNG 19** + **Angular Material 19** for UI components
- **Supabase** for auth/database (though most logic hits a custom REST API)
- **Backend API**: `const API = '/api'` — relative URL in every component/service. In dev, `proxy.conf.json` forwards `/api` to `https://www.dentipro.ro`; in prod the Express backend serves both API and the Angular `public/browser/` build from the same origin.
- **MapLibre GL** + **Google Maps** for interactive clinic maps
- **PostHog** for product analytics (`AnalyticsService` — key must be set in `analytics.service.ts`)
- **Stripe** for subscription payments (checkout, webhook, billing portal)
- **vanilla-cookieconsent** for GDPR cookie banner (initialized in `AppComponent.ngAfterViewInit`)

### Two "Sides" of the App

The app serves two distinct user types, detected via URL:

1. **Patient-facing site** — home, search/finder, clinic profiles, appointments, feed, favorites
2. **Clinic portal** — routes under `/clinici/*` — registration, dashboard, service management

`AppComponent` tracks `isClinicPortal` by subscribing to router events and checking `urlAfterRedirects.startsWith('/clinici')`. This switches the top navbar (`NavbarComponent` vs `ClinicNavbarComponent`) and hides the left sidebar and footer.

> **Naming note**: two separate directories serve the `/clinici` URL space:
> - `src/app/clinici/` — legacy; the `/clinici` route now loads `ClinicLandingComponent` from `clinic-portal/clinic-landing/`
> - `src/app/clinic-portal/` — contains `clinic-auth/`, `clinic-landing/`, `clinic-navbar/`; used by all `/clinici/*` routes (auth, dashboard, etc.)

`SupportWidgetComponent` is a global floating chat widget rendered in `AppComponent` on every page. It has two modes:
- **Bot mode** (default): AI-powered via `POST /api/support/bot`; shows quick-suggestion chips; after 3 interactions an escalation button appears.
- **Human mode**: for logged-in clinics it shows message history; for guests it collects an email then submits to `POST /api/support/message`.

Modes: `'bot' | 'human' | 'human-form' | 'human-sent'`.

### Authentication

`src/app/auth.service.ts` — JWT-based auth with three roles: `clinic`, `patient`, `admin`.

- Tokens stored in `localStorage` under keys `denti_auth` (user object) and `denti_token` (JWT)
- `BehaviorSubject<AuthUser | null>` drives reactive user state app-wide via `auth.user$`
- Session restored synchronously on startup from `localStorage`, then validated in background via `GET /auth/me`
- Client-side JWT expiry check runs before restoring session (`isTokenExpired` decodes the payload)
- Email verification flow: register → get code by email → `POST /auth/verify-email`
- Minimum password length: 6 characters (validated client-side in `validateRegister()`)

Auth guards are not separate files — components redirect themselves in `ngOnInit` (e.g., `ClinicDashboardComponent` checks `auth.isClinic` and redirects to `/clinici` if false).

One exception: `src/app/guards/pricing.guard.ts` — `pricingGuard` exists but is **not currently applied** to any route (pricing page is active). If you need to hide it again, add `canActivate: [pricingGuard]` to the `/clinici/pricing` route in `app.routes.ts`.

### Key Services

| Service | File | Purpose |
|---|---|---|
| `AuthService` | `auth.service.ts` | JWT auth, session management, all `/auth/*` endpoints |
| `ClinicDataService` | `clinic-data.service.ts` | Clinic CRUD; `loadPage()` for paginated cards/finder, `loadClinicsAuto()` for map |
| `SeoService` | `seo.service.ts` | Meta tags, Open Graph, JSON-LD structured data per page |
| `SubscriptionService` | `subscription.service.ts` | Subscription tiers: `starter`, `growth`, `pro`; source of truth for plan/status — call this, don't hit `GET /stripe/subscription` directly |
| `AnalyticsService` | `analytics.service.ts` | PostHog wrapper; UTM attribution, identity, funnel events |
| `DataShareService` | `data-share.service.ts` | Cross-component state: `city$`, `service$`, `maxPrice$`, `filters$`, `bounds$` (map bounds for finder↔map sync) |
| `FavoritesService` | `favorites.service.ts` | Patient favorites (persisted in localStorage or API) |
| `RoCitiesService` | `ro-cities.service.ts` | Hardcoded list of Romanian cities for dropdowns |
| `ServiciiService` | `servicii.service.ts` | Canonical list of 26 dental service types (id + Romanian label) — single source of truth, don't duplicate |
| `ConfigService` | `config.service.ts` | Fetches MapTiler + Google Maps API keys at runtime from `GET /api/config/maps`; no Angular environment files exist |
| `ToastService` | `toast.service.ts` | Global toast notifications (`src/app/toast/`); use `show(message, type)` |

**Notifications** are not a separate service — `ClinicNavbarComponent` polls `GET /notifications/unread-count` every 30 s and fetches `GET /notifications` on bell open; `PATCH /notifications/read-all` on read. No `NotificationsService` exists.

`HttpErrorInterceptor` (`src/app/http-error.interceptor.ts`) handles 401/403/5xx globally and shows toasts automatically — don't add `error: () => {}` handlers in components for these cases. Auth endpoints, `/feedback/`, `/feed/`, and `/support/message` are in `SILENT_PATTERNS` and bypass the global toast (those components handle errors inline). Add new endpoints to `SILENT_PATTERNS` if the component shows its own error UI.

### Routing

Routes defined in `src/app/app.routes.ts`. All routes use `loadComponent()` for lazy loading.

Key routes:
- `/` — `HomeNdComponent` (patient landing)
- `/finder` — paginated clinic search with city/service filters
- `/clinic-profile/:id` — public clinic profile
- `/descripton/:id` — `DescriptonPageComponent` (note: typo in route name is intentional/legacy)
- `/harta` — full-screen MapLibre map
- `/feed` — patient request feed (clinics respond with offers; Growth 10/month, Pro unlimited)
- `/favorites`, `/appointments`, `/profile` — patient account pages
- `/inregistrare` — patient registration with email verification
- `/recenzie` — `ReviewPageComponent`
- `/preturi` — dental price reference table (SEO page)
- `/pentru-clinici` — clinic marketing/lead-capture landing
- `/contact` — contact form (`POST /api/support/message`)
- `/dentisti`, `/dentisti/:serviciu`, `/dentisti/:serviciu/:oras` — SEO listing pages
- `/dentisti/bucuresti`, `/dentisti/cluj-napoca`, `/dentisti/timisoara`, `/dentisti/iasi`, `/dentisti/brasov` — city SEO pages (`CitySeoComponent`); declared before `/:serviciu` to take priority
- `/services` — service types overview page
- `/GDPR`, `/termeni`, `/cookie-uri`, `/rambursare`, `/drepturile-tale-gdpr`, `/disclaimer-medical`, `/legal` — legal pages
- `/calendar` — calendar page
- `/notificari` — full notifications page (`NotificariComponent`)
- `/clinici` — clinic landing/marketing page (`ClinicLandingComponent`)
- `/clinici/autentificare` — clinic login/register (`ClinicAuthComponent`)
- `/clinici/inscriere` — multi-step clinic registration form (7 steps, step 6 = plan selection)
- `/clinici/parteneriat` — partnership/affiliate program page (`ParteneriatComponent`)
- `/clinici/dashboard` — clinic management dashboard (requires `isClinic` + `clinicId`)
- `/clinici/profil` — clinic's own public profile preview
- `/clinici/contact` — contact form (clinic portal variant)
- `/clinici/pricing` — pricing page
- `/administrator` — admin panel (requires `isAdmin`)
- `/viewer`, `/sidebar` — dev/debug routes (not linked in UI)
- Legacy redirects: `/Inscriere` → `/clinici/inscriere`, `/pricing` → `/preturi`, `/parteneriat` → `/clinici/parteneriat`
- `**` — `NotFoundComponent`

### Clinic Registration & Stripe Flow

`FormComponent` (`/clinici/inscriere`) has 7 steps. Step 6 selects a plan using `PlanCardComponent` from `src/app/pricing/plan-card/`. Plan definitions live in `src/app/pricing/plan.model.ts` — single source of truth used by both `PricingComponent` and `FormComponent`.

- **Starter**: submit → `POST /api/clinics` → overlay success, status `pending`
- **Growth/Pro**: submit → `POST /api/clinics` returns `checkoutUrl` → redirect to Stripe Checkout → webhook `checkout.session.completed` sets status `active`
- Cancel URL: `/clinici/inscriere?checkout=canceled` — form detects param, shows amber banner, jumps to step 6

Existing clinics can upgrade via `PUT /api/clinics/:id` which also returns `checkoutUrl` if no active subscription.

Backend Stripe env vars required:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH_MONTHLY=price_xxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
```

### Clinic Dashboard

`ClinicDashboardComponent` loads all data from `GET /api/clinic-dashboard` and handles:
- Appointment status management (`PATCH /appointments/:id/status`)
- Subscription card: current plan, status, renewal date; "Gestionează" → Stripe Billing Portal; "Upgrade" → `/clinici/pricing`
- Profile completion score (based on name, email, phone, city, address, logo, images, services)
- Profile view chart: bar chart (CSS-only), 30-day daily data from `dp_clinic_profile_views` via `generate_series`
- Before/after gallery: upload to Cloudinary, preview, caption, delete
- Stock/inventory management: CRUD for `dp_clinic_stock` items (name, qty, unit, minQty, expiresAt) via `GET/POST/PATCH/DELETE /api/clinics/:id/stock`
- Promotions badge: active promotion count from API
- Feedback popup: appears after 50s, state in `localStorage` (`dp_feedback_<userId>`); also checks `GET /feedback/clinic/check`
- Toast on return from Stripe checkout (`?checkout=success` query param)

### Admin Panel

`AdminComponent` at `/administrator` requires `isAdmin`. Capabilities:
- List/filter/search clinics with pagination (25 per page)
- Set clinic status (`active`/`pending`/`suspended`)
- Add single clinic or batch test clinics
- Onboard clinics (create accounts + send welcome emails)
- View/reply to submitted feedback and support messages

### Styling

Global CSS variables define the design system in `src/styles.css`. Key theme values:
- Dark deep-blue background: `--bg-deep: #020b18`
- Primary gradient: blue-to-cyan (`--gradient-primary`)
- Material theme: Azure Blue
- CSS budget in `angular.json`: `anyComponentStyle` 200kB warning / 300kB error (raised for maplibre-gl.css)

### Language

All UI text is in **Romanian** (`ro_RO`). Keep new UI strings in Romanian.

### Key DB Tables (backend)

| Table | Purpose |
|---|---|
| `dp_clinics` | Clinics; includes `working_hours` JSONB, Stripe fields (`stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, `current_period_end`, `trial_ends_at`) |
| `dp_reviews` | Patient reviews; indexed on `clinic_id` |
| `dp_notifications` | Clinic in-site notifications (bell badge) |
| `dp_promotions` | Clinic promotions; emailed to patients who favorited the clinic |
| `dp_clinic_profile_views` | Per-day view counts for profile analytics |
| `dp_clinic_stock` | Clinic stock/inventory items; CRUD via `GET/POST/PATCH/DELETE /api/clinics/:id/stock` |

### Shared Layout Components

- **`LeftSidebarComponent`** — patient-facing sidebar; hidden for clinic portal (`AppComponent` controls visibility). Collapses to icon-only on `window.innerWidth < 768`.
- **`FilterNavComponent`** — city/service/price filter bar embedded in `FinderComponent`. Reads/writes state exclusively via `DataShareService` signals; do not add direct HTTP calls here.
- **`SupportWidgetComponent`** — global floating chat; rendered in `AppComponent` on every page.

### localStorage Keys Reference

| Key | Owner | Purpose |
|---|---|---|
| `denti_auth` | `AuthService` | Serialized `AuthUser` object |
| `denti_token` | `AuthService` | Raw JWT string |
| `dp_offc_<clinicId>_<YYYY-MM>` | `SubscriptionService` | Monthly offer count (Growth cap) |
| `dp_attribution` | `AnalyticsService` | UTM + referrer attribution (written once per session) |
| `dp_feedback_<userId>` | `ClinicDashboardComponent` | Feedback popup state (`'submitted'` / `'done'` / `'skip1'`) |
| `dp_comp_banner_<clinicId>` | `ClinicDashboardComponent` | Profile completion banner last-dismissed date |

### Utilities

`src/app/utils/text.utils.ts` — `getInitials(name: string): string` (extracts up to 2 initials from a full name). The only shared utility; import from here rather than re-implementing inline.

### Architecture Rules

- `SubscriptionService` is the source of truth for plan/status — don't make direct `GET /stripe/subscription` calls in components. `load()` caches per session; call `reset()` after a plan upgrade, then `load(true)` to refresh.
- Growth monthly offer count is tracked **client-side** in localStorage (`dp_offc_<clinicId>_<YYYY-MM>`). Call `subscriptionService.incrementOfferCount()` after each offer is sent. Pro plan is not capped.
- All HTTP errors go through `HttpErrorInterceptor` — don't add `error: () => {}` handlers in components for 401/403/5xx
- `ServiciiService` is the source of truth for service types — don't duplicate the list
- Plan badge/ranking logic: Growth → "Promovat" (blue badge), Pro → "★ VIP" (gold badge); results ranked Pro first then Growth client-side via `PLAN_RANK` in `ClinicDataService`
- `ConfigService.load()` runs as an `APP_INITIALIZER` — it blocks Angular bootstrap until map API keys are fetched. Don't move map key fetching elsewhere.
- Dead code — do not wire these to routes or refactor until explicitly requested: `src/app/description/`, `src/app/orase/`, `src/app/home/` (replaced by `home-nd/`), `src/app/search-board/` (replaced by `search-board-nd/` inside `home-nd/`), `src/app/map.service.ts` (body is entirely commented out), `src/app/disclaimer/`, `src/app/google-maps/`, `src/app/header/`, `src/app/map-test/` (none have active routes).

---

## Roadmap

### 🔧 Următor (necesită feature nou sau resurse externe)
- Video upload în galerie (promis în plan dar neimplementat)
- Notificări pacienți 20km (promis Growth/Pro — necesită geolocation + push backend)
- Acces API (Pro) — marcat `în curând` în `plan.model.ts`

### ❌ Neînceput (impact mare)
- Calendar disponibilitate clinici (sloturi libere)
- Widget embeddable "Programează acum" pentru site-uri externe
- Rapoarte lunare automate per clinică
- Pagini SEO per oraș — parțial implementat (București, Cluj-Napoca, Timișoara, Iași, Brașov via `CitySeoComponent`); alte orașe neadăugate
- Comparare clinici side-by-side

### Permisiuni pentru Claude Code

**Idei proprii:** Ai permisiunea explicită de a introduce funcționalități sau îmbunătățiri neprecizate explicit, dacă le consideri valoroase pentru proiect. Condiție obligatorie: documentează fiecare idee în `ideas.md` (ce ai implementat, de ce, unde în cod) pentru ca directorul să poată revizui și decide ce rămâne.

Excepție: modificările breaking sau cu impact mare pe UX (restructurare majoră de route-uri, schimbare de brand, ștergeri de date) necesită aprobare explicită înainte de implementare.

### Flux Deploy pe Render

Există UN singur serviciu pe Render — backend-ul Express (`Alec2173/dental-backend`) care servește **și** API-ul **și** frontend-ul Angular din `public/browser/`.

**Pași obligatorii la fiecare deploy:**

1. Build frontend: `ng build --configuration production` (în DentiProMain)
2. Copiez build în backend: `rm -rf ../DentiPro-backend/public/browser && cp -r dist/dental/browser ../DentiPro-backend/public/`
3. Commit backend: `cd ../DentiPro-backend && git add -A && git commit -m "feat: ..."`
4. Push backend: `git push origin main` → repo: `Alec2173/dental-backend`
5. Pe [render.com](https://render.com) → serviciul backend → **Manual Deploy → Deploy latest commit**

> **Dacă pe Render apare un commit vechi** = backend-ul nu a fost pushat. Repo-ul frontend (`Alec2173/DentiProMain`) nu se deployează pe Render, e doar pentru backup/colaborare.

### Rollback Point

Last known stable state with full Stripe + all features:

```bash
# Frontend
git checkout 14d9528
# Backend (DentiPro-backend repo)
git checkout 4404eea
```
