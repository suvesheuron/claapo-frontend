# CrewCall

**CrewCall** is a modern web application for film production hiring and crew management. It connects production companies with verified freelance crew members and equipment vendors. Streamline hiring, manage availability, and lock your team in one platform.

---

## Features

- **Landing page** – Hero, benefits by role (Company / Freelancer / Vendor), how it works, and call-to-action
- **User type selection** – Choose account type: Company, Individual, or Vendor
- **Login** – Email/phone and password with “Remember me” and “Forgot password”
- **Company registration** – Company name, GST, phone, email, and verification information
- **Company dashboard** – Quick actions (Create Project, Search Crew, Search Vendors), project calendar, ongoing projects, and quick stats
- **Create project** – Project details, required roles, budget, and summary sidebar
- **Search & filter** – Find crew and vendors by role, location, availability, budget, and experience with result cards and pagination

---

## Tech stack

| Category    | Technology        |
|------------|-------------------|
| Framework  | React 19          |
| Language   | TypeScript        |
| Build      | Vite 7            |
| Styling    | Tailwind CSS 4    |
| Routing    | React Router 6    |
| Icons      | react-icons (FA6) |

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 or 22)
- **npm** (or yarn / pnpm)

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/euron-code-labs/crewcall-webui-app.git
cd crewcall-webui-app
npm install
```

---

## Running the application

### Development

Start the dev server with hot reload:

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. **http://localhost:5173/**).

### Production build

Build for production (output in `dist/`):

```bash
npm run build
```

### Preview production build

After building, preview the production build locally:

```bash
npm run preview
```

---

## Project structure

```
src/
├── components/          # Reusable UI components
│   ├── AppFooter.tsx
│   ├── AppHeader.tsx
│   ├── AppLayout.tsx
│   └── DashboardHeader.tsx
├── pages/               # Route-level pages
│   ├── LandingPage.tsx
│   ├── UserTypeSelect.tsx
│   ├── Login.tsx
│   ├── CompanyRegistration.tsx
│   ├── RegisterPlaceholder.tsx
│   ├── CompanyDashboard.tsx
│   ├── CreateProject.tsx
│   └── SearchFilter.tsx
├── App.tsx              # Router and lazy-loaded routes
├── main.tsx
└── index.css            # Global styles + Tailwind
```

---

## Application flow

| Route | Description |
|-------|-------------|
| `/` | Landing page – hero, benefits, how it works, CTA |
| `/login` | Login form (email/phone + password) |
| `/register` | Choose account type (Company / Individual / Vendor) |
| `/register/company` | Company registration form |
| `/register/individual` | Placeholder (“Coming soon”) |
| `/register/vendor` | Placeholder (“Coming soon”) |
| `/dashboard` | Company dashboard – calendar, projects, quick actions |
| `/dashboard/projects/new` | Create new project |
| `/dashboard/search` | Search and filter crew & vendors |

### Quick test flow

1. **Sign up (UI only):** Click **Register** → **Continue as Company** → fill the form → **Register Company**.
2. **Login (UI only):** Click **Login** → enter any email/password → **Login** (no backend; form is UI only).
3. **Use dashboard:** Click **Hire Crew** on the home page or go to `/dashboard` to open the dashboard, create projects, and search crew/vendors.

*Note: Login and registration are UI-only; no backend or persistence is implemented yet.*

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## License

Private. All rights reserved.

---

## Repository

**GitHub:** [euron-code-labs/crewcall-webui-app](https://github.com/euron-code-labs/crewcall-webui-app)
