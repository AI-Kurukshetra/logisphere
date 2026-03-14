# Admin & Security Module - Detailed Specifications

## Module Overview
**Purpose:** Govern platform access, manage users/roles, enforce security policies, track all administrative actions
**Status:** Foundation Layer (Sprint 1)
**Priority:** Critical

---

## 1. Role-Based Access Control (RBAC) System

### Role Hierarchy

```
┌─────────────────────────────────────────────┐
│          PLATFORM ADMIN                     │
│  (Full system access, user management)      │
└─────────────────────────────────────────────┘
              ↓
┌──────────────────┬─────────────────┬────────────────┐
│   WORKSPACE      │   FINANCE       │   OPERATIONS   │
│   ADMIN          │   MANAGER       │   MANAGER      │
│                  │                 │                │
│ - User mgmt      │ - Invoice audit │ - Tracking     │
│ - Role assign    │ - Payments      │ - Exceptions   │
│ - Integrations   │ - Disputes      │ - Carriers     │
└──────────────────┴─────────────────┴────────────────┘
              ↓
┌──────────────────┬─────────────────┬────────────────┐
│   FINANCE        │   LOGISTICS     │   VIEWER       │
│   ANALYST        │   COORDINATOR   │                │
│                  │                 │                │
│ - View invoices  │ - Create orders │ - Read-only    │
│ - View audits    │ - Track ship    │ - Dashboards   │
│ - Export data    │ - Contact carr. │ - Reports      │
└──────────────────┴─────────────────┴────────────────┘
```

### Permissions Matrix

| Feature | Admin | Workspace Admin | Finance Mgr | Operations Mgr | Analyst | Coordinator | Viewer |
|---------|-------|-----------------|-------------|----------------|---------|-------------|--------|
| User Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Role Assignment | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create Invoice | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Audit Invoice | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Process Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Shipment | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| View Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Integrations | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Database Schema - RBAC Tables

```sql
-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  resource VARCHAR(100),          -- "invoices", "users", "shipments", etc.
  action VARCHAR(50),             -- "create", "read", "update", "delete"
  description TEXT,
  created_at TIMESTAMP
);

-- Role-Permission Mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);

-- User-Role Assignment
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role_id UUID REFERENCES roles(id),
  workspace_id UUID,
  assigned_at TIMESTAMP,
  assigned_by UUID,
  UNIQUE(user_id, workspace_id, role_id)
);
```

---

## 2. Audit Trail System

### Audit Logging Architecture

Every administrative action is logged with:
- **Action Type:** create, update, delete, approve, deny
- **Resource:** users, roles, invoices, payments, etc.
- **Actor:** Who performed the action (user_id)
- **Timestamp:** When action occurred
- **IP Address:** Source of request
- **Changes:** Before/after values (for updates)
- **Status:** Success/failure with error message

### Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  action_type VARCHAR(50),         -- "create", "update", "delete"
  resource_type VARCHAR(100),      -- "invoice", "payment", "user"
  resource_id UUID,
  actor_id UUID REFERENCES auth.users(id),
  actor_email VARCHAR(255),
  actor_ip_address INET,
  changes JSONB,                   -- { before: {}, after: {} }
  status VARCHAR(20),              -- "success", "failed"
  error_message TEXT,
  metadata JSONB,                  -- Additional context
  created_at TIMESTAMP,
  INDEX(workspace_id, created_at),
  INDEX(resource_type, resource_id),
  INDEX(actor_id)
);
```

### Audit Trail Queries

```typescript
// Get all actions by user in date range
SELECT * FROM audit_logs
WHERE actor_id = $1
AND created_at BETWEEN $2 AND $3
ORDER BY created_at DESC;

// Get all changes to specific resource
SELECT * FROM audit_logs
WHERE resource_type = $1 AND resource_id = $2
ORDER BY created_at DESC;

// Get actions by type (e.g., all deletions)
SELECT * FROM audit_logs
WHERE action_type = 'delete'
AND created_at > now() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

## 3. Multi-Location Management (Hierarchical)

### Location Hierarchy Model

```
Company (Root)
  ├── Region 1
  │   ├── Facility A (Warehouse)
  │   ├── Facility B (Distribution Center)
  │   └── Business Unit 1
  └── Region 2
      ├── Facility C (Hub)
      └── Business Unit 2
```

### Database Schema

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  industry VARCHAR(100),
  revenue_range VARCHAR(50),
  subscription_tier VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE regions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100),
  country_code CHAR(2),
  timezone VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE facilities (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  region_id UUID REFERENCES regions(id),
  name VARCHAR(255),
  facility_type VARCHAR(50),        -- "warehouse", "hub", "distribution"
  address JSONB,                    -- { street, city, state, zip, country }
  coordinates JSONB,                -- { lat, lng }
  capacity_units INT,
  active BOOLEAN,
  created_at TIMESTAMP,
  INDEX(company_id),
  INDEX(region_id)
);

CREATE TABLE business_units (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  parent_unit_id UUID REFERENCES business_units(id),
  name VARCHAR(255),
  description TEXT,
  budget_allocation DECIMAL(15,2),
  created_at TIMESTAMP,
  INDEX(company_id),
  INDEX(parent_unit_id)
);

