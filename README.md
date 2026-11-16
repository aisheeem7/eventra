# EvenTra: College Event Management System

Working prototype for **Amity University Kolkata** (Software Engineering, IT301).
It covers the full event lifecycle on one platform: **Register → Ticket → Entry → Certify**.

**Team:** Aishee Mukherjee · Adrija Tarafder · Debopriya Das · Bhaswati Medhi · Bhawya Mishra · Ananya Rout

---

## Organizers and attendance

Events are run by **ASETK** (engineering & tech), **Placement Cell**, **Business Club** (startups & business), **Coding Club**, **Cultural Committee** and **Student Council** (`shared/organizers.js`).

B.Tech students must attend every **ASETK** and **Placement Cell** event; everything else is optional. The **Attendance** page shows a ring per student: green at 85%+, yellow at 75–84%, red below 75%. Organizers and admins see the whole roster.

---

## Run it on localhost

Requires **Node.js 18.11 or newer** (check with `node -v`).

```bash
npm install
npm start
```

Open **http://localhost:4000**. On first start the database is created and filled with demo data.

### Development mode (hot reload while you edit the UI)

```bash
npm run dev
```

Open **http://localhost:5173**. The API keeps running on port 4000. After editing the front end, run `npm run build` so `npm start` serves your changes.

### Reset the demo data

```bash
npm run seed
```

You can also sign in as admin and click **Reset demo data**. Dates are relative to the day you seed, so there is always one event running *today* (good for showing the scanner live) and a few completed events that already have certificates.

## Deploy on Vercel

1. Import the GitHub repo in Vercel. `vercel.json` already sets the build (`npm run build`), the output folder (`client/dist`) and routes `/api/*` to the Express app in `api/index.js`.
2. Optional but recommended: add an environment variable `APP_SECRET` (any long random string). It signs sign-in tokens and ticket QR codes.
3. Deploy. The demo data seeds itself on first request, and the same demo accounts work.

**Limitation of this version:** Vercel functions have no permanent disk, so data is kept in `/tmp` per instance. New sign-ups, registrations and check-ins can reset when Vercel starts a fresh instance; the demo data always comes back. Connect a hosted database (only `server/db.js` touches storage) to make changes permanent.

---

## Demo accounts

All accounts use the password **`demo123`**. The sign-in page has one-click buttons for each of them.

| Person | Role | Email |
|---|---|---|
| Aishee Mukherjee | Student | aishee@cems.demo |
| Adrija Tarafder | Student | adrija@cems.demo |
| Debopriya Das | Student | debopriya@cems.demo |
| Bhawya Mishra | Student | bhawya@cems.demo |
| Bhaswati Medhi | Event Organizer (ACM Student Chapter) | bhaswati@cems.demo |
| Ananya Rout | Verification Staff | ananya@cems.demo |
| EvenTra Admin | Administrator | admin@cems.demo |

You can also sign in with a roll number, for example `A910055223131`.

## Suggested 5-minute demo script

