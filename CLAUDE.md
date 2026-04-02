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

## Architecture Overview

**DentiPro** is an Angular 19 dental clinic directory/marketplace for Romania. It connects patients with dental clinics.

### Tech Stack

- **Angular 19** with standalone components (no NgModules) and lazy-loaded routes via `loadComponent()`
- **PrimeNG 19** + **Angular Material 19** for UI components
- **Supabase** for auth/database (though most logic hits a custom REST API)
- **Backend API**: `https://www.dentipro.ro/api` — hardcoded as `const API` in each component/service that needs it
- **MapLibre GL** + **Google Maps** for interactive clinic maps
- **vanilla-cookieconsent** for GDPR cookie banner (initialized in `AppComponent.ngAfterViewInit`)

### Two "Sides" of the App

The app serves two distinct user types, detected via URL:

1. **Patient-facing site** — home, search/finder, clinic profiles, appointments, feed, favorites
2. **Clinic portal** — routes under `/clinici/*` — registration, dashboard, service management

`AppComponent` tracks `isClinicPortal` by subscribing to router events and checking `urlAfterRedirects.startsWith('/clinici')`. This switches the top navbar (`NavbarComponent` vs `ClinicNavbarComponent`) and hides the left sidebar.

`SupportWidgetComponent` is a global floating chat widget rendered in `AppComponent` on every page. For logged-in clinics it shows message history; for guests it requires an email.

### Authentication

`src/app/auth.service.ts` — JWT-based auth with three roles: `clinic`, `patient`, `admin`.

- Tokens stored in `localStorage` under keys `denti_auth` (user object) and `denti_token` (JWT)
- `BehaviorSubject<AuthUser | null>` drives reactive user state app-wide via `auth.user$`
- Session restored synchronously on startup from `localStorage`, then validated in background via `GET /auth/me`
- Client-side JWT expiry check runs before restoring session (`isTokenExpired` decodes the payload)
- Email verification flow: register → get code by email → `POST /auth/verify-email`

Route guards in `src/app/guards/` — currently only `pricingGuard`, which redirects `/clinici/pricing` to home (pricing page is intentionally hidden until launch; see `HIDDEN_PRICING` comments in `app.routes.ts`).

Auth guards are not separate files — components redirect themselves in `ngOnInit` (e.g., `ClinicDashboardComponent` checks `auth.isClinic` and redirects to `/clinici` if false).

### Key Services

| Service | File | Purpose |
|---|---|---|
| `AuthService` | `auth.service.ts` | JWT auth, session management, all `/auth/*` endpoints |
| `ClinicDataService` | `clinic-data.service.ts` | Clinic CRUD; `loadPage()` for paginated cards/finder, `loadClinicsAuto()` for map |
| `SeoService` | `seo.service.ts` | Meta tags, Open Graph, JSON-LD structured data per page |
| `SubscriptionService` | `subscription.service.ts` | Subscription tiers: `starter`, `growth`, `pro` |
| `DataShareService` | `data-share.service.ts` | Minimal cross-component state sharing |
| `FavoritesService` | `favorites.service.ts` | Patient favorites (persisted in localStorage or API) |
| `RoCitiesService` | `ro-cities.service.ts` | Hardcoded list of Romanian cities for dropdowns |

### Routing

Routes defined in `src/app/app.routes.ts`. All routes use `loadComponent()` for lazy loading.

Key routes:
- `/` — `HomeNdComponent` (patient landing)
- `/finder` — paginated clinic search with city/service filters
- `/clinic-profile/:id` — public clinic profile
- `/harta` — full-screen MapLibre map
- `/clinici` — clinic landing/marketing page
- `/clinici/autentificare` — clinic login/register (`ClinicAuthComponent`)
- `/clinici/inscriere` — multi-step clinic registration form
- `/clinici/dashboard` — clinic management dashboard (requires `isClinic` + `clinicId`)
- `/administrator` — admin panel (requires `isAdmin`)
- `/clinici/pricing` — **hidden** (redirected to `/` by `pricingGuard` since 2026-03-20)

### Clinic Dashboard

`ClinicDashboardComponent` loads all data from `GET /api/clinic-dashboard` and handles:
- Appointment status management (`PATCH /appointments/:id/status`)
- Profile completion score (based on name, email, phone, city, address, logo, images, services)
- Feedback popup: appears after 50s, tracks state in `localStorage` (`dp_feedback_<userId>`); also checks backend `GET /feedback/clinic/check` to avoid re-showing on new devices

### Admin Panel

`AdminComponent` at `/administrator` requires `isAdmin`. Capabilities:
- List/filter/search clinics with pagination (25 per page)
- Set clinic status (`active`/`pending`/`suspended`)
- Add single clinic or batch test clinics
- Onboard clinics (create accounts + send welcome emails)
- Resend welcome emails, simulate clinic profiles
- View submitted feedback and support messages, reply to support messages

### Styling

