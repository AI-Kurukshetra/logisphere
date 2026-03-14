# Financial Operations Module - Detailed Specifications

## Module Overview
**Purpose:** Invoice auditing, payment processing, dispute resolution, budget planning
**Status:** Core Feature (Sprints 3-5)
**Priority:** Critical - Revenue driver

---

## 1. AI-Powered Freight Invoice Auditing Engine

### Audit Rules Engine

```
Invoice Received
    ↓
├─ Rule 1: Rate Validation
│  └─ Compare billed rate vs contracted rate
│     └─ Flag: OVERCHARGE if > 5% variance
│
├─ Rule 2: Duplicate Detection
│  └─ Check invoice number + date + amount
│     └─ Flag: DUPLICATE if match found in 90-day window
│
├─ Rule 3: Service Level Validation
│  └─ Verify billed service matches shipment SLA
│     └─ Flag: SERVICE_MISMATCH if doesn't match
│
├─ Rule 4: Accessorial Charges
│  └─ Validate each charge against contract
│     └─ Flag: UNAUTHORIZED_CHARGE if not in contract
│
├─ Rule 5: Quantity/Weight Verification
│  └─ Compare billed weight/units vs shipment
│     └─ Flag: QUANTITY_MISMATCH if variance > 2%
│
└─ Rule 6: Contract Compliance
   └─ Verify invoice terms match active contract
      └─ Flag: CONTRACT_EXPIRED if contract ended
```

### Database Schema

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  carrier_id UUID REFERENCES carriers(id),
  shipment_id UUID REFERENCES shipments(id),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  amount DECIMAL(15,2),
  currency VARCHAR(3),
  line_items JSONB,                -- Array of line items
  status VARCHAR(50),              -- "received", "auditing", "approved", "exception"
  audit_status VARCHAR(50),        -- "pending", "passed", "failed"
  exception_reason TEXT,
  document_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(company_id),
  INDEX(carrier_id),
  INDEX(status)
);

CREATE TABLE audit_results (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  audit_rule_id UUID REFERENCES audit_rules(id),
  rule_name VARCHAR(255),
  passed BOOLEAN,
  variance_amount DECIMAL(15,2),
  variance_percent DECIMAL(5,2),
  exception_code VARCHAR(50),
  details JSONB,
  audited_by VARCHAR(255),         -- "system" or user_id
  audited_at TIMESTAMP,
  INDEX(invoice_id)
);

