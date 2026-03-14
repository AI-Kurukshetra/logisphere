# Koho Freight Intelligence Platform - System Architecture

## Overview

**System Name:** Koho
**Type:** Enterprise Freight Intelligence & Audit Suite
**Target Customers:** Mid-market logistics companies ($10M-$1B revenue)
**Architecture Pattern:** Modular, microservices-ready

---

## System-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Admin    │ │Financial │ │Logistics │ │Analytics &       │  │
│  │Security  │ │Operations│ │Intell.   │ │Sustainability    │  │
│  │Dashboard │ │Dashboard │ │Dashboard │ │Dashboard         │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
│              (NextJS API Routes + Middleware)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Authentication │ Authorization │ Rate Limiting │ Logging  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────┬────────┐
│   Admin &        │   Financial      │   Logistics      │Analytics│
│   Security API   │   Operations API │   Intelligence   │API      │
│                  │                  │   API            │         │
└──────────────────┴──────────────────┴──────────────────┴────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Business Logic)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RBAC │ Audit │ Invoice Engine │ Rate Engine │ Tracking   │  │
│  │      │ Trail │ AI Validator   │ Shopping    │ Service    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (ORM/Queries)                    │
│              Supabase Client (TypeScript)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                        │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌────────────────────┐  │
│  │ Core     │ │Financial│ │Logistics│ │Analytics &         │  │
│  │Entities  │ │Tables   │ │Tables   │ │Sustainability      │  │
│  └──────────┘ └─────────┘ └─────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context + Server Components
- **Charts:** Recharts / Tremor
- **Form Validation:** React Hook Form + Zod

### Backend
- **Runtime:** Node.js (Edge Runtime for Vercel)
- **Database:** Supabase (PostgreSQL 15+)
- **Authentication:** Supabase Auth + JWT
- **Cache:** Supabase Realtime + Redis (optional)
- **AI/ML:** Python-based prediction services
- **Job Queue:** Edge Functions or external queue

### Infrastructure
- **Hosting:** Vercel (Frontend + Edge Functions)
- **Database:** Supabase (Managed PostgreSQL)
- **File Storage:** Supabase Storage (S3-compatible)
- **Webhooks:** Supabase Webhooks + Vercel Functions
- **Monitoring:** Vercel Analytics + custom logging

---

## Modular Architecture Pattern

### Module 1: Admin & Security Module
**Purpose:** Platform governance, user management, security
**Key Components:** RBAC, Audit Trails, Multi-location hierarchy, API Integration
**Database:** Users, Roles, Permissions, Audit_Logs, Facilities, Integrations

### Module 2: Financial Operations Module
**Purpose:** Invoice management, payments, financial planning
**Key Components:** Invoice Auditor, Payment Processor, Dispute Manager, Forecasting
**Database:** Invoices, Audits, Payments, Claims, Forecasts, Budget_Plans

### Module 3: Logistics Intelligence Module
**Purpose:** Carrier & shipment management, rate optimization
**Key Components:** Rate Manager, Shipment Tracker, Rate Shopping, Performance Scorer
**Database:** Carriers, Rates, Contracts, Shipments, Routes, Performance_Metrics

### Module 4: Analytics & Sustainability Module
**Purpose:** Reporting, insights, environmental tracking
**Key Components:** Report Builder, Carbon Tracking, Predictive Analytics
**Database:** Reports, Carbon_Footprints, Predictions, Dashboards

---

## Data Flow Pattern

```
User Action
    ↓
API Endpoint (NextJS Route Handler)
    ↓
Middleware (Auth, Validation, Rate Limit)
    ↓
Service Layer (Business Logic)
    ↓
Data Access Layer (Repository Pattern)
    ↓
Supabase/PostgreSQL
    ↓
Response (JSON)
    ↓
Client State Update
    ↓
UI Re-render
```

---

## Security Architecture

