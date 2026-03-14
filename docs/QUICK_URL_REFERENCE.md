# Quick URL Reference Guide

**Codex Platform - Complete URL Map**

---

## 🔐 Admin Module (`/admin`)

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin` | System overview |
| Login | `/admin/login` | Admin authentication |
| Users | `/admin/users` | User management |
| Roles | `/admin/roles` | Role configuration |
| Permissions | `/admin/permissions` | Permission mapping |
| Audit Logs | `/admin/audit-logs` | Activity tracking |
| Integrations | `/admin/integrations` | API integrations |
| Payments | `/admin/payments` | Payment admin |
| Settings | `/admin/settings` | System settings |

---

## 🚚 Driver & Field Operations (`/(workspace)/field-ops`)

| Page | URL | Purpose | Role |
|------|-----|---------|------|
| Dashboard | `/(workspace)/field-ops` | Operations hub | Driver, Ops Mgr |
| Tracking | `/(workspace)/field-ops/tracking` | GPS tracking | Driver |
| POD Capture | `/(workspace)/field-ops/pod` | Proof of delivery | Driver |
| Damage Report | `/(workspace)/field-ops/damage` | Damage reporting | Driver |
| Shipment Tracking | `/(workspace)/tracking` | Multi-carrier tracking | All |
| Exceptions | `/(workspace)/exceptions` | Exception mgmt | Ops Mgr |

---

## 💳 Financial Operations (`/(workspace)/payments`)

| Page | URL | Purpose | Role |
|------|-----|---------|------|
| Payments | `/(workspace)/payments` | Payment processing | Finance Mgr |
| Invoices | `/(workspace)/payments/invoices` | Invoice management | Finance Mgr |
| Disputes | `/(workspace)/payments/disputes` | Dispute resolution | Finance Mgr |
| Audits | `/(workspace)/payments/audits` | Invoice audits | Analyst |
| Reports | `/(workspace)/reports` | Financial reports | Finance Mgr |

---

## 📊 Analytics & Sustainability (`/(workspace)/analytics`)

| Page | URL | Purpose | Role |
|------|-----|---------|------|
| Dashboard | `/(workspace)/analytics` | Analytics hub | Supply Chain Mgr |
| Predictions | `/(workspace)/analytics/predictions` | ML predictions | Supply Chain Mgr |
| Cost Analysis | `/(workspace)/analytics/cost` | Cost optimization | Finance Mgr |
| Sustainability | `/(workspace)/analytics/sustainability` | Carbon tracking | Ops Mgr |
| Intelligence | `/(workspace)/intelligence` | Insights hub | Supply Chain Mgr |

---

## 🎯 Logistics Intelligence (`/(workspace)/intelligence`)

| Page | URL | Purpose | Role |
|------|-----|---------|------|
| Dashboard | `/(workspace)/intelligence` | Intelligence hub | Logistics Mgr |
| Scorecards | `/(workspace)/intelligence/scorecards` | Carrier metrics | Logistics Mgr |
| Reports | `/(workspace)/intelligence/reports` | Custom reports | Logistics Mgr |
| Pre-built Reports | `/(workspace)/reports` | Standard reports | All |
| Carrier Reports | `/(workspace)/reports/carriers` | Carrier analysis | Logistics Mgr |
| Shipment Reports | `/(workspace)/reports/shipments` | Shipment analytics | All |

---

## 🔧 Supporting Pages (`/(workspace)`)

| Page | URL | Purpose | Role |
|------|-----|---------|------|
| Main Dashboard | `/(workspace)/dashboard` | Workspace overview | All |
| Carriers | `/(workspace)/carriers` | Carrier management | Logistics Mgr |
| Rates | `/(workspace)/rates` | Rate shopping | Supply Chain Mgr |
| Scorecards | `/(workspace)/scorecards` | Performance metrics | All |
| Documents | `/(workspace)/documents` | Document mgmt | All |
| Settings | `/(workspace)/settings` | Workspace config | Admin |

---

## 📋 Workspace Layout Routes (`/(workspace)`)

All workspace pages use the layout from `app/(workspace)/layout.tsx` which provides:
- Navigation menu
- Role-based access control
- User profile menu
- Breadcrumbs
- Responsive design

---

## 🔗 API Endpoints

### Core Endpoints
- `GET /api/companies` - Get company info
- `POST /api/companies` - Create company
- `GET /api/roles` - Get roles & permissions

### Shipment Endpoints
- `GET /api/shipments` - List shipments
- `POST /api/shipments/:id/tracking-event` - Add tracking event
- `POST /api/shipments/:id/delivery-proof` - Submit POD
- `POST /api/shipments/:id/damage-report` - Report damage

### Financial Endpoints
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `POST /api/payments` - Process payment

### Analytics Endpoints
- `GET /api/analytics/predictions` - Get ML predictions
- `GET /api/analytics/cost-analysis` - Cost analysis
- `GET /api/intelligence/signals` - Get AI signals

---

## 🔐 URL Access by Role

### Platform Admin
```
✅ /admin/*
✅ /(workspace)/*
✅ /api/*
```

### Workspace Admin
```
❌ /admin/* (except workspace settings)
✅ /(workspace)/*
✅ /api/* (workspace scoped)
```

### Supply Chain Manager
```
❌ /admin/*
✅ /(workspace)/dashboard
✅ /(workspace)/field-ops
✅ /(workspace)/analytics
✅ /(workspace)/intelligence
✅ /(workspace)/carriers
✅ /(workspace)/rates
✅ /(workspace)/tracking
✅ /api/* (workspace scoped)
```

### Finance Manager
```
❌ /admin/*
✅ /(workspace)/dashboard
✅ /(workspace)/payments
✅ /(workspace)/payments/invoices
✅ /(workspace)/payments/disputes
✅ /(workspace)/reports
✅ /(workspace)/analytics/cost
✅ /api/* (workspace scoped)
```

### Operations Manager
```
❌ /admin/*
✅ /(workspace)/dashboard
✅ /(workspace)/field-ops
✅ /(workspace)/exceptions
✅ /(workspace)/tracking
✅ /(workspace)/reports
✅ /(workspace)/analytics/sustainability
✅ /api/* (workspace scoped)
```

### Driver / Logistics Coordinator
```
❌ /admin/*
✅ /(workspace)/dashboard
✅ /(workspace)/field-ops
✅ /(workspace)/field-ops/tracking
✅ /(workspace)/field-ops/pod
✅ /(workspace)/field-ops/damage
✅ /(workspace)/tracking
✅ /(workspace)/reports/shipments
✅ /api/* (specific endpoints)
```

---

## 📍 URL Naming Conventions

### Rules
- Use **kebab-case** for URL segments: `/field-ops`, `/cost-analysis`
- Use **lowercase** letters: `/admin`, `/(workspace)`
- Use **hyphens** NOT underscores: `/damage-report` ✅, NOT `/damage_report` ❌
- Use **full words**: `/intelligence` ✅, NOT `/intl` ❌

### Examples
```
✅ /(workspace)/field-ops
✅ /(workspace)/cost-analysis
✅ /(workspace)/intelligence
✅ /(workspace)/damage-report
❌ /(workspace)/fieldOps
❌ /(workspace)/cost_analysis
❌ /(workspace)/intl
```

---

## 🗂️ Sitemap

```
root/
├── /auth/
├── /admin/
│   ├── /login
│   ├── /dashboard
│   ├── /users
│   ├── /roles
│   ├── /permissions
│   ├── /audit-logs
│   ├── /integrations
│   ├── /payments
│   └── /settings
└── /(workspace)/
    ├── /dashboard
    ├── /field-ops/
    │   ├── /tracking
    │   ├── /pod
    │   └── /damage
    ├── /tracking/
    ├── /exceptions/
    ├── /payments/
    │   ├── /invoices
    │   ├── /disputes
    │   └── /audits
    ├── /reports/
    │   ├── /carriers
    │   └── /shipments
    ├── /analytics/
    │   ├── /predictions
    │   ├── /cost
    │   └── /sustainability
    ├── /intelligence/
    │   ├── /scorecards
    │   └── /reports
    ├── /carriers/
    ├── /rates/
    ├── /scorecards/
    ├── /documents/
    └── /settings/
```

---

## 🚀 Getting Started with URLs

### Step 1: Know Your Role
Find your role above to see which URLs you can access

### Step 2: Navigate Using URLs
Copy the URL from the table and use it in your browser

### Step 3: Use the Navigation Menu
The sidebar menu also shows all available pages for your role

### Step 4: Check Implementation Status
See `docs/MODULE_MIGRATION.md` for which features are ready

---

## 📱 Mobile URLs

All URLs work on mobile! The design is responsive.
- Mobile (320px+): Full single-column layout
- Tablet (768px+): Multi-column where applicable
- Desktop (1024px+): Full layout optimization

---

## 💾 Bookmark These

**Quick Links for Frequent Access:**
- Admin Dashboard: `/admin`
- Workspace Dashboard: `/(workspace)/dashboard`
- Field Operations: `/(workspace)/field-ops`
- Payments: `/(workspace)/payments`
- Intelligence: `/(workspace)/intelligence`

---

## ❓ Can't Find Your Page?

1. **Check your role** in the "URL Access by Role" section
2. **Look in the relevant table** above (Admin, Driver, Finance, etc.)
3. **Consult** `docs/modules/README.md` for module overview
4. **Review** `docs/MODULES_ROUTING.md` for detailed routing

---

**Last Updated:** March 14, 2026
**Version:** 1.0

