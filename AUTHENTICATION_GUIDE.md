# Authentication & User Management Guide

## Overview

Logisphere now features a complete authentication system with:
- **User sign-up with role selection**
- **Role-based access control** (4 predefined roles)
- **Admin sign-in module** with dedicated dashboard
- **Active page indicators** across the website

---

## 1. User Registration (Standard Users)

### Location
**URL:** `/auth`

### Registration Flow

Users can sign up with three methods:

#### a) **Standard Sign-up** (Default Tab)
1. Click "Create Account" tab
2. Enter:
   - Full Name
   - Work Email
   - **Role Selection** (new!) - Choose from:
     - 👨‍💼 **Administrator** - Full platform access, user management, settings
     - 💰 **Finance Manager** - Invoice auditing, payments, approval workflows
     - 📦 **Operations Manager** - Shipment tracking, carrier management, exceptions
     - 👁️ **Viewer** - Read-only access to dashboards and reports
   - Password (minimum 6 characters)
3. Click "Create Account"
4. User is added to workspace dashboard

#### b) **Magic Link Sign-up**
1. Click "Magic Link" tab
2. Enter work email
3. Click "Send Magic Link"
4. User receives email with sign-in link
5. Click link to verify and access dashboard

#### c) **Sign In** (Existing Users)
1. Click "Sign In" tab (default)
2. Enter:
   - Work Email
   - Password
3. Click "Sign In"

---

## 2. Admin Sign-In Module

### Location
**URL:** `/admin/login`

### Access Points
- Direct link: `/admin/login`
- From user login page: Click "Admin Sign In →" at bottom
- From header (when implemented): Admin console link

### Admin Login Flow

1. Enter admin credentials:
   - Admin Email
   - Admin Password
2. Click "Sign In as Admin"
3. Redirected to `/admin/dashboard`

### Security Features
- 🔒 Restricted access (admin credentials required)
- 📊 All access is logged and monitored
- 🔐 Activity audit trail tracking

---

## 3. Admin Dashboard

### Location
**URL:** `/admin/dashboard`

### Admin Capabilities

The admin console provides control over:

#### **User Management**
- Create, edit, and manage user accounts
- Assign and modify user roles
- Manage permissions and access control

#### **Workspace Management**
- Create and manage organizations
- Manage teams and team memberships
- Handle subscriptions and billing

#### **Security & Access**
- Configure API keys and tokens
- Manage SSO (Single Sign-On) settings
- Audit access logs and permissions

#### **Integrations**
- Configure webhooks
- Set up API endpoints
- Manage third-party connections (ERP, WMS, TMS)

#### **Analytics & Monitoring**
- View platform analytics
- Monitor activity logs
- Access audit trails

#### **System Configuration**
- Email template customization
- Notification settings
- System preferences

### Dashboard Sections

1. **Stats Overview**
   - Total Users
   - Active Workspaces
   - System Health (99.9% uptime)
   - Monthly API Calls

2. **System Modules** (6 main areas)
   - Status indicators (Operational, Maintenance, Error)
   - Quick management links
   - Description of each module

3. **Recent Activity Feed**
   - User actions
   - Workspace changes
   - Integration updates
   - Timestamps for audit trail

4. **Quick Actions**
   - Create User button
   - Create Workspace button
   - View System Logs button

---

## 4. Active Page Indicators

### Navigation Highlighting

Each page now displays which section you're viewing:

**Example: Features Page**
- "Features" link in navigation: **Highlighted in orange** (`bg-[color:var(--accent)]/10`)
- Other pages (Pricing, About, Docs): Normal text styling

**Visual Indicator**
- Active page: Orange background + orange text
- Inactive pages: Gray text with hover effect

### Pages with Active Indicators
- ✓ Landing Page (`/`)
- ✓ Features (`/features`)
- ✓ Pricing (`/pricing`)
- ✓ About (`/about`)
- ✓ Contact (`/contact`)
- ✓ Docs (`/docs`)
- ✓ Blog (`/blog`)

---

## 5. User Roles & Permissions

### Role Definitions

#### 1. **Administrator** 👨‍💼
- Full platform access
- User account management
- System configuration
- Role assignment
- Billing & subscription management
- Integration setup

#### 2. **Finance Manager** 💰
- Invoice auditing and management
- Payment processing
- Approval workflows
- Dispute management
- Financial analytics
- Budget planning
- Cannot: Manage users, change system settings

