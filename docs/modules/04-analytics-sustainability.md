# Analytics & Sustainability Module - Detailed Specifications

## Module Overview
**Purpose:** Reporting, analytics dashboards, carbon tracking, predictive intelligence
**Status:** Advanced Feature (Sprints 6-13)
**Priority:** High - Strategic insights

---

## 1. Custom Reporting Engine with Drag-Drop Builder

### Report Types Available

```
Financial Reports
├─ Spend by Carrier (pie chart)
├─ Spend by Lane (map visualization)
├─ Spend by Service Type (bar chart)
├─ Spend Trends (time series)
└─ Budget vs Actual Analysis

Operational Reports
├─ Shipment Volume by Carrier
├─ On-Time Delivery Rate
├─ Exception Report (by type)
├─ Carrier Performance Scorecard
└─ Route Utilization

Invoice Reports
├─ Invoice Audit Summary
├─ Overcharge Recovery Summary
├─ Dispute Status Report
├─ Payment Processing Report
└─ Aged Invoices (by carrier)

Logistics Reports
├─ Tracking Status Dashboard
├─ Delivery Performance by Region
├─ Rate Comparison Analysis
├─ Capacity Utilization
└─ Lead Time Analysis
```

### Report Builder UI Flow

```
Step 1: Select Report Type
  ├─ Pre-built templates
  ├─ Blank canvas
  └─ Clone existing report

Step 2: Configure Data Source
  ├─ Choose entity (invoices, shipments, etc.)
  ├─ Date range filter
  ├─ Additional filters (carrier, lane, etc.)
  └─ Aggregation (sum, avg, count)

Step 3: Design Visualization
  ├─ Choose chart type
  │   ├─ Bar chart
  │   ├─ Line chart
  │   ├─ Pie chart
  │   ├─ Map
  │   ├─ Table
  │   └─ Heatmap
  ├─ Configure axes/dimensions
  └─ Set colors and labels

Step 4: Schedule & Export
  ├─ One-time / recurring
  ├─ Email delivery
  ├─ Format (PDF, CSV, Excel)
  └─ Recipients
```

### Database Schema

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255),
  description TEXT,
  report_type VARCHAR(50),         -- "financial", "operational", "custom"
  template_id UUID,                -- Reference to template if based on one
  created_by UUID REFERENCES auth.users(id),
  configuration JSONB,             -- Report builder config
  visualization_config JSONB,      -- Chart/display config
  filters JSONB,                   -- Date range, carrier, etc.
  is_public BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  frequency VARCHAR(50),           -- "once", "daily", "weekly", "monthly"
  scheduled_date TIMESTAMP,
  recipients TEXT[],               -- Email addresses
  format VARCHAR(50),              -- "pdf", "csv", "excel"
  status VARCHAR(50),              -- "active", "inactive"
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE report_executions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  executed_at TIMESTAMP,
  execution_time_ms INT,
  row_count INT,
  file_path VARCHAR(500),
  status VARCHAR(50),              -- "success", "failed"
  error_message TEXT
);
```

### Report Query Builder (TypeScript)

```typescript
interface ReportConfiguration {
  dataSource: {
    entity: "invoices" | "shipments" | "payments" | "audits";
    aggregation: "sum" | "avg" | "count" | "max" | "min";
    groupBy: string[];
  };
  filters: {
    dateRange: { from: Date; to: Date };
    carriers?: string[];
    lanes?: string[];
    status?: string[];
  };
  visualization: {
    type: "bar" | "line" | "pie" | "table" | "map";
    xAxis?: string;
    yAxis?: string;
    dimensions?: string[];
    metrics?: string[];
  };
}