1. **Student (Aishee)** opens Home, picks *Git & GitHub for Beginners*, registers, and gets a QR entry pass.
2. **Student (Debopriya)** registers for *CodeSprint* (₹50). The demo UPI payment step runs, then she gets her ticket.
3. **Staff (Ananya)** opens Scan Entry. Today's workshop is pre-selected. Start the camera and scan a ticket from a phone screen, or use **Scan from image** with a screenshot of a QR, or type the `CEMS-XXXXXX` code. Scan the same ticket again and it is blocked as **Already used**.
4. **Organizer (Bhaswati)** opens the workshop and sees live check-ins. She approves pending requests on *Resume Review & Mock Interviews*, exports the attendance CSV, then clicks **Close & certify**. Certificates go only to students whose entry was scanned.
5. **Student** opens Certificates, then **Download PDF** (the browser's print dialog, saved as PDF).
6. Anyone can open `/verify/<certificate-id>` to check that a certificate is genuine. Try a fake ID to see it rejected.
7. **Admin** opens the platform overview to see analytics across every event, and can change user roles.

## How each problem from the deck is solved

| Problem (slides 5 and 12) | Where it's handled in the code |
|---|---|
| Duplicate registrations | Email and roll number are unique at sign-up (`/api/auth/register`). Registration is limited to one per student per event (`/api/events/:id/register`). |
| Forgeable paper tickets | The QR code encodes `CEMS1.<registrationId>.<HMAC-SHA256 signature>` using a server secret. An edited or forged QR fails the signature check. |
| Proxy / reused entry | A ticket can only be scanned once. Later scans are logged as *duplicate*, and scans for the wrong event or for unapproved registrations are also blocked (`/api/checkin`). |
| Delayed certificates | **Close & certify** generates certificates in bulk, only for verified attendees (`/api/events/:id/complete`). |
| Forged certificates | Public verification page `/verify/:id`. |
| No live headcount | The scanner screen polls the live count and recent scans every 3 seconds. |
| No cross-event visibility | Admin analytics: registrations vs attendance, categories, fees and blocked scans. |
| Seat tracking | Live seats-left bar, an orange "few seats left" state, and a check that capacity is never exceeded. |

## Tech stack

- **Front end:** React 18, React Router, Vite and lucide-react icons. `qrcode` generates the QR passes and `html5-qrcode` scans them with the camera or from an image.
- **Back end:** Node.js and Express. Passwords are hashed with scrypt and logins use bearer-token sessions.
- **Data:** a JSON file store (`server/data/db.json`) with no database server to install. `server/db.js` is the only file that touches storage, so you can replace it with MongoDB later without changing the routes.

```
cems/
├── server/
│   ├── index.js    REST API (auth, events, registration, check-in, certificates, admin)
│   ├── db.js       JSON store, password hashing, QR signing
│   └── seed.js     Demo data (team members, Amity events)
└── client/src/
    ├── App.jsx     Routes and role guards
    ├── components/ Shell (sidebar / mobile tab bar), shared UI
    └── pages/      Login, Home, EventDetail, Register, Tickets, Certificates,
                    OrgDashboard, EventForm, OrgEvent, Scanner, Admin, Verify
```

## UI notes: refinements over the Figma UI kit

The prototype follows the kit's look: Inter type, navy headings, purple accents, white rounded cards, the ticket stub with notches, and the 2-step Details → Confirm registration flow. These changes were made on top of it:

- **One primary action colour.** The kit used purple, orange and dark red for different main buttons. Every primary action is now purple, teal means success or "verified", and orange is used only for warnings such as "few seats left" or "awaiting approval".
- **The greeting follows the time of day** instead of always saying "Good morning", and the missing space in "Hi,Daisy" is fixed.
- **Event cards** have a date block, a coloured edge for the category, a seats-left bar, and your own registration status on the card.
- **Category chips show counts.** There is an empty state with "Clear filters", and a "Today" banner on Home that links straight to your pass.
- **The registration form uses your verified profile.** Name, roll number and email are filled in and read-only, which supports the duplicate-identity goal. A payment step is added for paid events.
- **The ticket shows its real state:** confirmed QR, pending approval, rejected, or checked in. A used pass hides its QR.
- **Responsive layout.** Phones get a mobile layout with a bottom tab bar, as in the kit. Laptops get a sidebar layout, which suits the organizer and admin dashboards.
- **Accessibility:** visible focus rings, `role="alert"` on scan results, and labelled form fields.

## Next increments (from the incremental model and future scope)

- Real payment gateway (Razorpay test mode) instead of the simulated UPI step.
- Email or WhatsApp notifications when a ticket is issued and when an event is about to start.
- Move from the JSON store to MongoDB or PostgreSQL, and connect to the college ERP for student identity.
- Offline-capable scanner as an installable PWA.