Global CSS variables define the design system in `src/styles.css`. Key theme values:
- Dark deep-blue background: `--bg-deep: #020b18`
- Primary gradient: blue-to-cyan (`--gradient-primary`)
- Material theme: Azure Blue

### Predefined Data

26 dental service types are hardcoded in the codebase (implants, orthodontics, whitening, etc.). Clinic services reference these by ID/type.

### Language

All UI text is in **Romanian** (`ro_RO`). Keep new UI strings in Romanian.

---

<!-- COMPLETED_TASKS: 2026-03-31 -->
## Taskuri finalizate recent

- [x] **Sistem notificări clinici** — clopot în navbar cu badge + dropdown; când un pacient postează în feed, toate clinicile din același oraș primesc notificare în site + email (`dp_notifications` table, `sendNewPostToClinic`)
- [x] **Galerie Înainte/După** — upload (2 imagini → Cloudinary), preview live, captionă, delete; în clinic dashboard și profil public
- [x] **Recenzii pacienți** — `dp_reviews` table, endpoints GET/POST/can-review; afișate pe profilul public și în clinic dashboard
- [x] **Mesaje pacient → clinică** — modal "Trimite mesaj" pe profilul public, inbox cu reply în dashboard; email notificare la ambele capete
- [x] **Ore funcționare clinică** — editabil în `/clinici/profil`, afișat pe profilul public cu evidențierea zilei curente (`working_hours` JSONB în `dp_clinics`)
- [x] **Cereri recente din orașul tău** — secțiune în dashboard cu ultimele 5 cereri deschise din același oraș ca clinica (`GET /api/feed/clinic-city`)
- [x] **Statistici reale pe landing page** — trust bar cu numere din DB: clinici active, orașe, programări, recenzii (`GET /api/stats/public`)
- [x] **Email migrare nodemailer → Resend SDK** — `mailer.js` rescris complet; footer automat injectat în toate emailurile
- [x] **Backend rate limiters** — `clinicAuthLimiter`, `offerLimiter`, `apptLimiter`, `loginLimiter`, `registerLimiter`, `adminLimiter`
- [x] **`dp_reviews` migration** — `CREATE TABLE IF NOT EXISTS` în startup migrations, index pe `clinic_id`
- [x] **`/auth/me` returnează `created_at`** — `memberSince()` în profil pacient afișează anul real din DB
- [x] **Price filter în cards/map** — `maxPrice` în `DataShareService`, filtru aplicat în `CardsComponent` și `MapComponent`
- [x] **Rating real pe carduri și hartă** — `avg_rating` și `review_count` din DB în loc de hardcodat "4.5"

<!-- /COMPLETED_TASKS -->

<!-- PENDING_TASKS: 2026-03-31 -->
## Taskuri finalizate recent (continuare)

- [x] **Email bun venit pacient** — `sendPatientWelcomeEmail` în mailer.js, apelat în `POST /auth/verify-email` când `role === 'patient'`
- [x] **Filtre în feed după serviciu** — dropdown cu toate serviciile, param `service` adăugat în `GET /api/feed`
- [x] **Clinici similare** pe profil public — `GET /api/clinics/:id/similar` (același oraș, sortate după rating), secțiune în `clinic-profile`
- [x] **Statistici vizualizări profil** — `dp_clinic_profile_views` table, `POST /api/clinics/:id/view` (public), `GET /api/clinics/:id/views` (clinic auth), card nou "Vizualizări profil (30 zile)" în dashboard
- [x] **Fix guard clinic-profile** — non-clinic users (pacienți, guests) pot acum accesa `/clinic-profile/:id`; redirect la auth doar pentru `/clinici/profil` fără ID
- [x] **Sistem promoții clinici** — `dp_promotions` table; `GET/POST/DELETE /api/promotions`; secțiune în dashboard profil cu formular creare; vizibil pe profilul public; email automat la pacienții cu clinica la favorite (`sendPromotionToPatient`)

## Taskuri finalizate recent (continuare 2)

- [x] **Pagina înregistrare pacient** `/inregistrare` — pagină dedicată cu beneficii vizuale (layout split), form complet + verificare email; rută adăugată în `app.routes.ts`; link în footer
- [x] **Email confirmare programare** — verificat și funcțional: `PATCH /appointments/:id/status` apelează `sendAppointmentStatusToPatient` la confirmare/anulare/finalizare
- [x] **CTA recenzie în appointments** — buton "Recenzie" apare pe programările finalizate, duce la profilul clinicii la secțiunea recenzii
- [x] **SEO pages dinamice** — `ClinicListComponent` generează H1, meta title/description, canonical, JSON-LD ItemList, breadcrumbs, seo footer text ✅ complet
- [x] **Footer global** — adăugat în `AppComponent` (vizibil pe patient site, ascuns în portal clinici); coloane: pacienți, clinici, companie + social media + copyright
- [x] **Contact form funcțional** — formular în `/contact` postează la `POST /api/support/message` (email, nume, mesaj); mesaj de succes/eroare

## Taskuri finalizate recent (continuare 3)

