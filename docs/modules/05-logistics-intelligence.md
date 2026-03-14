# Logistics Intelligence Module - Detailed Specifications

## Module Overview
**Purpose:** Carrier management, rate optimization, shipment tracking, performance scoring
**Status:** Core Feature (Sprints 2-3)
**Priority:** Critical - Operational visibility

---

## 1. Multi-Carrier Rate Management

### Rate Structure

```
Carrier
  ├── Zone (Origin/Dest)
  │   ├── Service Type (Ground, Express, Air)
  │   │   ├── Weight Bracket 0-1 lbs → $5.00
  │   │   ├── Weight Bracket 1-5 lbs → $7.50
  │   │   ├── Weight Bracket 5-10 lbs → $10.00
  │   │   └── Weight Bracket 10+ lbs → $0.75/lb
  │   │
  │   └── Accessorial Fees
  │       ├── Residential Delivery → +$3.50
  │       ├── Saturday Delivery → +$2.00
  │       ├── Signature Required → +$1.50
  │       └── Hazmat Handling → +$15.00
```

### Database Schema

```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255),
  code VARCHAR(20) UNIQUE,         -- "FDX", "UPS", etc.
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  api_type VARCHAR(50),            -- "rest", "soap", "sftp", "manual"
  api_endpoint VARCHAR(500),
  status VARCHAR(50),              -- "active", "inactive", "testing"
  performance_score DECIMAL(3,1),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(company_id)
);

CREATE TABLE rate_cards (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  name VARCHAR(255),               -- "2024 Standard Rates"
  effective_from DATE,
  effective_to DATE,
  status VARCHAR(50),              -- "active", "draft", "archived"
  currency VARCHAR(3),
  created_at TIMESTAMP,
  INDEX(carrier_id, effective_from)
);

CREATE TABLE rate_zones (
  id UUID PRIMARY KEY,
  rate_card_id UUID REFERENCES rate_cards(id),
  origin_postal_code VARCHAR(20),
  destination_postal_code VARCHAR(20),
  zone_code VARCHAR(10),           -- 1-8 depending on carrier
  base_rate DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE TABLE rate_tables (
  id UUID PRIMARY KEY,
  rate_zone_id UUID REFERENCES rate_zones(id),
  service_type VARCHAR(50),        -- "ground", "express", "overnight"
  weight_min DECIMAL(10,2),
  weight_max DECIMAL(10,2),
  rate_per_unit DECIMAL(10,2),
  minimum_charge DECIMAL(10,2),
  created_at TIMESTAMP,
  INDEX(rate_zone_id)
);

CREATE TABLE accessorials (
  id UUID PRIMARY KEY,
  rate_card_id UUID REFERENCES rate_cards(id),
  code VARCHAR(20),                -- "RES", "SAT", "SIG", "HAZ"
  name VARCHAR(255),
  charge DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE TABLE carrier_contracts (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  carrier_id UUID REFERENCES carriers(id),
  contract_number VARCHAR(100),
  start_date DATE,
  end_date DATE,
  minimum_annual_spend DECIMAL(15,2),
  discount_percent DECIMAL(5,2),
  negotiated_rates JSONB,          -- Override rates
  sla_terms JSONB,                 -- { "delivery_days": 2, "on_time_percent": 95 }
  status VARCHAR(50),              -- "active", "expired", "pending"
  created_at TIMESTAMP,
  INDEX(company_id, carrier_id)
);
```

### Rate Lookup Query

```sql
-- Find applicable rate for a shipment
SELECT r.rate_per_unit, a.charge as accessorial
FROM rate_tables r
JOIN rate_zones rz ON r.rate_zone_id = rz.id
JOIN rate_cards rc ON rz.rate_card_id = rc.id
LEFT JOIN accessorials a ON rc.id = a.rate_card_id
WHERE rc.carrier_id = $1
  AND rc.effective_from <= CURRENT_DATE
  AND rc.effective_to >= CURRENT_DATE
  AND rz.origin_postal_code = $2
  AND rz.destination_postal_code = $3
  AND r.service_type = $4
  AND $5 BETWEEN r.weight_min AND r.weight_max;
```

---

## 2. Real-Time Rate Shopping Engine

### Rate Shopping Algorithm

