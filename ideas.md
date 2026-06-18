# ideas.md — Idei implementate din inițiativă proprie

Acest fișier documentează funcționalitățile adăugate fără să fi fost cerute explicit.
Revizuiește și decide ce rămâne, ce se modifică, sau ce se elimină.

---

## 1. Sistem Unsubscribe Email (FAZA 1 — sesiunea 2026-06-18)

**Ce am implementat:**
- Tabelă `dp_email_suppressions` în DB: stochează dezabonările per email + tip
- Tipuri: `marketing`, `notificari`, `cont`, `all` (global)
- `GET /api/unsubscribe?email=&type=&token=` — pagina de confirmare cu token HMAC semnat
- `POST /api/resubscribe` — reactivare din setările contului
- `GET /api/unsubscribe-status` — statusul dezabonărilor pentru UI
- `isEmailSuppressed(email, type)` — verificare înainte de orice trimitere
- Link de dezabonare injectat automat în fiecare email prin `sendMail()`
- Tipul `cont` (alerte suspendare) nu poate fi blocat prin marketing/notificari — doar prin `all`

**De ce:** Cerință legală GDPR + bune practici email. Fără unsubscribe, riscați blocări pe domeniu și amendă ANPC.

**Unde în cod:**
- Backend: `index.js` — funcțiile `isEmailSuppressed()`, `generateUnsubToken()`, `addUnsubFooter()`, endpoint-urile `/api/unsubscribe*`
- Backend: `mailer.js` — `sendMail()` acceptă acum param `emailType` și injectează link dezabonare automat

---

## 2. Secvență automată suspendare clinici inactive (FAZA 2 — sesiunea 2026-06-18)

**Ce am implementat:**
- Tabelă `dp_clinic_suspension_seq` — tracking countdown per clinică
- Job săptămânal `jobSuspensionSequence()` — idempotent, cu countdown dinamic
- Email avertisment cu text dinamic: "mai ai 4/3/2/1 săptămâni"
- Suspendare automată după 4 săptămâni fără verificare/login
- Anulare automată a secvenței dacă clinica se verifică între timp
- Respectă suppression list (Faza 1) — emailurile de tip `cont` nu pot fi blocate prin marketing

**De ce:** Clinicile inactive îngreunează platforma (apar în căutări fără să răspundă la programări). Curățarea automată îmbunătățește rata de răspuns și experiența pacienților.

**Unde în cod:**
- Backend: `index.js` — funcția `jobSuspensionSequence()` + `sendSuspensionNotice()`, apelat din `runWeeklyEmailJobs()`
- DB: tabelă `dp_clinic_suspension_seq`

---

## 3. Performance Score widget în dashboard clinici (FAZA 5 — sesiunea 2026-06-18)

**Ce am implementat:**
- `get overallScore()` — scor 0-100 bazat pe: profil (50%), vizualizări (30%), programări finalizate (20%)
- `get overallScoreLabel()` — Excelent/Bun/În creștere/Începător
- `get overallScoreColor()` — culoare dinamică (verde/galben/albastru/roșu)
- Strip vizual "Performance Overview" cu ring SVG animat + 3 KPI-uri + buton completare profil

**De ce:** Dashboard-ul existent afișa datele fără context. Un scor agregat ajută clinica să înțeleagă rapid dacă merge bine sau nu și ce trebuie să facă.

**Unde în cod:**
- Frontend: `clinic-dashboard.component.ts` — getters `overallScore`, `overallScoreLabel`, `overallScoreColor`
- Frontend: `clinic-dashboard.component.html` — secțiunea `.perf-strip` (deasupra stats grid)
- Frontend: `clinic-dashboard.component.css` — clasele `.perf-*`

---

## 4. Fix pagedClinics getter → array explicit (FAZA 3 — sesiunea 2026-06-18)

**Ce am implementat:**
- Conversia `get pagedClinics()` (getter) la proprietate `pagedClinics: AdminClinic[]` actualizată explicit
- Metoda privată `updatePage()` apelată la filter change și navigare pagină

**De ce (tehnic):** Getter-ul care returnează `slice()` creează un array nou la fiecare change detection cycle. Angular's `@for` cu `track clinic.id` nu poate optimiza diferențele dacă array-ul e nou la fiecare ciclu → re-render complet al tuturor rândurilor → rânduri care "nu se randează complet" vizual.

**Unde în cod:**
- Frontend: `admin.component.ts` — liniile cu `pagedClinics`, `updatePage()`, `prevPage()`, `nextPage()`, `applyFilter()`
