# Logisphare — Database Structure

**Project:** Logisphare (Supabase)  
**Purpose:** Freight Intelligence Platform — logistics analytics & audit suite  
**Auth:** Supabase Auth; app-level data in `public` schema with RLS

---

## Overview

- **Multi-tenant:** Data scoped by `company_id` where applicable; carriers are global per project.
- **Auth:** `auth.users` (Supabase); `public.profiles` extends with `company_id` and `role`.
- **RLS:** Row-level security on all app tables; policies keyed off `auth.uid()` and `profiles.company_id`.

---

## Custom Types (Enums)

| Enum | Values |
|------|--------|
| `shipment_status` | `created`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `exception` |
| `invoice_status` | `pending`, `approved`, `exception`, `paid`, `disputed` |
| `approval_status` | `pending_approval`, `approved`, `rejected` |
| `payment_status` | `pending`, `completed`, `failed`, `cancelled` |
| `dispute_status` | `open`, `resolved` |
| `carrier_status` | `active`, `inactive` |
| `user_role` | `admin`, `manager`, `viewer`, `billing_manager`, `supply_chain_manager`, `drivers_carriers` |

---

## Tables

### 1. `companies`

Tenant/organization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `name` | `text` | NO | — | Company name |
| `slug` | `text` | NO | — | Unique slug (e.g. for URLs) |
| `settings` | `jsonb` | YES | `'{}'` | Feature flags, preferences |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

- **Unique:** `slug`

---

### 2. `profiles`

Extends `auth.users`; links user to company and role.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | — | PK, FK → `auth.users(id)` |
| `email` | `text` | YES | — | Denormalized from auth |
| `full_name` | `text` | YES | — | |
| `avatar_url` | `text` | YES | — | |
| `company_id` | `uuid` | YES | — | FK → `companies(id)` |
| `role` | `user_role` | NO | `'viewer'` | admin, manager, viewer, billing_manager (Finance), supply_chain_manager (Logistics), drivers_carriers (Carrier/Field) |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

- **Unique:** `id` (1:1 with auth.users)

---

### 3. `carriers`

Carrier/master data (global in project; not per-company).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `name` | `text` | NO | — | Carrier name |
| `code` | `text` | YES | — | Short code (e.g. FEDEX, UPS) |
| `contact_email` | `text` | YES | — | |
| `contact_phone` | `text` | YES | — | |
| `status` | `carrier_status` | NO | `'active'` | active, inactive |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

### 4. `contracts`

Contract between a company and a carrier.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `carrier_id` | `uuid` | NO | — | FK → `carriers(id)` |
| `name` | `text` | YES | — | Contract label |
| `terms` | `text` | YES | — | Free-text terms |
| `sla` | `jsonb` | YES | `'{}'` | SLA metrics |
| `effective_from` | `date` | NO | — | |
| `effective_to` | `date` | YES | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

### 5. `rates`

Rate per carrier (and optional contract); used for audit validation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `carrier_id` | `uuid` | NO | — | FK → `carriers(id)` |
| `contract_id` | `uuid` | YES | — | FK → `contracts(id)` |
| `origin_zone` | `text` | YES | — | Origin zone/code |
| `dest_zone` | `text` | YES | — | Dest zone/code |
| `weight_kg_min` | `numeric(12,2)` | YES | — | Weight band min (kg) |
| `weight_kg_max` | `numeric(12,2)` | YES | — | Weight band max (kg) |
| `rate_amount` | `numeric(12,2)` | NO | — | Rate |
| `currency` | `text` | NO | `'USD'` | |
| `effective_from` | `date` | NO | — | |
| `effective_to` | `date` | YES | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

### 6. `facilities`

Locations (warehouses, offices) per company.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `name` | `text` | NO | — | |
| `address` | `jsonb` | YES | `'{}'` | Street, city, country, etc. |
| `type` | `text` | YES | — | warehouse, office, etc. |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

### 7. `shipments`