```
User requests quote for shipment
  ├─ Input: origin, destination, weight, service level, date
  ├─ Query all active carriers for rates
  ├─ Apply contract discounts
  ├─ Add accessorial charges
  ├─ Calculate total cost
  └─ Rank by price + performance score
      ↓
Return Options:
  1. FedEx Ground - $45.60 (2-day) - Score: 4.8/5
  2. UPS Ground   - $48.20 (2-day) - Score: 4.5/5
  3. XPO Logistics - $42.30 (3-day) - Score: 4.2/5
```

### Database Schema

```sql
CREATE TABLE rate_quotes (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  shipment_id UUID REFERENCES shipments(id),
  origin_postal_code VARCHAR(20),
  destination_postal_code VARCHAR(20),
  weight DECIMAL(10,2),
  service_type VARCHAR(50),
  requested_at TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX(company_id)
);

CREATE TABLE rate_options (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES rate_quotes(id),
  carrier_id UUID REFERENCES carriers(id),
  base_rate DECIMAL(10,2),
  accessorial_charges DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  contract_discount_percent DECIMAL(5,2),
  final_cost DECIMAL(10,2),
  estimated_delivery_date DATE,
  performance_score DECIMAL(3,1),
  ranking INT,
  selected BOOLEAN,
  created_at TIMESTAMP
);
```

### Rate Shopping Algorithm (TypeScript)

```typescript
interface ShipmentRequest {
  originZip: string;
  destinationZip: string;
  weight: number;
  serviceType: "ground" | "express" | "overnight";
  shipmentDate: Date;
}

interface RateOption {
  carrierId: string;
  carrierName: string;
  baseRate: number;
  accessorials: number;
  totalCost: number;
  estimatedDelivery: Date;
  performanceScore: number;
  recommendation: "best_price" | "best_service" | "balanced";
}

async function shopRates(request: ShipmentRequest): Promise<RateOption[]> {
  // 1. Get all active carriers
  const carriers = await db.query(
    'SELECT * FROM carriers WHERE status = $1',
    ['active']
  );

  const options: RateOption[] = [];

  // 2. For each carrier, get rate
  for (const carrier of carriers) {
    const rate = await getRateForCarrier(carrier.id, request);
    if (!rate) continue;

    // 3. Apply contract discount
    const contract = await db.query(
      'SELECT discount_percent FROM carrier_contracts WHERE carrier_id = $1',
      [carrier.id]
    );
    const discount = contract.rows[0]?.discount_percent || 0;
    const finalCost = rate.total * (1 - discount / 100);

    // 4. Get carrier performance score
    const performance = await getCarrierPerformance(carrier.id);

    options.push({
      carrierId: carrier.id,
      carrierName: carrier.name,
      baseRate: rate.baseRate,
      accessorials: rate.accessorials,
      totalCost: rate.total,
      estimatedDelivery: rate.deliveryDate,
      performanceScore: performance.score,
      recommendation: getRecommendation(finalCost, performance.score)
    });
  }

  // 5. Sort by cost (default) or score
  return options.sort((a, b) => a.totalCost - b.totalCost);
}

function getRecommendation(
  cost: number,
  score: number
): "best_price" | "best_service" | "balanced" {
  if (cost < 50 && score >= 4.5) return "best_price";
  if (score > 4.7) return "best_service";
  return "balanced";
}
```

---

## 3. Real-Time Shipment Tracking

### Tracking Integration Pattern

```
External Carrier API
  ├─ FedEx XML API
  ├─ UPS Tracking API
  ├─ Generic HTTP/REST
  └─ SFTP File Drop
      ↓
Normalize to Common Format
      ↓
Update Shipment Status
      ↓
Trigger Webhooks
      ├─ Delivery events
  ├─ Exception events
      └─ Delay warnings
      ↓
Update UI in Real-time
```

### Database Schema

```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  carrier_id UUID REFERENCES carriers(id),
  tracking_number VARCHAR(100),
  origin_facility_id UUID REFERENCES facilities(id),
  destination_facility_id UUID REFERENCES facilities(id),
  weight DECIMAL(10,2),
  service_type VARCHAR(50),
  status VARCHAR(50),              -- "created", "picked_up", "in_transit", "delivered"
  current_location JSONB,          -- { lat, lng, city, state }
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  shipped_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(company_id, tracking_number),
  INDEX(carrier_id)
);

CREATE TABLE shipment_events (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  event_type VARCHAR(50),          -- "created", "picked_up", "in_transit", "delivered", "exception"
  event_code VARCHAR(20),          -- "PKG_CREATED", "PKG_DELIVERED", "PKG_DELAYED"
  status VARCHAR(50),
  timestamp TIMESTAMP,
  location JSONB,                  -- { lat, lng, city, state, country }
  description TEXT,
  raw_data JSONB,                  -- Original carrier data
  created_at TIMESTAMP,
  INDEX(shipment_id, timestamp)
);

CREATE TABLE tracking_subscriptions (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  webhook_url VARCHAR(500),
  event_types TEXT[],              -- ["delivered", "exception"]
  active BOOLEAN,
  created_at TIMESTAMP
);
```