CREATE TABLE facility_assignments (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id),
  business_unit_id UUID REFERENCES business_units(id),
  UNIQUE(facility_id, business_unit_id)
);
```

---

## 4. API Integration Hub

### Integration Registry

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  name VARCHAR(255),               -- "SAP ERP", "Blue Yonder WMS"
  type VARCHAR(50),                -- "erp", "wms", "tms", "payment"
  status VARCHAR(20),              -- "active", "inactive", "error"
  config JSONB,                    -- API credentials (encrypted)
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50),         -- "success", "failed", "in_progress"
  error_message TEXT,
  created_at TIMESTAMP
);

CREATE TABLE integration_events (
  id UUID PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id),
  event_type VARCHAR(50),          -- "sync_start", "sync_complete", "error"
  payload JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP
);
```

### Supported Integrations

**ERP Systems:**
- SAP (REST API)
- Oracle NetSuite
- Microsoft Dynamics
- Custom SOAP/REST

**WMS Systems:**
- Blue Yonder
- Manhattan Associates
- Kinaxis
- Custom REST

**Payment Gateways:**
- Stripe
- PayPal
- ACH/Wire transfer

**Carrier APIs:**
- FedEx tracking & rates
- UPS tracking & rates
- Generic SFTP file exchange

---

## 5. Security Features

### Authentication
- Supabase Auth (email/password + magic link)
- MFA (optional, via authenticator app)
- Session management with JWT

### Encryption
- Passwords: bcrypt (Supabase handles)
- API keys: AES-256 in Supabase Vault
- Data in transit: TLS 1.2+

### Authorization
- Row Level Security (RLS) at database
- API middleware role checks
- UI component-level role guards

### Compliance
- GDPR: Data retention policies
- SOC 2: Audit logging
- PCI DSS: Payment card handling (via Stripe)

---

## 6. Admin Dashboard Features

### User Management Section
- List all users with role, status, last login
- Create new users (email + role)
- Edit user roles and permissions
- Deactivate/reactivate users
- View user activity (audit logs)
- Export user report

### Workspace Management
- Configure multi-location hierarchy
- Set facility details and contacts
- Manage business units
- Assign users to locations

### Integration Management
- List active integrations with status
- Add new integrations (API credential form)
- Test connection
- View sync logs
- Edit sync schedule

### Audit Trail Viewer
- Search by user, action, date range
- View change history (before/after)
- Export audit logs
- Alert on suspicious activities

### Security Settings
- Password policy configuration
- IP whitelist (optional)
- Session timeout
- MFA enforcement
- API key management

---

## 7. API Endpoints

### User Management
```
GET    /api/admin/users                      # List users
POST   /api/admin/users                      # Create user
PUT    /api/admin/users/:id                  # Update user
DELETE /api/admin/users/:id                  # Deactivate user
GET    /api/admin/users/:id/audit-logs       # User activity
POST   /api/admin/users/:id/roles            # Assign role
DELETE /api/admin/users/:id/roles/:role-id   # Remove role
```

### Audit Logs
```
GET    /api/admin/audit-logs                 # List audit logs (with filters)
GET    /api/admin/audit-logs/:id             # Get single audit
GET    /api/admin/audit-logs/export          # Export audit trail
```

### Integrations
```
GET    /api/admin/integrations               # List integrations
POST   /api/admin/integrations               # Create integration
PUT    /api/admin/integrations/:id           # Update integration
DELETE /api/admin/integrations/:id           # Remove integration
POST   /api/admin/integrations/:id/test      # Test connection
GET    /api/admin/integrations/:id/logs      # View sync logs
```

### Multi-Location
```
GET    /api/admin/locations                  # Get location hierarchy
POST   /api/admin/regions                    # Create region
POST   /api/admin/facilities                 # Create facility
POST   /api/admin/business-units             # Create business unit
```

---

## 8. Implementation Roadmap

**Sprint 1 (Weeks 1-2):**
- ✅ RBAC database schema
- ✅ Basic role creation & assignment
- ✅ Audit logging infrastructure
- ✅ Multi-location tables

**Sprint 2 (Weeks 3-4):**
- API endpoints for user management
- Audit logs UI viewer
- Integration registry
- Location hierarchy UI

**Sprint 3 (Weeks 5-6):**
- Admin dashboard
- User management interface
- Audit trail search/export
- Integration marketplace

---

## 9. Security Checklist

- [ ] All admin endpoints require platform admin role
- [ ] Sensitive actions trigger audit logging
- [ ] API keys encrypted at rest
- [ ] Rate limiting on auth endpoints
- [ ] CORS properly configured
- [ ] CSRF tokens on state-changing requests
- [ ] Input validation on all forms
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output escaping)
- [ ] Regular security audits scheduled

---

## 10. Monitoring & Alerts

**Alert On:**
- Multiple failed login attempts (>5 in 5 min)
- User created/deleted outside normal hours
- Role permission changes
- Integration sync failures
- Unauthorized access attempts
- Database backup failures

**Metrics:**
- Auth success/failure rate
- Average response time for admin endpoints
- Audit log volume (daily)
- Integration sync status
