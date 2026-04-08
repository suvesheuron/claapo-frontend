# Claapo — Web Frontend

**Claapo / CrewCall** is a hiring and crew-management platform for film and video production. It connects production companies with verified freelance crew members and equipment vendors — handle availability, bookings, projects, invoices, and chat in one place.

This package is the **web frontend**. It talks to the [`crewcall-backend`](../crewcall-backend) over HTTP/WebSocket.

---

## Tech stack

| Category | Technology |
|---|---|
| Framework | **React 19** |
| Language | TypeScript 5.9 |
| Build tool | **Vite 7** |
| Styling | **Tailwind CSS 4** (via `@tailwindcss/vite`) |
| Routing | React Router **7** |
| Animation | Framer Motion 12 |
| Notifications | react-hot-toast |
| Icons | react-icons |
| Linting | ESLint 9 (flat config) + typescript-eslint |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | **>= 20** (recommended: 22 or 24) |
| npm | >= 10 |
| Backend | `crewcall-backend` running locally or reachable URL |

---

## Quick start

```bash
# 1. Install
cd crewcall-frontend
npm install

# 2. Make sure the backend is running
#    (see ../crewcall-backend/README.md — typically: docker compose up -d && npm run start:dev)

# 3. Start the dev server
npm run dev
```

The dev server prints a URL (usually **http://localhost:5173**). Open it in a browser.

---

## Connecting to the backend

The frontend talks to the API in two different ways depending on environment:

### Development — Vite proxy

In dev, requests to `/v1/*` are proxied to `http://localhost:3000` by `vite.config.ts`:

```ts
server: {
  proxy: {
    '/v1': { target: 'http://localhost:3000', changeOrigin: true },
  },
}
```

So you do **not** need to set any env var for local development — just make sure the backend is up on port 3000.

### Production — `VITE_API_URL`

For production builds the frontend points directly at the deployed API. Configure it via `.env.production`:

```env
VITE_API_URL=https://api.crewcall.in/v1
```

Override this for staging or any other environment as needed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |

---

## Project structure

```
crewcall-frontend/
├── public/
├── src/
│   ├── main.tsx                # App entry
│   ├── App.tsx                 # Router + lazy routes
│   ├── index.css               # Tailwind + global styles
│   ├── components/             # Reusable UI (header, footer, layout, modals, …)
│   ├── pages/                  # Route-level pages
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── OtpVerify.tsx
│   │   ├── UserTypeSelect.tsx
│   │   ├── IndividualRegistration.tsx
│   │   ├── CompanyRegistration.tsx
│   │   ├── VendorRegistration.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CompanyDashboard.tsx
│   │   ├── IndividualDashboard.tsx
│   │   ├── VendorDashboard.tsx
│   │   ├── CreateProject.tsx
│   │   ├── EditProject.tsx
│   │   ├── OngoingProjects.tsx
│   │   ├── SearchFilter.tsx
│   │   ├── Bookings.tsx
│   │   ├── InvoicesList.tsx
│   │   ├── CreateInvoice.tsx
│   │   ├── Invoice.tsx
│   │   ├── Chat.tsx
│   │   ├── Conversations.tsx
│   │   ├── OtherUserProfile.tsx
│   │   ├── About.tsx · Contact.tsx · Privacy.tsx · Terms.tsx
│   │   ├── admin/              # Admin panel pages
│   │   ├── company/            # Company-only screens
│   │   ├── individual/         # Individual-only screens
│   │   ├── vendor/             # Vendor-only screens
│   │   └── reports/
│   ├── register/               # Registration flow helpers
│   ├── navigation/             # Route guards / nav helpers
│   ├── services/               # API client modules
│   ├── contexts/               # React contexts (auth, etc.)
│   ├── hooks/
│   ├── constants/
│   ├── types/
│   ├── utils/
│   └── assets/
├── index.html
├── vite.config.ts              # Vite + React + Tailwind plugin + /v1 proxy
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js            # ESLint flat config
├── vercel.json                 # Vercel SPA rewrites
├── .env.production
└── package.json
```

---

## Application flow (high level)

| Route | Description |
|---|---|
| `/` | Landing page — hero, benefits, how it works, CTA |
| `/login` | Email/phone + password login |
| `/forgot-password` | Password reset request |
| `/otp/verify` | OTP verification step |
| `/register` | Choose account type (Company / Individual / Vendor) |
| `/register/company` · `/register/individual` · `/register/vendor` | Role-specific registration |
| `/dashboard` | Role-aware dashboard (Company / Individual / Vendor) |
| `/dashboard/projects/new` · `/dashboard/projects/:id/edit` | Project create / edit |
| `/dashboard/projects` · `/dashboard/projects/ongoing` | Project lists |
| `/dashboard/search` | Search and filter crew & vendors |
| `/dashboard/bookings` | Incoming / outgoing booking requests |
| `/dashboard/invoices` · `/dashboard/invoices/new` · `/dashboard/invoices/:id` | Invoicing |
| `/dashboard/chat` · `/dashboard/conversations` | 1:1 chat (Socket.IO) |
| `/u/:userId` | Public profile of another user |
| `/admin/*` | Admin panel (admin role only) |

> Routing and lazy-loading are wired in `src/App.tsx`. Open it for the canonical, always-up-to-date list of routes.

---

## Production build

```bash
npm run build       # outputs to dist/
npm run preview     # serve dist/ locally on a preview port
```

`vercel.json` includes the SPA rewrite so client-side routes work on Vercel deploys.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Network Error` / 404 on `/v1/...` in dev | Backend not running on `http://localhost:3000`, or proxy disabled. Start the backend first. |
| CORS errors in production | The deployed origin isn't in the backend's `CORS_ORIGINS`. Add it on the backend `.env`. |
| Login succeeds but next request 401s | Backend JWT secret rotated, or token expired. Log out and back in. |
| Dev server picks port `5174+` | Port 5173 is taken by another Vite process. Kill it or accept the new port. |

---

## License

Private. All rights reserved.
