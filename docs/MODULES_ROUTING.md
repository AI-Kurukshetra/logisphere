# Module Routing Guide

This document defines the URL structure and routing for all Codex platform modules.

## Routing Map by Module

### 1. Admin & Security Module
**Documentation:** `docs/modules/01-admin-security.md`

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/admin` | Admin Dashboard | Platform Admin | System overview |
| `/admin/login` | Auth Page | Everyone | Admin authentication |
| `/admin/users` | User Management | Admin | User CRUD operations |
| `/admin/roles` | Role Management | Admin | Role configuration |
| `/admin/permissions` | Permissions | Admin | Permission mapping |
| `/admin/dashboard` | Dashboard | Admin | Analytics overview |
| `/admin/audit-logs` | Audit Trail | Admin | Activity logging |
| `/admin/integrations` | Integrations | Admin | API integration setup |
| `/admin/settings` | Settings | Admin | System configuration |

**Location:** `app/admin/`

---

### 2. Driver & Field Operations Module
**Documentation:** `docs/modules/02-driver-field-ops.md`

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/(workspace)/field-ops` | Field Ops Dashboard | Driver, Carrier Ops | Delivery management |
| `/(workspace)/field-ops/deliveries` | Delivery Queue | Driver | Active deliveries |
| `/(workspace)/field-ops/pod` | POD Capture | Driver | Proof of delivery |
| `/(workspace)/field-ops/damage` | Damage Reports | Driver | Exception reporting |
| `/(workspace)/field-ops/tracking` | GPS Tracking | Driver | Real-time location |
| `/(workspace)/tracking` | Shipment Tracking | All | Multi-carrier tracking |
| `/(workspace)/exceptions` | Exceptions | Operations Mgr | Exception management |

**Location:** `app/(workspace)/field-ops/` and `app/(workspace)/tracking/`

---

### 3. Financial Operations Module
**Documentation:** `docs/modules/03-financial-operations.md`

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/admin/payments` | Payment Admin | Finance Admin | Payment oversight |
| `/(workspace)/payments` | Payment Processing | Finance Mgr | Invoice & payment mgmt |
| `/(workspace)/payments/invoices` | Invoice Manager | Finance Mgr | Invoice CRUD |
| `/(workspace)/payments/disputes` | Dispute Manager | Finance Mgr | Dispute resolution |
| `/(workspace)/payments/audits` | Invoice Audits | Finance Analyst | Audit trail |
| `/(workspace)/reports` | Financial Reports | Finance Mgr | Report generation |

**Location:** `app/admin/payments/` and `app/(workspace)/payments/`

---

### 4. Analytics & Sustainability Module
**Documentation:** `docs/modules/04-analytics-sustainability.md`

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/(workspace)/analytics` | Analytics Dashboard | Supply Chain Mgr | Analytics overview |
| `/(workspace)/analytics/predictions` | Predictions | Supply Chain Mgr | ML predictions |
| `/(workspace)/analytics/cost` | Cost Analysis | Finance Mgr | Cost optimization |
| `/(workspace)/analytics/sustainability` | Sustainability | Ops Manager | Carbon tracking |
| `/(workspace)/intelligence` | Intelligence Hub | Supply Chain Mgr | Insights & signals |

**Location:** `app/(workspace)/analytics/` and `app/(workspace)/intelligence/`

---

### 5. Logistics Intelligence Module
**Documentation:** `docs/modules/05-logistics-intelligence.md`

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/(workspace)/intelligence` | Intelligence Dashboard | Logistics Mgr | Analytics hub |
| `/(workspace)/intelligence/scorecards` | Carrier Scorecards | Logistics Mgr | Performance metrics |
| `/(workspace)/intelligence/reports` | Custom Reports | Logistics Mgr | Report builder |
| `/(workspace)/reports` | Reports | All | Pre-built reports |
| `/(workspace)/reports/carriers` | Carrier Reports | Logistics Mgr | Carrier analysis |
| `/(workspace)/reports/shipments` | Shipment Reports | All | Shipment analytics |
| `/(workspace)/rates` | Rate Shopping | Supply Chain Mgr | Rate comparison |
| `/(workspace)/carriers` | Carrier Management | Logistics Mgr | Carrier CRUD |
| `/(workspace)/scorecards` | Scorecards | All | Performance dashboards |

**Location:** `app/(workspace)/intelligence/`, `app/(workspace)/reports/`, `app/(workspace)/scorecards/`

---

## API Endpoints by Module

### Admin & Security Endpoints
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/audit-logs
GET    /api/admin/integrations
```

### Driver & Field Ops Endpoints
```
GET    /api/shipments
POST   /api/shipments/:id/tracking-event
POST   /api/shipments/:id/delivery-proof
POST   /api/shipments/:id/damage-report
GET    /api/tracking/live/:shipment-id
```

### Financial Operations Endpoints
```
GET    /api/invoices
POST   /api/invoices
PUT    /api/invoices/:id
GET    /api/invoices/:id/audit
POST   /api/payments
GET    /api/payments/:id
```

### Analytics Endpoints
```
GET    /api/predictions/delay
GET    /api/predictions/overcharge
GET    /api/analytics/cost-analysis
GET    /api/analytics/sustainability
```

### Intelligence Endpoints
```
GET    /api/intelligence/signals
GET    /api/intelligence/scorecards
GET    /api/intelligence/reports
GET    /api/intelligence/forecasts
```

---

## URL Structure Rules

1. **Admin Routes:** Prefix with `/admin`
   - Platform-wide settings
   - User management
   - System configuration

2. **Workspace Routes:** Use `/(workspace)` layout
   - Company-scoped functionality
   - Role-based access
   - Workspace-specific data

3. **API Routes:** Follow REST conventions
   - Resources as nouns
   - HTTP methods for actions
   - Nested for relationships

4. **Naming Conventions:**
   - Use kebab-case for URLs
   - Use snake_case for API parameters
   - Use camelCase for component names

---

## Navigation Menu Structure

### For Admin Users
```
Admin
├── Dashboard
├── Users & Roles
├── Audit Logs
├── Integrations
└── Settings
```

### For Supply Chain Manager (workspace)
```
Dashboard
├── Shipments & Tracking
├── Field Operations
├── Analytics & Intelligence
├── Carriers & Rates
└── Reports
```

### For Finance Manager (workspace)
```
Dashboard
├── Payments & Invoices
├── Disputes & Audits
├── Analytics
└── Reports
```

### For Driver (workspace)
```
Field Operations
├── My Deliveries
├── POD Capture
├── Damage Reports
└── Tracking
```

---

## Quick Reference

| Module | Main Path | Sub-paths | Roles |
|--------|-----------|-----------|-------|
| **Admin** | `/admin` | users, roles, audit-logs, integrations | Platform Admin |
| **Driver/Field Ops** | `/(workspace)/field-ops` | tracking, exceptions, dashboard | Driver, Ops Manager |
| **Finance** | `/(workspace)/payments` | invoices, disputes, audits, reports | Finance Manager |
| **Analytics** | `/(workspace)/analytics` | predictions, cost, sustainability | Supply Chain Mgr |
| **Intelligence** | `/(workspace)/intelligence` | scorecards, reports, forecasts | Logistics Mgr |