- [x] **Pagina `/preturi`** — completă: tabel prețuri orientative cu min/avg/max, categorii filtrate, bar chart vizual, SEO text, CTA spre finder
- [x] **Pagina `/pentru-clinici`** — completă: hero, 6 beneficii, 3 planuri, formular lead capture (`POST /api/lead`), FAQ accordion, final CTA
- [x] **Badge promoții active în dashboard** — card nou „Promoții active" în quick actions cu număr real din API, badge colorat
- [x] **Link „Promoțiile mele"** în dropdown navbar clinică
- [x] **Link „Prețuri" în navbar clinică** — deascuns (era hidden cu HIDDEN_PRICING comment), acum pointează la `/preturi`

## ✅ PROIECT 100% COMPLET

## Taskuri finalizate recent (continuare 4 — securitate + analytics)

- [x] **Grafic vizualizări profil în dashboard** — card cu bar chart CSS pur, 30 zile zilnic din DB (`generate_series`), trend ±% față de săptămâna precedentă, tooltip nativ, afișat doar când există date
- [x] **Security fix: parolă expusă în API** — `POST /api/admin/create-clinic-accounts` nu mai include câmpul `password` în răspunsul JSON
- [x] **Security fix: rate limiting pe endpoint-uri publice** — `publicMsgLimiter` (10/oră) pe `/api/messages`, `/api/lead`, `/api/support/message`; `viewLimiter` (30/min) pe `/api/clinics/:id/view`
- [x] **Security fix: multer file validation** — adăugat `limits: { fileSize: 8MB }` și whitelist MIME types (`jpeg/png/webp/gif`)
- [x] **Security fix: erori server generice** — `500 err.message` din `create-clinic-accounts` înlocuit cu mesaj generic
- [x] **Security fix: parolă minimă** — crescut de la 6 la 8 caractere

## Taskuri finalizate recent (continuare 5 — pricing + Stripe)

- [x] **Pricing deblocat** — `/clinici/pricing` activ (pricingGuard scos), link în navbar dropdown + mobile menu restaurat
- [x] **`PlanCardComponent`** — componentă izolată per card (`src/app/pricing/plan-card/`), primește `@Input() plan`, `billingAnnual`, `selectable`, `selected`, emite `@Output() selectPlan`. Fiecare card poate fi modificat independent.
- [x] **`plan.model.ts`** — sursă unică de adevăr pentru planuri (Starter/Growth/Pro). Folosit atât în `PricingComponent` cât și în `FormComponent` — nu mai există duplicare.
- [x] **Prețuri în formularul de înregistrare** — step 6 nou "Plan" adăugat (formul are acum 7 pași). Folosește `PlanCardComponent` în mod selectable. Toggle lunar/anual. Pre-selectare din query param `?plan=growth`.
- [x] **Stripe full integration (backend)** — `POST /api/stripe/create-checkout-session`, `POST /api/stripe/webhook` (raw body, semnătură verificată), `POST /api/stripe/portal`, `GET /api/stripe/subscription`. Webhook gestionează: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`.
- [x] **Stripe DB migration** — `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, `current_period_end`, `trial_ends_at` adăugate în `dp_clinics`.
- [x] **Stripe redirect după submit** — clinicile care aleg Growth/Pro sunt redirecționate la Stripe Checkout după submit; Starter → overlay success ca înainte.
- [x] **Dashboard — card abonament** — arată planul curent, status (Activ/Trial/Restant), data reînnoire. Buton "Gestionează" → Stripe Billing Portal pentru planuri plătite; buton "Upgrade" → `/clinici/pricing` pentru Starter.
- [x] **Dashboard — toast checkout success** — mesaj verde apare la întoarcerea din Stripe, reîncarcă datele.
- [x] **Helmet security headers** — `app.use(helmet())` adăugat în backend.
- [x] **CORS localhost exclus în producție** — `localhost:4200` exclus automat când `NODE_ENV=production`.
- [x] **Flow plată imediat la alegere plan** — step 6 + "Continuă" pe plan plătit → submit imediat + redirect Stripe (nu mai așteaptă step 7). Starter rămâne cu step 7 + pending manual. Backend `POST /api/clinics` setează `status='pending_payment'` + returnează `checkoutUrl`. Webhook `checkout.session.completed` setează `status='active'` direct.
- [x] **Cancel Stripe → revenire în formular** — `cancel_url` pointează la `/clinici/inscriere?checkout=canceled`; formul detectează param, arată banner amber și sare la step 6.
- [x] **`PUT /api/clinics/:id` cu Stripe** — upgrade plan pe clinică existentă creează checkout session dacă nu are deja abonament activ; returnează `checkoutUrl` la fel ca POST.
- [x] **Fix CSS budget angular.json** — `anyComponentStyle` crescut la 200kB warning / 300kB error (maplibre-gl.css depășea 100kB).

### Variabile de mediu necesare pentru Stripe (în `.env` backend):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH_MONTHLY=price_xxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
```

<!-- /PENDING_TASKS -->