Shipment record; links to carrier and optional facilities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `carrier_id` | `uuid` | NO | — | FK → `carriers(id)` |
| `tracking_number` | `text` | NO | — | |
| `origin_facility_id` | `uuid` | YES | — | FK → `facilities(id)` |
| `dest_facility_id` | `uuid` | YES | — | FK → `facilities(id)` |
| `status` | `shipment_status` | NO | `'created'` | |
| `shipped_at` | `timestamptz` | YES | — | |
| `delivered_at` | `timestamptz` | YES | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

- **Index:** `(company_id, status)`, `(carrier_id, tracking_number)` unique per company/carrier if desired

---

### 8. `invoices`

Freight invoice; optional link to shipment.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `carrier_id` | `uuid` | NO | — | FK → `carriers(id)` |
| `shipment_id` | `uuid` | YES | — | FK → `shipments(id)` |
| `invoice_number` | `text` | NO | — | Carrier invoice number |
| `amount` | `numeric(12,2)` | NO | — | Total amount |
| `currency` | `text` | NO | `'USD'` | |
| `status` | `invoice_status` | NO | `'pending'` | pending, approved, exception, paid, disputed |
| `approval_status` | `approval_status` | YES | — | pending_approval, approved, rejected |
| `line_items` | `jsonb` | YES | `'[]'` | Line items for audit |
| `due_date` | `date` | YES | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

- **Unique:** `(company_id, carrier_id, invoice_number)` (optional, to avoid duplicates)

---

### 9. `audits`

Per-invoice audit result (one row per rule or one summary row).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `invoice_id` | `uuid` | NO | — | FK → `invoices(id)` ON DELETE CASCADE |
| `rule_name` | `text` | NO | — | e.g. rate_match, duplicate_check |
| `result` | `text` | NO | — | pass, fail |
| `variance_amount` | `numeric(12,2)` | YES | — | Difference if fail |
| `details` | `jsonb` | YES | `'{}'` | Extra context |
| `created_at` | `timestamptz` | NO | `now()` | |

---

### 10. `payments`

Payment against an invoice.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `invoice_id` | `uuid` | NO | — | FK → `invoices(id)` |
| `amount` | `numeric(12,2)` | NO | — | |
| `currency` | `text` | NO | `'USD'` | |
| `status` | `payment_status` | NO | `'pending'` | |
| `paid_at` | `timestamptz` | YES | — | |
| `method` | `text` | YES | — | wire, check, etc. |
| `reference` | `text` | YES | — | External reference |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

### 11. `performance_metrics`

Carrier scorecard metrics per company/carrier/period.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `carrier_id` | `uuid` | NO | — | FK → `carriers(id)` |
| `period_start` | `date` | NO | — | |
| `period_end` | `date` | NO | — | |
| `on_time_rate` | `numeric(5,2)` | YES | — | 0–100 |
| `damage_rate` | `numeric(5,2)` | YES | — | |
| `billing_accuracy` | `numeric(5,2)` | YES | — | 0–100 |
| `score` | `numeric(5,2)` | YES | — | Overall 0–100 |
| `created_at` | `timestamptz` | NO | `now()` | |

- **Unique:** `(company_id, carrier_id, period_start, period_end)` (one row per period)

---

### 12. `alerts`

In-app alerts per company.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `type` | `text` | NO | — | cost_overrun, exception, payment_due, etc. |
| `title` | `text` | NO | — | |
| `message` | `text` | YES | — | |
| `read` | `boolean` | NO | `false` | |
| `metadata` | `jsonb` | YES | `'{}'` | Related entity ids, etc. |
| `created_at` | `timestamptz` | NO | `now()` | |

---

### 13. `reports`

Saved report config/metadata (actual data from queries).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `company_id` | `uuid` | NO | — | FK → `companies(id)` |
| `name` | `text` | NO | — | |
| `type` | `text` | NO | — | spend_by_carrier, audit_summary, etc. |
| `params` | `jsonb` | YES | `'{}'` | Date range, filters |
| `created_at` | `timestamptz` | NO | `now()` | |
| `created_by` | `uuid` | YES | — | FK → `profiles(id)` |

---

### 14. `invoice_disputes`

