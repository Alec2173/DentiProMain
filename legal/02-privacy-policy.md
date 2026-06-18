# Politica de Confidențialitate (GDPR) — DentiPro

**Operator de date:** URBANIA DIGITAL GROUP S.R.L.
**Sediu social:** România, București, Sector 1, Strada Târnăveni nr. 22, Camera 1, Etaj 5, Apartament 5.4
**CUI:** 54835299
**Nr. Registrul Comerțului:** J2026036946002
**Contact protecția datelor:** privacy@dentipro.ro
**Ultima actualizare:** 16.06.2026

---

## 1. Introducere

Această Politică descrie modul în care **URBANIA DIGITAL GROUP S.R.L.**, în calitate de operator de date, colectează, utilizează, stochează și protejează datele cu caracter personal ale utilizatorilor platformei **DentiPro** (https://dentipro.ro), în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și Legea nr. 190/2018.

## 2. Categorii de date colectate

### 2.1. Clinici stomatologice (cont profesional)
- Denumirea clinicii, adresă, oraș, coordonate GPS
- Email și numere de telefon (public + manager)
- Logo și fotografii ale clinicii (stocate la Cloudinary)
- Servicii oferite, prețuri, descriere, program de lucru
- Date de facturare/abonament (legate prin Stripe Customer ID — DentiPro nu stochează date de card)
- Parola contului (criptată bcrypt — niciodată stocată în clar)

### 2.2. Pacienți / utilizatori înregistrați
- Nume, adresă de email, parolă (criptată)
- Numere de telefon (opțional, la programare)
- Clinici salvate la favorite
- Programări efectuate: clinică, serviciu, dată, oră, note opționale introduse de pacient
- Recenzii și evaluări lăsate
- Cereri din secțiunea Feed (descrieri de nevoi, imagini opționale, oraș, buget estimat)

### 2.3. Vizitatori neînregistrați
- Date de utilizare anonimizate/pseudonimizate prin Google Analytics și PostHog — **doar dacă acceptați cookie-urile de analiză** prin bannerul de consimțământ
- Adresă IP, procesată tehnic de server și de furnizorii de analiză
- Date de atribuire UTM / referrer

### 2.4. Date privind notele de programare

Notele opționale introduse de pacient la o programare (ex. descrierea motivului vizitei) sunt informații furnizate voluntar de utilizator pentru a facilita comunicarea cu clinica. Aceste note sunt transmise direct clinicii și nu constituie o fișă medicală în sensul legislației sanitare; DentiPro le tratează cu același nivel de protecție tehnică și organizatorică aplicat restului datelor de cont, fără a le analiza, prelucra automat sau utiliza în alte scopuri. DentiPro **nu colectează și nu prelucrează** fișe medicale, diagnostice sau istoricul tratamentelor — aceste date rămân exclusiv în gestiunea clinicii, conform Legii nr. 95/2006 și Legii nr. 46/2003 a drepturilor pacientului.

## 3. Scopurile și bazele legale ale prelucrării

| Scop | Bază legală GDPR |
|---|---|
| Crearea și administrarea contului | Art. 6(1)(b) — executarea contractului |
| Afișarea profilului public al clinicii | Art. 6(1)(b) — executarea contractului |
| Procesarea programărilor online | Art. 6(1)(b) — executarea contractului |
| Procesarea plăților abonamentelor (Stripe) | Art. 6(1)(b) — executarea contractului |
| Comunicări tranzacționale (confirmări, notificări) | Art. 6(1)(b) — executarea contractului |
| Cookie-uri de analiză (PostHog, Google Analytics) | Art. 6(1)(a) — consimțământ explicit, revocabil oricând |
| Newsletter / comunicări de marketing | Art. 6(1)(a) — consimțământ explicit, opțional |
| Securitatea platformei, prevenirea fraudei | Art. 6(1)(f) — interes legitim |
| Respectarea obligațiilor fiscale/contabile (facturare) | Art. 6(1)(c) — obligație legală |
| Soluționarea litigiilor și plângerilor | Art. 6(1)(f) — interes legitim / Art. 6(1)(c) |

## 4. Furnizori terți care procesează date (împuterniciți)

| Furnizor | Rol | Date transferate |
|---|---|---|
| **Stripe** | Procesare plăți abonamente | Date de facturare; datele de card sunt gestionate direct de Stripe, conform standardului PCI-DSS, fără a tranzita serverele DentiPro |
| **Cloudinary** | Stocare imagini (logo, galerie) | Fotografii încărcate de clinici |
| **MapTiler** | Geocodare adrese în coordonate GPS și afișare hărți | Adresa clinicii |
| **Google Maps** | Afișare hărți interactive | Adresă, coordonate |
| **Resend** | Trimitere email-uri tranzacționale | Email, conținut notificare |
| **PostHog** | Analiză de produs, doar cu consimțământ | Evenimente de utilizare anonimizate |
| **Google Analytics (GA4)** | Analiză trafic, doar cu consimțământ | Date comportamentale pseudonimizate, IP |
| **Render** | Hosting backend și bază de date | Toate datele platformei |

Cu fiecare furnizor de mai sus, DentiPro a acceptat termenii standard de procesare a datelor (Data Processing Agreement) oferiți de furnizor, integrați contractual prin acceptarea condițiilor lor de serviciu. Pentru furnizorii situați în afara Spațiului Economic European, transferul de date se realizează în baza Clauzelor Contractuale Standard aprobate de Comisia Europeană și/sau a mecanismelor de adecvare recunoscute (ex. EU-US Data Privacy Framework).

## 5. Durata stocării (perioade de retenție)

| Tip de date | Durată |
|---|---|
| Date de cont activ | Pe durata existenței contului |
| Date de cont după ștergere | Eliminate din baza de date activă în maximum 30 de zile |
| Backup-uri criptate | 90 de zile, după care sunt suprascrise definitiv |
| Programări | 2 ani de la data programării |
| Date de facturare (obligație fiscală) | 10 ani, conform Legii contabilității nr. 82/1991 |
| Mesaje suport/contact | 24 de luni |
| Date Google Analytics | 14 luni |
| Date PostHog | 12 luni |

## 6. Drepturile persoanei vizate

A se vedea documentul dedicat „16-gdpr-data-subject-rights.md" pentru detalii complete și procedura de exercitare: drept de acces, rectificare, ștergere, restricționare, portabilitate, opoziție, retragere consimțământ, plângere la ANSPDCP.

## 7. Securitatea datelor

DentiPro aplică următoarele măsuri tehnice și organizatorice:
- parole stocate criptat (bcrypt);
- conexiuni criptate HTTPS/TLS pentru toate comunicările;
- acces la baza de date restricționat, autentificat și auditat;
- jetoane de autentificare (JWT) cu expirare, stocate local pe dispozitivul utilizatorului;
- backup-uri criptate ale bazei de date, păstrate 90 de zile;
- control administrativ al accesului la sistemele interne, limitat la personalul autorizat;
- monitorizare continuă a incidentelor de securitate;
- procedură internă de răspuns la incidente, incluzând evaluarea riscului și, dacă legislația o impune, **notificarea Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) în maximum 72 de ore** de la constatarea unei breșe de securitate, conform art. 33-34 GDPR, precum și notificarea persoanelor vizate afectate, atunci când riscul pentru drepturile și libertățile acestora este ridicat.