async function buildReportQuery(config: ReportConfiguration): Promise<string> {
  const { dataSource, filters, visualization } = config;

  let query = `SELECT ${visualization.dimensions?.join(", ") || "*"}`;

  if (dataSource.aggregation && visualization.metrics) {
    query += `, ${visualization.metrics
      .map((m) => `${dataSource.aggregation.toUpperCase()}(${m}) as ${m}_${dataSource.aggregation}`)
      .join(", ")}`;
  }

  query += ` FROM ${dataSource.entity}`;

  // Apply filters
  const whereClauses = [];
  whereClauses.push(
    `created_at BETWEEN '${filters.dateRange.from.toISOString()}' AND '${filters.dateRange.to.toISOString()}'`
  );

  if (filters.carriers?.length) {
    whereClauses.push(`carrier_id IN (${filters.carriers.map((c) => `'${c}'`).join(", ")})`);
  }

  if (whereClauses.length) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  // Group by
  if (dataSource.groupBy?.length) {
    query += ` GROUP BY ${dataSource.groupBy.join(", ")}`;
  }

  return query;
}

async function executeReport(config: ReportConfiguration): Promise<any[]> {
  const query = await buildReportQuery(config);
  const result = await db.query(query);
  return result.rows;
}
```

---

## 2. Carbon Footprint Tracking

### Carbon Calculation Model

```
Shipment Carbon Emissions =
  (Weight in kg × Distance in km × Emission Factor by Mode) / Number of Shipments in Consolidation

Emission Factors (kg CO2 per ton-km):
├─ Air Freight:       1.1 kg CO2
├─ Ocean Freight:     0.01 kg CO2
├─ Truck (Local):     0.2 kg CO2
├─ Truck (Long-haul): 0.08 kg CO2
└─ Rail:              0.04 kg CO2

Examples:
├─ 1 kg via Air 100 km = (1 × 100 × 1.1) / 1 = 110 grams CO2
├─ 10 kg via Truck 500 km = (10 × 500 × 0.2) / 1 = 1000 grams CO2
└─ 100 kg via Ocean 5000 km = (100 × 5000 × 0.01) / 1 = 5000 grams CO2
```

### Database Schema

```sql
CREATE TABLE carbon_footprints (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  shipment_id UUID REFERENCES shipments(id),
  carrier_id UUID REFERENCES carriers(id),
  weight_kg DECIMAL(10,2),
  distance_km DECIMAL(10,2),
  service_type VARCHAR(50),        -- "air", "ocean", "truck", "rail"
  mode_code VARCHAR(50),           -- For carrier-specific details
  emission_factor DECIMAL(5,3),
  carbon_emissions_kg DECIMAL(10,4),
  carbon_emissions_lbs DECIMAL(10,4),
  calculation_date TIMESTAMP,
  created_at TIMESTAMP,
  INDEX(company_id, created_at)
);

CREATE TABLE carbon_offsets (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  description VARCHAR(255),
  carbon_reduction_kg DECIMAL(10,4),
  cost DECIMAL(15,2),
  provider VARCHAR(255),           -- "Carbonfund", "Cool Effect", etc.
  certification_url VARCHAR(500),
  applied_date DATE,
  created_at TIMESTAMP
);

CREATE TABLE carbon_targets (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  target_year INT,
  baseline_emissions_kg DECIMAL(15,4),
  target_emissions_kg DECIMAL(15,4),
  reduction_percent INT,           -- e.g., 25% reduction goal
  strategy VARCHAR(255),
  created_at TIMESTAMP
);

CREATE TABLE carbon_reports (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  report_period VARCHAR(50),       -- "monthly", "quarterly", "annual"
  period_start DATE,
  period_end DATE,
  total_emissions_kg DECIMAL(15,4),
  total_emissions_lbs DECIMAL(15,4),
  emissions_by_carrier JSONB,
  emissions_by_mode JSONB,
  offsets_applied_kg DECIMAL(15,4),
  net_emissions_kg DECIMAL(15,4),
  percent_from_target DECIMAL(5,2),
  created_at TIMESTAMP
);
```

### Carbon Calculation Engine

```typescript
interface CarbonCalculationInput {
  shipmentId: string;
  weightKg: number;
  distanceKm: number;
  serviceType: "air" | "ocean" | "truck" | "rail";
  carrierId: string;
}

interface CarbonResult {
  shipmentId: string;
  carbonKg: number;
  carbonLbs: number;
  emissionFactor: number;
}