Dispute on an invoice.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `invoice_id` | `uuid` | NO | — | FK → `invoices(id)` |
| `status` | `dispute_status` | NO | `'open'` | open, resolved |
| `notes` | `text` | YES | — | |
| `resolved_at` | `timestamptz` | YES | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

---

## Relationships (ER)

```
companies 1 —— * profiles
companies 1 —— * contracts * 1 carriers
carriers  1 —— * rates
companies 1 —— * facilities
companies 1 —— * shipments * 1 carriers
companies 1 —— * invoices * 1 carriers, * 0..1 shipments
invoices  1 —— * audits
invoices  1 —— * payments
invoices  1 —— * invoice_disputes
companies 1 —— * performance_metrics * 1 carriers
companies 1 —— * alerts
companies 1 —— * reports
```

---

## Row-Level Security (RLS)

- **All tables:** RLS enabled; policies use `auth.uid()` and, where applicable, `profiles.company_id`.
- **companies:** User can read/update only their own company (via `profiles.company_id`).
- **profiles:** User can read/update own row; admin can read/update same company.
- **carriers:** Read for all authenticated; insert/update/delete for admin (or service role).
- **contracts, rates, facilities, shipments, invoices, audits, payments, performance_metrics, alerts, reports, invoice_disputes:** Scoped by `company_id`; user sees only rows for their `profiles.company_id`; write rules by role (e.g. manager can insert/update, viewer read-only).

---

## Indexes (recommended)

- `companies(slug)` unique
- `profiles(company_id)`, `profiles(id)` unique
- `contracts(company_id)`, `contracts(carrier_id)`
- `rates(carrier_id)`, `rates(effective_from, effective_to)`
- `facilities(company_id)`
- `shipments(company_id)`, `shipments(carrier_id)`, `shipments(status)`, `shipments(tracking_number)`
- `invoices(company_id)`, `invoices(carrier_id)`, `invoices(status)`, `invoices(created_at)`
- `audits(invoice_id)`
- `payments(invoice_id)`
- `performance_metrics(company_id, carrier_id, period_start)`
- `alerts(company_id, read, created_at)`
- `reports(company_id)`
- `invoice_disputes(invoice_id)`

---

## Triggers (optional)

- `updated_at`: set on `companies`, `profiles`, `carriers`, `contracts`, `rates`, `facilities`, `shipments`, `invoices`, `payments`, `invoice_disputes` via `before update` trigger calling a shared `set_updated_at()`.
- **Profile creation:** On `auth.users` insert, insert into `public.profiles(id, email)` (e.g. via Supabase Auth hook or `auth.users` trigger + `security definer` function).

---

## Applied Migrations (Supabase project: logisphare)

Migrations applied via Supabase MCP in this order:

1. `create_custom_types` — Enums: shipment_status, invoice_status, approval_status, payment_status, dispute_status, carrier_status, user_role  
2. `create_companies` — companies table + index  
3. `create_profiles` — profiles table, FK to auth.users + companies; trigger `on_auth_user_created` → `handle_new_user()`  
4. `create_carriers` — carriers table  
5. `create_contracts` — contracts table + indexes  
6. `create_rates` — rates table + indexes  
7. `create_facilities` — facilities table + index  
8. `create_shipments` — shipments table + indexes  
9. `create_invoices` — invoices table + indexes  
10. `create_audits` — audits table + index  
11. `create_payments` — payments table + index  
12. `create_performance_metrics` — performance_metrics table + unique + index  
13. `create_alerts` — alerts table + index  
14. `create_reports` — reports table + index  
15. `create_invoice_disputes` — invoice_disputes table + index  
16. `create_updated_at_trigger` — `set_updated_at()` + triggers on all tables with `updated_at`  
17. `enable_rls_policies` — RLS enabled + initial policies  
18. `rls_insert_policies` — Explicit SELECT/INSERT/UPDATE/DELETE policies for company-scoped tables and rates  
19. `rls_audits_payments_disputes` — Explicit RLS for audits, payments, invoice_disputes  

---

*Document drives Supabase migrations for project **logisphare**.*