## 8. Transferuri internaționale de date

Anumiți furnizori (Stripe, Google) procesează date și în afara Spațiului Economic European. Aceste transferuri se realizează exclusiv în baza Clauzelor Contractuale Standard aprobate de Comisia Europeană și/sau a deciziilor de adecvare aplicabile, asigurând un nivel de protecție echivalent celui garantat de GDPR.

## 9. Cookie-uri și tehnologii similare

A se vedea documentul dedicat „03-cookie-policy.md".

## 10. Decizii automatizate / profilare

DentiPro **nu utilizează** procese de decizie automatizată sau profilare cu efecte juridice asupra utilizatorilor, în sensul art. 22 GDPR. Clasificarea clinicilor pe planuri de abonament (Pro/Growth/Starter), afișată în rezultatele de căutare, este determinată exclusiv de planul de abonament ales de clinică, nu de un proces automatizat aplicat datelor personale ale pacientului.

## 11. Responsabilul cu protecția datelor

URBANIA DIGITAL GROUP S.R.L. nu desemnează în prezent un Responsabil cu Protecția Datelor (DPO) formal, activitatea de prelucrare desfășurată de DentiPro nefiind o prelucrare pe scară largă de categorii speciale de date sau o monitorizare sistematică pe scară largă a persoanelor vizate, în sensul art. 37 GDPR. Punctul de contact pentru toate aspectele legate de protecția datelor este: **privacy@dentipro.ro**.

## 12. Modificări ale Politicii

Politica poate fi actualizată periodic. Modificările semnificative vor fi comunicate prin email utilizatorilor înregistrați, cu minimum 14 zile înainte de aplicare.

## 13. Plângeri

Aveți dreptul de a depune plângere la autoritatea de supraveghere:
**Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)**
B-dul G-ral. Gheorghe Magheru 28-30, București
https://www.dataprotection.ro

## 14. Contact

**URBANIA DIGITAL GROUP S.R.L.**
**Email protecția datelor:** privacy@dentipro.ro
**Adresă:** România, București, Sector 1, Strada Târnăveni nr. 22, Camera 1, Etaj 5, Apartament 5.4