#### 3. **Operations Manager** 📦
- Shipment tracking
- Carrier management
- Exception handling
- Rate management
- Performance monitoring
- Operational dashboards
- Cannot: Process payments, manage users

#### 4. **Viewer** 👁️
- Read-only access to dashboards
- View analytics and reports
- Cannot: Create records, process payments, modify settings

---

## 6. Authentication Flow Architecture

```
Landing Page (/)
    ↓
User clicks "Launch Platform"
    ↓
    ├─→ /auth (User Sign-up/Sign-in)
    │   ├─→ Standard Sign-up (Email + Role + Password)
    │   ├─→ Magic Link (Email only)
    │   └─→ Sign In (Email + Password)
    │
    └─→ /admin/login (Admin Sign-in)
        ├─→ Admin Email + Password
        └─→ /admin/dashboard

After Authentication:
    ├─→ /dashboard (User workspace)
    └─→ /admin/dashboard (Admin console)
```

---

## 7. Implementation Notes

### Current Status
- ✅ User sign-up with role selection
- ✅ Admin login page (UI complete)
- ✅ Admin dashboard (UI complete)
- ✅ Active page indicators
- ⏳ Backend authentication (Supabase integration pending)
- ⏳ Admin authentication (Backend implementation pending)
- ⏳ Role-based access control (Backend implementation pending)

### Next Steps
1. **Connect to Supabase Auth**
   - Store user roles in `profiles` table
   - Implement role-based RLS policies

2. **Implement Admin Authentication**
   - Create admin user verification
   - Set up admin-only middleware
   - Add audit logging

3. **Role-Based Access Control**
   - Add role checks to dashboard routes
   - Implement permission middleware
   - Restrict features by role

4. **Session Management**
   - Implement JWT/session tokens
   - Add logout functionality
   - Handle token refresh

---

## 8. How to Register Different Users

### For Testing Purposes

**Current Demo Mode:**
- Any email format (work email)
- Any password (6+ characters)
- Choose any role from dropdown

**User Types to Create:**

1. **Administrator**
   - Role: Administrator
   - Access: `/admin/login`, `/admin/dashboard`

2. **Finance Manager**
   - Role: Finance Manager
   - Access: Invoice auditing, payments, analytics

3. **Operations Manager**
   - Role: Operations Manager
   - Access: Shipment tracking, carrier management

4. **Viewer**
   - Role: Viewer
   - Access: Read-only dashboards, reports

---

## 9. Quick Links

| Feature | URL | Type |
|---------|-----|------|
| User Sign-up/Login | `/auth` | Public |
| Admin Sign-in | `/admin/login` | Admin-only |
| Admin Dashboard | `/admin/dashboard` | Admin-only |
| User Workspace | `/dashboard` | Authenticated |
| Features Page | `/features` | Public |
| Pricing Page | `/pricing` | Public |
| About Page | `/about` | Public |

---

## 10. Security Considerations

✅ **Implemented:**
- Role-based navigation indicators
- Separate admin login interface
- Demo credentials for testing
- Activity tracking structure

⏳ **To Implement:**
- Password hashing and encryption
- Session security (HTTP-only cookies)
- Rate limiting on auth endpoints
- Email verification for new accounts
- Admin audit logging
- CSRF protection
- OAuth/SSO integration (optional)

---

## 11. UI/UX Features

### Visual Design
- Consistent brand colors (Navy #0b2b4d, Orange #f2a94a)
- Responsive layouts (mobile-first)
- Smooth transitions and hover effects
- Clear error messaging
- Success confirmation feedback

### Accessibility
- Proper form labels
- Color contrast compliance
- Keyboard navigation support
- ARIA labels where needed
- Clear focus states

---

## 12. File Structure

```
app/
├── auth/
│   └── page.tsx          # User login/signup
├── admin/
│   ├── login/
│   │   └── page.tsx      # Admin login
│   └── dashboard/
│       └── page.tsx      # Admin control center
├── page.tsx              # Landing page (updated)
├── features/
│   └── page.tsx          # Features page
├── pricing/
│   └── page.tsx          # Pricing page
├── about/
│   └── page.tsx          # About page
└── _components/
    └── page-nav.tsx      # Navigation with active indicators
```

---

*Last updated: March 2026 | Authentication system v1.0*