CREATE TABLE audit_rules (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  name VARCHAR(255),
  description TEXT,
  rule_type VARCHAR(50),           -- "rate", "duplicate", "service", etc.
  condition_logic JSONB,           -- Rule definition
  severity VARCHAR(20),            -- "warning", "critical"
  enabled BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE audit_overrides (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  audit_result_id UUID REFERENCES audit_results(id),
  override_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  override_amount DECIMAL(15,2),
  approved_at TIMESTAMP
);
```

### Audit Engine Logic (TypeScript)

```typescript
interface InvoiceAuditRequest {
  invoiceId: string;
  carrierId: string;
  shipmentId: string;
  amount: number;
  lineItems: LineItem[];
}

interface AuditResult {
  passed: boolean;
  exceptions: AuditException[];
  totalVariance: number;
  savings: number;
}

interface AuditException {
  code: string;
  rule: string;
  severity: "warning" | "critical";
  variance: number;
  message: string;
}

// Pseudocode
async function auditInvoice(invoice: InvoiceAuditRequest): AuditResult {
  const results = [];

  // 1. Rate validation
  const rateCheck = await validateRate(invoice);
  if (rateCheck.failed) results.push(rateCheck.exception);

  // 2. Duplicate detection
  const dupCheck = await checkDuplicate(invoice);
  if (dupCheck.isDuplicate) results.push(dupCheck.exception);

  // 3. Service level validation
  const slaCheck = await validateServiceLevel(invoice);
  if (slaCheck.failed) results.push(slaCheck.exception);

  // 4. Accessorial validation
  const accessCheck = await validateAccessorials(invoice);
  results.push(...accessCheck.exceptions);

  // 5. Quantity/weight check
  const qtyCheck = await validateQuantity(invoice);
  if (qtyCheck.failed) results.push(qtyCheck.exception);

  // 6. Contract compliance
  const contractCheck = await validateContract(invoice);
  if (contractCheck.failed) results.push(contractCheck.exception);

  // Calculate savings
  const savings = results.reduce((sum, r) => sum + r.variance, 0);

  return {
    passed: results.length === 0,
    exceptions: results,
    totalVariance: results.length,
    savings: savings
  };
}
```

---

## 2. Payment Processing System

### Payment Workflow

```
Invoice Approved
    ↓
Create Payment Record
    ↓
Apply Approval Rules
    ├─ Check amount threshold
    ├─ Check approval level required
    └─ Route to approver queue
        ↓
    [PENDING APPROVAL]
        ↓
    Approver Reviews
        ↓
    ├─ APPROVE → Mark as approved
    ├─ REJECT → Return to finance team
    └─ REQUEST_CHANGE → Ask for info
        ↓
    [APPROVED]
        ↓
    Process Payment
        ├─ Call payment processor (Stripe/ACH)
        ├─ Record transaction ID
        └─ Update payment status
        ↓
    [PAID]
        ↓
    Send confirmation to carrier
    Update reconciliation
```

### Database Schema

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  company_id UUID REFERENCES companies(id),
  carrier_id UUID REFERENCES carriers(id),
  amount DECIMAL(15,2),
  currency VARCHAR(3),
  status VARCHAR(50),              -- "pending", "approved", "paid", "failed"
  approval_status VARCHAR(50),     -- "pending", "approved", "rejected"
  required_approvers INT,
  approval_level INT,              -- 1, 2, 3 (based on amount)
  payment_method VARCHAR(50),      -- "ach", "wire", "check", "card"
  payment_processor VARCHAR(50),   -- "stripe", "paypal", "custom"
  transaction_id VARCHAR(255),
  scheduled_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(company_id),
  INDEX(status)
);

CREATE TABLE payment_approvals (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  approver_id UUID REFERENCES auth.users(id),
  approval_status VARCHAR(50),     -- "approved", "rejected", "pending"
  approval_amount DECIMAL(15,2),
  approval_level INT,
  comments TEXT,
  approved_at TIMESTAMP,
  INDEX(payment_id)
);

CREATE TABLE approval_rules (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  name VARCHAR(255),
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  required_approvers INT,
  approver_roles TEXT[],           -- Array of role names
  auto_approve_under DECIMAL(15,2),
  active BOOLEAN,
  created_at TIMESTAMP
);
```

### Approval Rules Example

```json
{
  "rules": [
    {
      "name": "Low-Amount Auto-Approve",
      "minAmount": 0,
      "maxAmount": 1000,
      "autoApprove": true,
      "requiredApprovers": 0
    },
    {
      "name": "Medium-Amount One-Level",
      "minAmount": 1001,
      "maxAmount": 10000,
      "requiredApprovers": 1,
      "approverRoles": ["finance_manager"]
    },
    {
      "name": "High-Amount Two-Level",
      "minAmount": 10001,
      "maxAmount": 100000,
      "requiredApprovers": 2,
      "approverRoles": ["finance_manager", "workspace_admin"]
    },
    {
      "name": "Executive-Approval",
      "minAmount": 100001,
      "maxAmount": null,
      "requiredApprovers": 3,
      "approverRoles": ["workspace_admin", "executive"]
    }
  ]
}
```

---

## 3. Invoice Dispute Management System

### Dispute Lifecycle

```
Invoice Exception Found (or Carrier Dispute)
    ↓
Create Dispute
    ├─ Type: overcharge, wrong_rate, service_failure, damage
    ├─ Amount: claimed recovery
    └─ Evidence: photos, messages, audit results
        ↓
    [OPEN]
        ↓
    Submit to Carrier
        ├─ Email with dispute details
        └─ Request response within SLA (e.g., 15 days)
        ↓
    [SUBMITTED]
        ↓
    Carrier Responds
        ├─ APPROVE → Create credit
        ├─ PARTIAL → Negotiate amount
        └─ DENY → Escalate or close
        ↓
    [RESOLVED or ESCALATED]
        ↓
    Record Resolution
        ├─ Credit amount
        ├─ Effective date
        └─ Update financials
```

### Database Schema

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  invoice_id UUID REFERENCES invoices(id),
  shipment_id UUID REFERENCES shipments(id),
  carrier_id UUID REFERENCES carriers(id),
  dispute_type VARCHAR(50),        -- "overcharge", "service_failure", "damage"
  status VARCHAR(50),              -- "open", "submitted", "resolved", "rejected"
  amount CLAIMED DECIMAL(15,2),
  amount_recovered DECIMAL(15,2),
  description TEXT,
  evidence_urls TEXT[],            -- Document URLs
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  submitted_at TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(company_id),
  INDEX(status),
  INDEX(carrier_id)
);

CREATE TABLE dispute_communications (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  message_type VARCHAR(50),        -- "email", "note", "attachment"
  sender VARCHAR(255),             -- "company" or "carrier"
  subject VARCHAR(255),
  body TEXT,
  attachments JSONB,
  sent_at TIMESTAMP
);

CREATE TABLE dispute_resolutions (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  resolution_type VARCHAR(50),     -- "approved", "partial", "rejected"
  approved_amount DECIMAL(15,2),
  reason TEXT,
  resolved_by VARCHAR(255),        -- "carrier" or "company"
  resolved_at TIMESTAMP,
  effective_date DATE
);
```

---

## 4. Budget Planning & Forecasting

### Forecast Model

```
Historical Data (Last 12-24 months)
    ↓
    ├─ Total spend by month
    ├─ Spend by carrier
    ├─ Spend by lane
    └─ Spend by shipment type
        ↓
    Apply Algorithms
    ├─ Time series decomposition (trend + seasonal)
    ├─ Growth rate calculation
    ├─ Anomaly detection
    └─ Variance analysis
        ↓
    Generate Forecast
    ├─ Next 12 months
    ├─ Confidence intervals (80%, 95%)
    └─ Variance from budget
        ↓
    Scenario Analysis
    ├─ Best case: -10% growth
    ├─ Base case: +3% growth
    └─ Worst case: +15% growth