async function calculateCarbonFootprint(
  input: CarbonCalculationInput
): Promise<CarbonResult> {
  const emissionFactors: Record<string, number> = {
    air: 1.1,
    ocean: 0.01,
    truck: 0.2,
    rail: 0.04,
  };

  const emissionFactor = emissionFactors[input.serviceType];

  // CO2 = weight (kg) × distance (km) × factor
  const carbonKg = (input.weightKg * input.distanceKm * emissionFactor) / 1000;
  const carbonLbs = carbonKg * 2.20462;

  // Store in database
  await db.query(
    `INSERT INTO carbon_footprints
     (shipment_id, weight_kg, distance_km, service_type, emission_factor, carbon_emissions_kg, carbon_emissions_lbs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.shipmentId, input.weightKg, input.distanceKm, input.serviceType, emissionFactor, carbonKg, carbonLbs]
  );

  return { shipmentId: input.shipmentId, carbonKg, carbonLbs, emissionFactor };
}

async function generateCarbonReport(
  companyId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<any> {
  // Total emissions
  const totalResult = await db.query(
    `SELECT SUM(carbon_emissions_kg) as total_kg FROM carbon_footprints
     WHERE company_id = $1 AND created_at BETWEEN $2 AND $3`,
    [companyId, periodStart, periodEnd]
  );

  const totalEmissionsKg = totalResult.rows[0]?.total_kg || 0;

  // Emissions by carrier
  const byCarrier = await db.query(
    `SELECT carrier_id, SUM(carbon_emissions_kg) as total_kg
     FROM carbon_footprints
     WHERE company_id = $1 AND created_at BETWEEN $2 AND $3
     GROUP BY carrier_id`,
    [companyId, periodStart, periodEnd]
  );

  // Emissions by mode
  const byMode = await db.query(
    `SELECT service_type, SUM(carbon_emissions_kg) as total_kg
     FROM carbon_footprints
     WHERE company_id = $1 AND created_at BETWEEN $2 AND $3
     GROUP BY service_type`,
    [companyId, periodStart, periodEnd]
  );

  // Applied offsets
  const offsetsResult = await db.query(
    `SELECT SUM(carbon_reduction_kg) as total_offset FROM carbon_offsets
     WHERE company_id = $1 AND applied_date BETWEEN $2 AND $3`,
    [companyId, periodStart, periodEnd]
  );

  const offsetsKg = offsetsResult.rows[0]?.total_offset || 0;
  const netEmissions = totalEmissionsKg - offsetsKg;

  return {
    totalEmissionsKg,
    emissionsByCarrier: Object.fromEntries(byCarrier.rows.map((r) => [r.carrier_id, r.total_kg])),
    emissionsByMode: Object.fromEntries(byMode.rows.map((r) => [r.service_type, r.total_kg])),
    offsetsApplied: offsetsKg,
    netEmissions,
  };
}
```

---

## 3. AI-Powered Predictive Analytics

### Prediction Models

#### A. Delivery Delay Prediction

```
Model: Gradient Boosting
Input Features:
  ├─ Carrier
  ├─ Distance
  ├─ Weight
  ├─ Service type
  ├─ Origin/Destination region
  ├─ Day of week shipped
  ├─ Historical carrier on-time %
  └─ Weather conditions

Output: Probability of delay (0-100%)

Thresholds:
  ├─ Low Risk: 0-20% → No action
  ├─ Medium Risk: 20-50% → Monitor
  └─ High Risk: 50%+ → Alert customer
```

#### B. Invoice Overcharge Prediction

```
Model: Logistic Regression
Input Features:
  ├─ Carrier
  ├─ Weight
  ├─ Distance
  ├─ Service type
  ├─ Current billed rate
  ├─ Historical rate for same lane
  └─ Carrier contract discount

Output: Probability of overcharge (0-100%)

Action:
  ├─ >70% probability → Flag invoice before payment
  └─ Manual review recommended
```

#### C. Cost Overrun Forecasting

```
Model: Time Series ARIMA
Input: Monthly spend for past 24 months
Output: Forecasted spend for next 12 months

Use Cases:
  ├─ Alert if projected > budget
  ├─ Recommend carrier consolidation
  └─ Identify seasonality patterns
```

### Database Schema

```sql
CREATE TABLE prediction_models (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  model_type VARCHAR(50),          -- "delay", "overcharge", "forecast"
  version VARCHAR(50),
  model_file_path VARCHAR(500),    -- Path to serialized model
  training_date DATE,
  accuracy_score DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  active BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  prediction_type VARCHAR(50),     -- "delay", "overcharge", "cost_overrun"
  entity_type VARCHAR(50),         -- "shipment", "invoice", "monthly"
  entity_id VARCHAR(100),
  prediction_value DECIMAL(5,2),   -- Probability or value
  confidence DECIMAL(5,2),
  predicted_at TIMESTAMP,
  actual_value DECIMAL(5,2),       -- Populated later for model evaluation
  outcome_recorded_at TIMESTAMP,
  created_at TIMESTAMP,
  INDEX(company_id, prediction_type)
);

CREATE TABLE prediction_insights (
  id UUID PRIMARY KEY,
  prediction_id UUID REFERENCES predictions(id),
  insight_type VARCHAR(50),        -- "explanation", "recommendation"
  content TEXT,
  action_recommended VARCHAR(255),
  created_at TIMESTAMP
);
```

### Prediction API Integration with Codex

```typescript
interface PredictionRequest {
  type: "delay" | "overcharge" | "cost_overrun";
  entity: any; // Shipment, invoice, or monthly data
}

interface PredictionResponse {
  probability: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
}

async function getPrediction(req: PredictionRequest): Promise<PredictionResponse> {
  // 1. Get ML model prediction
  const mlPrediction = await callMLModel(req.type, req.entity);

  // 2. Get AI insights from Codex
  const prompt = `
    Analyzing a freight prediction:
    Type: ${req.type}
    Probability: ${mlPrediction.probability}%

    Entity details:
    ${JSON.stringify(req.entity, null, 2)}

    Provide:
    1. One sentence explanation of this prediction
    2. 2-3 actionable recommendations for the logistics team
  `;

  const message = await codex.messages.create({
    model: "codex-3-5-sonnet",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const aiResponse = message.content[0].type === "text" ? message.content[0].text : "";

  // 3. Parse and return
  return {
    probability: mlPrediction.probability,
    confidence: mlPrediction.confidence,
    insights: extractInsights(aiResponse),
    recommendations: extractRecommendations(aiResponse),
  };
}
```

---

## 4. Dashboard Features

### Analytics Dashboard Widgets

**Executive Summary:**
- Total spend (YTD)
- Savings recovered (YTD)
- Average cost per shipment
- On-time delivery rate

**Spend Analysis:**
- Spend by carrier (pie)
- Spend trend (line chart)
- Top 5 carriers by spend
- Spend by lane (map)

**Operational Metrics:**
- Active shipments
- Pending approvals
- Open exceptions
- Average delivery time

**Predictions:**
- High-risk shipments (next 7 days)
- Projected cost overruns
- Predicted invoice overcharges
- Carbon reduction opportunities

**Sustainability:**
- Total carbon emissions
- Emissions by mode
- Carbon offset applied
- Progress to target

---

## 5. API Endpoints

```
GET    /api/analytics/reports                     # List reports
POST   /api/analytics/reports                     # Create report
GET    /api/analytics/reports/:id/execute         # Run report
POST   /api/analytics/reports/:id/schedule        # Schedule report

GET    /api/analytics/carbon-reports              # Carbon summary
POST   /api/analytics/carbon-offsets              # Record offset
GET    /api/analytics/carbon-targets              # Get targets

GET    /api/analytics/predictions/:type/:entityId # Get prediction
POST   /api/analytics/predictions/batch           # Batch predictions

GET    /api/analytics/dashboards                  # Get dashboard data
```

---

## 6. Implementation Roadmap

**Sprint 6 (Weeks 11-12):**
- Report builder UI
- Scheduled report delivery
- Pre-built templates

**Sprint 7-8:**
- Carbon footprint tracking
- Carbon reports

**Sprint 13-14:**
- ML model integration
- Prediction APIs
- Insight generation with Codex

---

## 7. Key Metrics

- Report execution time < 30 seconds
- Prediction accuracy > 85%
- Carbon calculation error < 2%
- Dashboard load time < 2 seconds