### Tracking Integration Adapters

```typescript
interface TrackingAdapter {
  name: string;
  carrierId: string;
  getTracking(trackingNumber: string): Promise<TrackingData>;
}

interface TrackingData {
  trackingNumber: string;
  status: string;
  currentLocation: Location;
  estimatedDelivery: Date;
  events: TrackingEvent[];
}

interface TrackingEvent {
  timestamp: Date;
  eventType: string;
  description: string;
  location: Location;
}

// FedEx Adapter
class FedExAdapter implements TrackingAdapter {
  async getTracking(trackingNumber: string): Promise<TrackingData> {
    const response = await axios.post(
      'https://apis.fedex.com/track/v1/trackedpackages',
      {
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }]
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      }
    );

    return this.normalizeResponse(response.data);
  }

  private normalizeResponse(data: any): TrackingData {
    // Convert FedEx format to standard format
    const tracking = data.output.tracking[0];
    return {
      trackingNumber: tracking.trackingNumber,
      status: this.mapStatus(tracking.status),
      currentLocation: {
        city: tracking.lastPickupLocation?.city,
        state: tracking.lastPickupLocation?.state,
        lat: null,
        lng: null
      },
      estimatedDelivery: new Date(tracking.estimatedDeliveryDate),
      events: tracking.events.map(e => ({
        timestamp: new Date(e.timestamp),
        eventType: e.eventType,
        description: e.eventDescription,
        location: { city: e.location?.city, state: e.location?.state, lat: null, lng: null }
      }))
    };
  }

  private mapStatus(fedexStatus: string): string {
    const statusMap: Record<string, string> = {
      'Created': 'created',
      'On FedEx vehicle for delivery': 'in_transit',
      'Delivered': 'delivered',
      'Exception': 'exception'
    };
    return statusMap[fedexStatus] || 'unknown';
  }
}
```

---

## 4. Carrier Performance Scorecards

### Scoring Methodology

```
On-Time Delivery (40% weight)
  ├─ Metric: % of shipments delivered by promised date
  ├─ Target: 95%+
  └─ Score: 5.0 at 100%, 0.0 at 50%

Billing Accuracy (30% weight)
  ├─ Metric: % of invoices with zero audit exceptions
  ├─ Target: 98%+
  └─ Score: 5.0 at 100%, 0.0 at 80%

Service Quality (20% weight)
  ├─ Metric: % of shipments with zero exceptions
  ├─ Target: 97%+
  └─ Score: 5.0 at 100%, 0.0 at 85%

Responsiveness (10% weight)
  ├─ Metric: Avg response time to support inquiries
  ├─ Target: <24 hours
  └─ Score: 5.0 at <12h, 0.0 at >48h

Overall Score = (OnTime × 0.4) + (Billing × 0.3) + (Quality × 0.2) + (Response × 0.1)
```

### Database Schema

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  metric_date DATE,
  shipment_count INT,
  on_time_delivery_percent DECIMAL(5,2),
  billing_accuracy_percent DECIMAL(5,2),
  damage_rate_percent DECIMAL(5,2),
  exception_rate_percent DECIMAL(5,2),
  avg_response_time_hours DECIMAL(5,2),
  composite_score DECIMAL(3,1),
  created_at TIMESTAMP,
  INDEX(carrier_id, metric_date)
);

