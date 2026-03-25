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