### Authentication Flow
```
1. User registers/logs in → Supabase Auth
2. JWT token issued (refresh + access)
3. Token stored in HTTP-only cookie
4. Middleware validates on each request
5. Role-based route protection
6. RLS policies enforce at database level
```

### Authorization Levels
- **Row Level Security (RLS):** Supabase policies
- **API Level:** Route middleware checks
- **UI Level:** Component-level role checks
- **Field Level:** Sensitive field masking

### Audit Trail
- Every action logged with: user, action, timestamp, IP, changes
- Stored in immutable audit_logs table
- Searchable by date range, user, action type

---

## Integration Architecture

### External Integrations
1. **ERP Systems** → REST API adapters
2. **WMS Systems** → Webhook listeners
3. **Carrier APIs** → Normalized connectors
4. **Payment Gateways** → Stripe/PayPal adapters
5. **Email Service** → Resend/SendGrid
6. **Analytics** → Segment / Mixpanel

### Internal Integrations
- Event bus pattern for async operations
- Webhook system for real-time updates
- Cache invalidation on data changes

---

## Deployment Architecture

```
Development (Local)
    ↓
Staging (Vercel Preview)
    ↓
Production (Vercel + Supabase)

Database Migrations:
- Supabase Dashboard (UI)
- Migration files (version control)
- Automated backup (daily)

Environment Management:
- .env.local (local development)
- .env.production (Vercel secrets)
- Feature flags (LaunchDarkly ready)
```

---

## Performance Considerations

### Caching Strategy
- **Client Cache:** React Query / SWR (API responses)
- **Database Cache:** Supabase Edge Functions caching
- **CDN Cache:** Vercel automatic caching
- **Session Cache:** Redis (optional, for large scale)

### Optimization
- Code splitting by module
- Image optimization (next/image)
- API response pagination
- Database query indexes on high-traffic tables
- Compression (gzip on Vercel)

### Scalability
- Horizontal: Multiple Vercel instances
- Vertical: Supabase scaling (compute/storage)
- Async processing: Edge Functions + queues
- Load distribution: Automatic (Vercel)

---

## File Structure

```
logisphere/
├── app/
│   ├── (admin)/              # Admin Module
│   ├── (financial)/          # Financial Module
│   ├── (logistics)/          # Logistics Module
│   ├── (analytics)/          # Analytics Module
│   ├── api/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── financial/
│   │   ├── logistics/
│   │   └── analytics/
│   └── _components/          # Shared components
├── lib/
│   ├── supabase/             # DB client
│   ├── services/             # Business logic
│   │   ├── admin/
│   │   ├── financial/
│   │   ├── logistics/
│   │   └── analytics/
│   ├── utils/                # Helpers
│   └── types/                # TypeScript types
├── types/
│   └── index.ts              # Shared types
├── public/
│   └── data/
└── supabase/
    └── migrations/           # DB migrations
```

---

## Versioning & Changelog

- **API Version:** v1 (endpoints prefixed /api/v1/)
- **Database Version:** Tracked in migrations
- **Frontend Version:** Semantic versioning

---

## Monitoring & Observability

### Logging
- Application logs → Vercel (built-in)
- Database logs → Supabase dashboard
- Error tracking → Sentry (optional)

### Metrics
- Page load time
- API response time
- Error rate
- Database query performance
- User engagement

### Alerts
- High error rate (>5%)
- Slow API endpoints (>2s)
- Database connection issues
- Disk space warnings

---

## Next Documents
1. `ADMIN_SECURITY_MODULE.md` - Detailed specs
2. `FINANCIAL_OPERATIONS_MODULE.md` - Invoice & payment engine
3. `LOGISTICS_INTELLIGENCE_MODULE.md` - Carrier & tracking
4. `ANALYTICS_SUSTAINABILITY_MODULE.md` - Reporting & insights
5. `DATABASE_SCHEMA.md` - Full entity definitions
6. `API_SPECIFICATIONS.md` - Endpoint documentation
