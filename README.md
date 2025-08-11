<<<<<<< HEAD

# PMS

# PMS (Property Management System) platform is a centralized system for property owners and managers to efficiently handle rentals, tenants, payments, maintenance, and leases — all in one place.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

> > > > > > > 2084545 (Initial commit: Add project files)

PropertyManagementSystem/
├── src/
│ ├── api/
│ │ └── supabase.js # Functions to interact with Supabase
│ ├── components/
│ │ ├── layout/
│ │ │ ├── DashboardLayout.jsx
│ │ │ ├── Sidebar.jsx
│ │ │ └── AuthGuard.jsx
│ │ └── ui/ # Reusable UI elements (e.g., Card, Button)
│ ├── config/
│ │ └── supabaseClient.js # Supabase client initialization
│ ├── features/
│ │ ├── auth/
│ │ │ └── LoginPage.jsx
│ │ └── user-management/
│ │ ├── UserManagementPage.jsx
│ │ └── PermissionsPanel.jsx
│ ├── hooks/
│ │ └── useAuth.js # Custom hook to access auth state easily
│ ├── lib/
│ │ └── icons.js # Icon mapping and dynamic loading
│ ├── pages/
│ │ ├── Dashboard.jsx
│ │ ├── Login.jsx
│ │ └── AdminUsers.jsx
│ ├── store/
│ │ └── useAuthStore.js # Zustand store for session management
│ ├── App.jsx
│ └── main.jsx
└── package.json