```

### Database Schema

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  company_id UUID REFERENCES companies(id),
  business_unit_id UUID REFERENCES business_units(id),
  fiscal_year INT,
  total_budget DECIMAL(15,2),
  budget_by_carrier JSONB,         -- { "carrier_id": amount }
  budget_by_lane JSONB,            -- { "route": amount }
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE forecasts (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  company_id UUID REFERENCES companies(id),
  business_unit_id UUID REFERENCES business_units(id),
  forecast_period VARCHAR(50),     -- "monthly", "quarterly", "annual"
  start_month INT,
  start_year INT,
  months INT,                      -- Duration in months
  forecast_data JSONB,             -- Array of { month, forecast, confidence_80, confidence_95 }
  algorithm VARCHAR(50),           -- "exponential_smoothing", "arima", "prophet"
  accuracy_score DECIMAL(5,2),
  created_at TIMESTAMP,
  INDEX(company_id)
);

CREATE TABLE budget_vs_actual (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  fiscal_month INT,
  fiscal_year INT,
  budget_amount DECIMAL(15,2),
  actual_amount DECIMAL(15,2),
  variance DECIMAL(15,2),
  variance_percent DECIMAL(5,2),
  created_at TIMESTAMP,
  INDEX(company_id, fiscal_year)
);
```

### Forecasting Logic (Python/TypeScript)

```python
import numpy as np
from sklearn.linear_model import LinearRegression

def forecast_spend(historical_data, periods=12):
    """
    historical_data: [(month, amount), ...]
    periods: number of months to forecast
    """
    # Extract trend
    X = np.arange(len(historical_data)).reshape(-1, 1)
    y = np.array([amount for _, amount in historical_data])

    model = LinearRegression()
    model.fit(X, y)

    # Forecast
    future_X = np.arange(len(historical_data),
                        len(historical_data) + periods).reshape(-1, 1)
    forecast = model.predict(future_X)

    # Calculate confidence intervals
    residuals = y - model.predict(X)
    std_dev = np.std(residuals)

    return {
        'forecast': forecast.tolist(),
        'confidence_80': (forecast + 1.28*std_dev).tolist(),
        'confidence_95': (forecast + 1.96*std_dev).tolist()
    }
```

---

## 5. API Endpoints

### Invoice Management
```
GET    /api/financial/invoices                    # List invoices
POST   /api/financial/invoices                    # Create invoice
GET    /api/financial/invoices/:id                # Get invoice detail
PUT    /api/financial/invoices/:id                # Update invoice
POST   /api/financial/invoices/:id/audit          # Trigger audit
GET    /api/financial/invoices/:id/audit-results  # View audit results
```

### Payment Processing
```
GET    /api/financial/payments                    # List payments
POST   /api/financial/payments                    # Create payment
GET    /api/financial/payments/:id                # Get payment detail
PUT    /api/financial/payments/:id/approve        # Approve payment
PUT    /api/financial/payments/:id/reject         # Reject payment
POST   /api/financial/payments/:id/process        # Process payment
```

### Disputes
```
GET    /api/financial/disputes                    # List disputes
POST   /api/financial/disputes                    # Create dispute
GET    /api/financial/disputes/:id                # Get dispute detail
POST   /api/financial/disputes/:id/submit         # Submit to carrier
POST   /api/financial/disputes/:id/resolve        # Resolve dispute
```

### Budget & Forecast
```
GET    /api/financial/budgets                     # Get budget
PUT    /api/financial/budgets                     # Update budget
GET    /api/financial/forecasts                   # Get forecasts
POST   /api/financial/forecasts                   # Generate forecast
GET    /api/financial/budget-vs-actual            # Budget variance report
```

---

## 6. Dashboard Features

**Invoice Auditing Dashboard:**
- Today's exceptions count
- Monthly savings recovered
- Top flagged invoice types
- Approval queue status

**Payment Processing Dashboard:**
- Pending approvals (with amounts)
- Payment schedule (next 7 days)
- Payment status by carrier
- Approval turnaround time

**Dispute Tracking:**
- Open disputes by carrier
- Average resolution time
- Total recovery amount
- Success rate (approved/total)

**Budget Forecasting:**
- Budget vs actual chart
- Forecast vs actual projection
- Variance analysis by carrier
- Scenario comparison

---

## 7. Implementation Roadmap

**Sprint 3 (Weeks 5-6):**
- Invoice ingestion (manual + CSV)
- Audit rules engine
- Audit results UI

**Sprint 4 (Weeks 7-8):**
- Payment approval workflows
- Payment processing integration
- Dispute creation & tracking

**Sprint 5 (Weeks 9-10):**
- Budget planning UI
- Forecast generation
- Budget vs actual reporting

---

## 8. Security & Compliance

- All payment amounts encrypted in transit (TLS)
- Audit logs for all financial transactions
- Segregation of duties (approver ≠ requester)
- PCI compliance if processing cards
- Monthly financial reconciliation report
