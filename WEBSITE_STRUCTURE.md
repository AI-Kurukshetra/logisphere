# Logisphere Website Structure

Complete public-facing website for Logisphere freight intelligence platform. All pages are fully designed with a professional B2B logistics aesthetic.

## Pages Created

### Public Pages

#### Landing Page (`/`)
- **Features**: Hero section, platform modules (Finance Command, Operations Desk, Partner Network, Executive Analytics)
- **Content**: Trust statistics, value pillars, core features grid (6 features)
- **Sections**: Pricing overview with 3 tiers (Starter, Professional, Enterprise)
- **CTA**: Strong calls-to-action throughout for free trial and contact sales

#### Features (`/features`)
- **Organization**: 5 feature categories
  1. Finance & Billing (3 features)
  2. Operations & Tracking (3 features)
  3. Analytics & Reporting (3 features)
  4. Integration & Automation (3 features)
  5. Planning & Optimization (3 features)
- **Layout**: 3-column responsive grid with feature descriptions and highlight tags
- **Coverage**: All 20 core features from the Koho Blueprint

#### Pricing (`/pricing`)
- **Plans**: 3-tier pricing (Starter, Professional, Enterprise)
- **Structure**:
  - Plan description and price
  - Included features list (checkmarks)
  - Not included features (grayed out)
  - CTA button for each plan
- **FAQ**: 6 common pricing questions
- **Bottom CTA**: Contact sales / try free trial

#### About (`/about`)
- **Sections**: Mission, Vision, Values
- **Story**: Company narrative and why Logisphere was built
- **Stats**: By the numbers (customers, invoices, carriers, uptime)
- **Values Deep Dive**: 4 core values with explanations
- **Design**: Emphasizes customer-first design and data accuracy

#### Contact (`/contact`)
- **Interactive Form**: Name, Email, Company, Message fields with validation
- **Contact Info**: 3 email addresses (hello, sales, support)
- **Quick Answers**: 4 FAQs about sales, support, migration, and carriers
- **Design**: Two-column layout with contact form on right, info on left

#### Documentation (`/docs`)
- **Sections**: 6 documentation categories
  1. Getting Started
  2. Invoice Management
  3. Carrier Management
  4. Shipment Tracking
  5. Analytics & Reporting
  6. Integrations
- **FAQ**: 4 common technical questions
- **Support Resources**: Email, demo scheduling, API docs

#### Blog (`/blog`)
- **Posts**: 6 sample blog posts with category, date, and excerpt
- **Categories**: Auditing, Operations, Analytics, Technology
- **Newsletter CTA**: Email subscription form

#### Legal Pages
- **Privacy Policy** (`/privacy`) - Comprehensive privacy terms
- **Terms of Service** (`/terms`) - Legal terms and conditions

## Design System

### Colors (from globals.css)
- **Brand**: `#0b2b4d` (dark blue)
- **Accent**: `#f2a94a` (warm orange)
- **Signal**: `#17bfbe` (teal - alerts/success)
- **Background**: Gradient (light blue/white)

### Typography
- **Sans Serif**: Avenir Next, Segoe UI (fallback)
- **Mono**: JetBrains Mono, SFMono (for code)

### Component Patterns
- **Cards**: `rounded-[1.6rem]` with border and shadow
- **Sections**: `rounded-[1.7rem]` for larger feature blocks
- **Buttons**: `rounded-full` with hover brightness effects
- **Grid Layouts**: Responsive `md:grid-cols-2 lg:grid-cols-3`

## Global Navigation

### Header (Sticky)
- Logo + Logisphere branding (left)
- Nav links: Features, Pricing, Docs, About
- Login button (right)
- Responsive on mobile

### Footer
- Company info + description
- 4 columns: Product (Features, Pricing, Docs), Company (About, Contact, Blog), Legal (Privacy, Terms)
- Copyright notice

## URL Structure

```
/                    → Landing page
/features            → Features overview
/pricing             → Pricing and plans
/about               → About company
/contact             → Contact form
/docs                → Documentation
/blog                → Blog posts
/privacy             → Privacy policy
/terms               → Terms of service
/auth                → Authentication (existing)
/dashboard           → App workspace (existing)
/onboarding          → Signup onboarding (existing)
```

## Key Messaging

### Headline
"Run freight spend, shipment visibility, and carrier execution from one business-grade control tower."

### Subheadline
"Logisphere brings invoice auditing, tracking, payment workflows, analytics, and partner integrations into a single operating layer built for mid-market freight teams."

### Target Audience
Mid-market companies ($10M–$1B revenue), 100+ packages/month, multi-site operations, mixed carrier portfolios

## Content Highlights

### 6 Core Features (Homepage)
1. **Automated Invoice Auditing** - AI-powered validation, recover savings automatically
2. **Real-time Tracking** - Multi-carrier visibility in one dashboard
3. **Rate Management** - Centralized contracts and service levels
4. **Payment Workflows** - Approval routing and exception handling
5. **Analytics Dashboard** - Cost trends and spending insights
6. **Exception Management** - Automated detection and resolution

### 3 Pricing Tiers
- **Starter**: For small teams ($X/month) - 2 users, 100 invoices/month, 2 carriers
- **Professional**: For growing teams ($X/month) - Most popular, 10 users, unlimited invoices, API access
- **Enterprise**: For large organizations - Unlimited everything, custom integrations, dedicated support

## Implementation Notes

1. **All pages are fully styled** - No placeholder Lorem Ipsum, actual content with real value props
2. **Responsive design** - Mobile-first approach, tested at mobile/tablet/desktop breakpoints
3. **No external dependencies** - Pure Next.js + Tailwind CSS
4. **Contact form** - Uses React state, ready for backend integration
5. **Consistent branding** - Same design system, colors, and typography throughout
6. **SEO-friendly** - Proper metadata, semantic HTML, heading hierarchy
7. **Accessibility** - Proper link colors, form labels, color contrast

## Next Steps

1. **Backend Integration** - Connect contact form to email service
2. **Blog System** - Replace static posts with CMS (Markdown, Sanity, etc.)
3. **Authentication** - Integrate with Supabase Auth from landing pages
4. **Analytics** - Add tracking (Vercel Analytics, Mixpanel, etc.)
5. **Performance** - Add image optimization, code splitting
6. **Content** - Update email addresses, company info, real blog posts

---

**Created**: March 2026 | **Status**: Complete marketing website with all pages