CREATE TABLE scorecard_history (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  month INT,
  year INT,
  on_time_score DECIMAL(3,1),
  billing_score DECIMAL(3,1),
  quality_score DECIMAL(3,1),
  response_score DECIMAL(3,1),
  composite_score DECIMAL(3,1),
  trend VARCHAR(50),               -- "improving", "declining", "stable"
  created_at TIMESTAMP
);
```

### Scorecard Calculation

```typescript
async function calculateCarrierScore(carrierId: string, month: Date): Promise<number> {
  // 1. On-Time Delivery (40%)
  const shipments = await db.query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN actual_delivery_date <= estimated_delivery_date THEN 1 END) as on_time
     FROM shipments
     WHERE carrier_id = $1 AND DATE_TRUNC('month', shipped_date) = $2`,
    [carrierId, month]
  );
  const onTimePercent = shipments.rows[0].on_time / shipments.rows[0].total * 100;
  const onTimeScore = Math.max(0, Math.min(5, (onTimePercent - 50) / 10));

  // 2. Billing Accuracy (30%)
  const audits = await db.query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN audit_status = 'passed' THEN 1 END) as passed
     FROM invoices
     WHERE carrier_id = $1 AND DATE_TRUNC('month', created_at) = $2`,
    [carrierId, month]
  );
  const billingPercent = audits.rows[0].passed / audits.rows[0].total * 100;
  const billingScore = Math.max(0, Math.min(5, (billingPercent - 80) / 4));

  // 3. Quality (20%)
  const exceptions = await db.query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as no_exception
     FROM shipments
     WHERE carrier_id = $1 AND DATE_TRUNC('month', shipped_date) = $2`,
    [carrierId, month]
  );
  const qualityPercent = exceptions.rows[0].no_exception / exceptions.rows[0].total * 100;
  const qualityScore = Math.max(0, Math.min(5, (qualityPercent - 85) / 3));

  // 4. Responsiveness (10%) - from support tickets
  const avgResponse = await getAverageResponseTime(carrierId, month);
  const responseScore = Math.max(0, Math.min(5, (48 - avgResponse) / 10));

  // Composite Score
  const compositeScore =
    (onTimeScore * 0.4) +
    (billingScore * 0.3) +
    (qualityScore * 0.2) +
    (responseScore * 0.1);

  return Math.round(compositeScore * 10) / 10;
}
```

---

## 5. Exception Management System

### Exception Types & Detection

```
Tracking Exception
  ├─ Delayed: Delivery > estimated date
  ├─ Lost: No update for 7 days
  ├─ Damaged: Damage reported in tracking
  └─ Returned: Returned to sender

Billing Exception
  ├─ Overcharge: Rate > contract rate
  ├─ Duplicate: Same invoice twice
  ├─ Service Mismatch: Billed service ≠ shipped
  └─ Unauthorized Charge: Accessorial not in contract

Operational Exception
  ├─ Failed Delivery: Multiple delivery attempts
  ├─ Wrong Destination: Shipped to wrong location
  ├─ Missing POD: Proof of delivery not provided
  └─ Contract Violation: Breach of SLA
```

### Exception Management Workflow

```sql
CREATE TABLE exceptions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  exception_type VARCHAR(50),      -- "tracking", "billing", "operational"
  exception_code VARCHAR(50),
  shipment_id UUID REFERENCES shipments(id),
  invoice_id UUID REFERENCES invoices(id),
  carrier_id UUID REFERENCES carriers(id),
  description TEXT,
  severity VARCHAR(20),            -- "low", "medium", "high", "critical"
  status VARCHAR(50),              -- "open", "in_progress", "resolved", "escalated"
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  INDEX(company_id, status)
);

CREATE TABLE exception_actions (
  id UUID PRIMARY KEY,
  exception_id UUID REFERENCES exceptions(id),
  action_type VARCHAR(50),         -- "contact_carrier", "issue_credit", "rebook"
  action_details JSONB,
  completed_at TIMESTAMP
);
```

---

## 6. API Endpoints

```
GET    /api/logistics/carriers                    # List carriers
POST   /api/logistics/carriers                    # Add carrier
GET    /api/logistics/rates                       # Get rate for shipment
POST   /api/logistics/rates/shop                  # Get rate quotes
GET    /api/logistics/shipments                   # List shipments
POST   /api/logistics/shipments                   # Create shipment
GET    /api/logistics/shipments/:id/tracking      # Get tracking details
GET    /api/logistics/carriers/:id/scorecard      # Get performance scorecard
GET    /api/logistics/exceptions                  # List exceptions
POST   /api/logistics/exceptions/:id/resolve      # Resolve exception
```

---

## 7. Dashboard Features

- **Shipment Tracking Map:** Real-time location of in-transit shipments
- **Carrier Performance:** Monthly scorecards and trends
- **Rate Comparison:** Average rate by carrier and lane
- **Exception Dashboard:** Open exceptions by type and severity
- **Quick Quote:** Rate shopping interface
