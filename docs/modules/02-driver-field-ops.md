# Carrier & Field Operations Module - Mobile-First Platform

## Module Overview
**Purpose:** Mobile app and web portal for carrier drivers and external logistics partners to manage deliveries, document uploads, IoT monitoring, and dispute management
**Target Users:** Delivery Drivers, Carrier Operations Teams, External Logistics Partners, Warehouse Staff
**Status:** External Integration (Sprints 10-12, 17)
**Priority:** High - Partner Engagement & Operational Visibility

---

## 1. Mobile App Interface (Driver Portal)

### Core Features

#### 1.1 Delivery Confirmation Workflow

```
┌──────────────────────────────────────┐
│  DELIVERY QUEUE (12 stops today)     │
├──────────────────────────────────────┤
│                                      │
│ [1/12] → 123 Main St, Chicago       │
│          Recipient: John Smith       │
│          Weight: 45 lbs              │
│          Fragile ⚠️                  │
│          Signature Required ✓        │
│                                      │
│  [START DELIVERY]  [SKIP]            │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ DELIVERY PROCESS:                    │
│ 1. Navigate to address               │
│ 2. Confirm recipient                 │
│ 3. Take POD photo                    │
│ 4. Get signature (e-sign)            │
│ 5. Report any damage/exceptions      │
│ 6. Submit delivery                   │
│                                      │
└──────────────────────────────────────┘
```

#### 1.2 Real-Time Delivery Status Updates

```typescript
interface DeliveryStatus {
  shipmentId: string;
  trackingNumber: string;
  status: "assigned" | "in_transit" | "arrived" | "confirmed" | "exception";
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
    timestamp: Date;
  };
  estimatedArrival: Date;
  driverInfo: {
    driverId: string;
    driverName: string;
    vehicleId: string;
    vehicleType: "van" | "truck" | "motorcycle";
    licensePlate: string;
  };
  recipientInfo: {
    name: string;
    phone: string;
    address: string;
    signatureRequired: boolean;
  };
  specialInstructions: string;
  photosCollected: number;
  damageReports: DamageReport[];
  lastUpdate: Date;
}

interface DeliveryConfirmation {
  shipmentId: string;
  driverId: string;
  confirmedAt: Date;
  recipientName: string;
  signatureData: string; // base64 encoded signature
  photoUrls: string[];
  temperature: number; // if monitored
  damageReported: boolean;
  damagePhotos: string[];
  notes: string;
  deliveryProofUrl: string;
}

interface DamageReport {
  id: string;
  shipmentId: string;
  reportedAt: Date;
  severity: "minor" | "moderate" | "severe";
  type: "box_damage" | "product_damage" | "leakage" | "mishandling";
  description: string;
  photoUrls: string[];
  estimatedValue: number;
  requiresReturnPickup: boolean;
}
```

#### 1.3 Mobile UI Components

```typescript
// React Native Component Architecture
<DriverPortalApp>
  ├── <AuthScreen>
  │   ├── <LoginForm>
  │   └── <BiometricAuth>
  │
  ├── <HomeScreen>
  │   ├── <RouteHeader>
  │   │   ├── <DailyStats>
  │   │   ├── <RouteProgress>
  │   │   └── <EarningsDisplay>
  │   ├── <DeliveryQueue>
  │   │   ├── <DeliveryCard>
  │   │   │   ├── <RecipientInfo>
  │   │   │   ├── <AddressDisplay>
  │   │   │   ├── <DistanceIndicator>
  │   │   │   └── <QuickActions>
  │   │   └── <NavigateButton>
  │   └── <BottomTabs>
  │
  ├── <DeliveryScreen>
  │   ├── <DeliveryDetails>
  │   ├── <PhotoCapture>
  │   │   ├── <CameraComponent>
  │   │   ├── <PhotoPreview>
  │   │   └── <PhotoGallery>
  │   ├── <SignatureCapture>
  │   │   └── <SignaturePad>
  │   ├── <DamageReportForm>
  │   │   ├── <SeveritySelector>
  │   │   ├── <TypeSelector>
  │   │   ├── <PhotoUpload>
  │   │   └── <DescriptionInput>
  │   └── <ConfirmButton>
  │
  ├── <DocumentScreen>
  │   ├── <DocumentList>
  │   ├── <DocumentUpload>
  │   └── <DocumentViewer>
  │
  ├── <SensorDashboard>
  │   ├── <TemperatureGauge>
  │   ├── <HumidityIndicator>
  │   ├── <ShockAlerts>
  │   └── <SensorHistory>
  │
  ├── <DisputeScreen>
  │   ├── <OpenDisputes>
  │   ├── <DisputeForm>
  │   └── <DisputeHistory>
  │
  └── <SettingsScreen>
      ├── <ProfileSettings>
      ├── <NotificationPrefs>
      └── <AppSettings>
```

### Database Schema for Delivery Operations

```sql
CREATE TABLE driver_sessions (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  carrier_id UUID REFERENCES carriers(id),
  route_id UUID,
  session_start TIMESTAMP,
  session_end TIMESTAMP,
  total_deliveries INT,
  completed_deliveries INT,
  failed_deliveries INT,
  total_distance_km DECIMAL(10,2),
  total_time_minutes INT,
  status VARCHAR(50), -- "active", "completed", "paused"
  created_at TIMESTAMP
);

CREATE TABLE delivery_confirmations (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  driver_id UUID REFERENCES drivers(id),
  confirmed_at TIMESTAMP,
  recipient_name VARCHAR(255),
  signature_data TEXT, -- base64
  confirmation_photos TEXT[], -- array of S3 URLs
  temperature_at_delivery DECIMAL(5,2),
  humidity_at_delivery DECIMAL(5,2),
  damage_reported BOOLEAN,
  damage_severity VARCHAR(50),
  special_notes TEXT,
  pod_url VARCHAR(500), -- Proof of Delivery document
  gps_coordinates GEOMETRY, -- PostGIS point
  created_at TIMESTAMP
);

CREATE TABLE damage_reports (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  driver_id UUID REFERENCES drivers(id),
  reported_at TIMESTAMP,
  damage_type VARCHAR(50), -- "box_damage", "product_damage", "leakage"
  severity VARCHAR(50), -- "minor", "moderate", "severe"
  description TEXT,
  photo_urls TEXT[],
  estimated_value DECIMAL(15,2),
  requires_return BOOLEAN,
  claim_id UUID REFERENCES claims(id),
  status VARCHAR(50), -- "reported", "under_review", "approved", "denied"
  created_at TIMESTAMP
);

CREATE TABLE driver_sessions_geo (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES driver_sessions(id),
  timestamp TIMESTAMP,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  accuracy_meters INT,
  speed_kmh DECIMAL(5,2),
  heading INT,
  INDEX(session_id, timestamp)
);
```

---

## 2. Document Management with OCR

### Proof of Delivery (POD) Processing

```
┌──────────────────────────────────────────┐
│  DOCUMENT CAPTURE INTERFACE              │
├──────────────────────────────────────────┤
│                                          │
│  [📷 CAPTURE POD]                        │
│                                          │
│  Instructions:                           │
│  1. Place document in frame              │
│  2. Ensure good lighting                 │
│  3. Keep document flat                   │
│  4. Stay within borders                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │      [CAMERA PREVIEW]              │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [CAPTURE]          [UPLOAD FROM GALLERY]│
│                                          │
└──────────────────────────────────────────┘

OCR Processing:
┌────────────────────────────────────┐
│ Extracting document data...        │
├────────────────────────────────────┤
│ ✓ Document Type: POD              │
│ ✓ Tracking Number: 1Z999AA10...   │
│ ✓ Recipient: John Smith           │
│ ✓ Delivery Date: 2024-03-14       │
│ ✓ Time: 14:32                     │
│ ✓ Signature: Detected             │
│ ✓ Confidence: 94%                 │
├────────────────────────────────────┤
│ [CONFIRM] [EDIT] [RETAKE]         │
└────────────────────────────────────┘
```

### OCR Engine Architecture

```typescript
interface OCRExtractionRequest {
  imageBase64: string;
  documentType: "pod" | "shipping_label" | "invoice" | "manifest";
  language: string; // "en", "es", "fr"
}

interface OCRExtractionResult {
  documentType: string;
  confidence: number; // 0-100
  extractedFields: {
    trackingNumber?: string;
    recipientName?: string;
    deliveryDate?: Date;
    deliveryTime?: string;
    signatureDetected?: boolean;
    barcode?: string;
    weight?: number;
    serviceType?: string;
  };
  rawText: string;
  warnings: string[];
}

// OCR Processing Pipeline
async function processDocumentWithOCR(
  imageBase64: string,
  documentType: string
): Promise<OCRExtractionResult> {
  // 1. Image preprocessing (skew correction, rotation)
  const preprocessed = await preprocessImage(imageBase64);

  // 2. OCR extraction using Tesseract or AWS Textract
  const ocrResult = await ocrEngine.extract(preprocessed, {
    language: "eng",
    psm: 3, // Fully automatic page segmentation
  });

  // 3. Field extraction using regex and ML
  const fields = await extractStructuredFields(ocrResult.text, documentType);

  // 4. Confidence scoring
  const confidence = calculateConfidence(ocrResult, fields);

  // 5. Return structured result
  return {
    documentType,
    confidence,
    extractedFields: fields,
    rawText: ocrResult.text,
    warnings: validateExtraction(fields),
  };
}
```

### Document Management Database Schema

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  shipment_id UUID REFERENCES shipments(id),
  driver_id UUID REFERENCES drivers(id),
  document_type VARCHAR(50), -- "pod", "shipping_label", "invoice", "manifest"
  file_url VARCHAR(500),
  file_size_bytes INT,
  mime_type VARCHAR(50),
  original_filename VARCHAR(255),
  upload_date TIMESTAMP,
  status VARCHAR(50), -- "raw", "processing", "extracted", "validated"
  created_at TIMESTAMP
);

CREATE TABLE document_extractions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  extraction_engine VARCHAR(50), -- "tesseract", "textract", "custom_ml"
  ocr_confidence DECIMAL(5,2),
  extracted_json JSONB, -- Structured extraction
  raw_text TEXT,
  extraction_time_ms INT,
  validated BOOLEAN,
  validation_errors TEXT[],
  created_at TIMESTAMP
);

CREATE TABLE document_retention_policies (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  document_type VARCHAR(50),
  retention_days INT,
  archive_after_days INT,
  delete_after_days INT,
  compliance_requirement VARCHAR(255), -- "GDPR", "HIPAA", etc.
  created_at TIMESTAMP
);
```

---

## 3. IoT Sensor Integration Dashboard

### Real-Time Cargo Monitoring

```
┌─────────────────────────────────────────┐
│  CARGO SENSOR DASHBOARD                 │
├─────────────────────────────────────────┤
│                                         │
│ ACTIVE SHIPMENTS WITH SENSORS: 47      │
│                                         │
│ ┌─ Tracking #1Z999AA10123456784       │
│ │                                      │
│ │ Temperature: 22.5°C [████████░░] 18°C target
│ │ Humidity: 45% [██████░░░░] 40-50% acceptable
│ │ Pressure: 101.3 kPa [████████████] Normal
│ │ Shock Events: 0/24 [████████████] No impacts
│ │ Tilt Alerts: 0 [████████████] Upright
│ │                                      │
│ │ Status: ✅ OPTIMAL | Last Update: 2 min ago
│ │                                      │
│ └─────────────────────────────────────┘
│
│ ┌─ Tracking #1Z888BB20987654321 [⚠️]
│ │                                      │
│ │ Temperature: 28.3°C [████████████] 🔴 ABOVE TARGET
│ │ Humidity: 65% [██████████░] Above acceptable
│ │ Pressure: 99.8 kPa [████████░░] Low
│ │ Shock Events: 3/24 [██░░░░░░░░] Minor impacts
│ │ Tilt Alerts: 2 [████████░░] Slight tilting
│ │                                      │
│ │ Status: ⚠️ WARNING | Last Update: 5 min ago
│ │ [VIEW HISTORY] [ESCALATE] [NOTIFY CARRIER]
│ │                                      │
│ └─────────────────────────────────────┘
│
└─────────────────────────────────────────┘
```

### IoT Data Models

```typescript
interface SensorReading {
  sensorId: string;
  shipmentId: string;
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // Percent (0-100)
  pressure: number; // kPa
  acceleration: {
    x: number; // m/s²
    y: number;
    z: number;
  };
  gpsLocation: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  batteryLevel: number; // Percent
  signalStrength: number; // -120 to 0 dBm (RSSI)
}

interface SensorAlert {
  id: string;
  sensorId: string;
  shipmentId: string;
  alertType: "temperature" | "humidity" | "shock" | "tilt" | "pressure";
  severity: "info" | "warning" | "critical";
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  notificationSent: boolean;
  escalationLevel: number; // 0-3
  recommendedAction: string;
}

interface SensorHealthcheck {
  sensorId: string;
  lastHeartbeat: Date;
  batteryLevel: number;
  signalQuality: "excellent" | "good" | "fair" | "poor";
  dataTransmissionRate: number; // readings/minute
  estimatedTimeToLowBattery: number; // hours
  calibrationStatus: "ok" | "needs_calibration" | "failed";
}
```

### Sensor Integration Schema

```sql
CREATE TABLE iot_sensors (
  id UUID PRIMARY KEY,
  serial_number VARCHAR(100) UNIQUE,
  device_type VARCHAR(50), -- "temperature", "multi_sensor", "gps_tracker"
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  firmware_version VARCHAR(50),
  status VARCHAR(50), -- "active", "inactive", "lost", "maintenance"
  last_seen TIMESTAMP,
  calibration_date DATE,
  next_calibration_date DATE,
  created_at TIMESTAMP
);

CREATE TABLE sensor_assignments (
  id UUID PRIMARY KEY,
  sensor_id UUID REFERENCES iot_sensors(id),
  shipment_id UUID REFERENCES shipments(id),
  carrier_id UUID REFERENCES carriers(id),
  assigned_at TIMESTAMP,
  unassigned_at TIMESTAMP,
  monitoring_type VARCHAR(50), -- "continuous", "scheduled", "triggered"
  alert_thresholds JSONB, -- Custom temperature, humidity ranges
  created_at TIMESTAMP
);

CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY,
  sensor_id UUID REFERENCES iot_sensors(id),
  shipment_id UUID REFERENCES shipments(id),
  reading_timestamp TIMESTAMP,
  temperature_c DECIMAL(5,2),
  humidity_percent DECIMAL(5,2),
  pressure_kpa DECIMAL(7,2),
  acceleration_x DECIMAL(7,4),
  acceleration_y DECIMAL(7,4),
  acceleration_z DECIMAL(7,4),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  altitude_m INT,
  battery_percent INT,
  signal_strength_dbm INT,
  created_at TIMESTAMP,
  INDEX(sensor_id, reading_timestamp),
  INDEX(shipment_id, reading_timestamp)
);

CREATE TABLE sensor_alerts (
  id UUID PRIMARY KEY,
  sensor_id UUID REFERENCES iot_sensors(id),
  shipment_id UUID REFERENCES shipments(id),
  alert_type VARCHAR(50),
  severity VARCHAR(50),
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  triggered_at TIMESTAMP,
  resolved_at TIMESTAMP,
  notification_sent BOOLEAN,
  notification_channels TEXT[], -- "email", "sms", "push"
  escalation_level INT,
  recommended_action TEXT,
  created_at TIMESTAMP
);
```

---

## 4. Dispute Resolution Portal

### Carrier-Side Dispute Management

```
┌────────────────────────────────────────┐
│  DISPUTE RESOLUTION CENTER             │
├────────────────────────────────────────┤
│                                        │
│ OPEN DISPUTES: 3        RESOLVED: 47  │
│                                        │
│ ┌─ Dispute #DISP-2024-001234         │
│ │  Type: Damage Claim                │
│ │  Shipment: 1Z999AA10123456784      │
│ │  Claimed Amount: $2,450.00         │
│ │  Claim Date: 2024-03-10            │
│ │  Status: Under Review              │
│ │  Days Open: 4                       │
│ │                                    │
│ │  Evidence Submitted:               │
│ │  ├─ POD with damage photos (3)    │
│ │  ├─ Product condition report      │
│ │  ├─ Invoice copy                  │
│ │  └─ Driver statement (1 page)     │
│ │                                    │
│ │  Our Response: Pending             │
│ │  [ADD EVIDENCE] [MESSAGE] [APPEAL] │
│ │                                    │
│ └────────────────────────────────────┘
│
│ ┌─ Dispute #DISP-2024-001235         │
│ │  Type: Overcharge                  │
│ │  Shipment: 1Z888BB20987654321      │
│ │  Claimed Amount: $185.50           │
│ │  Claim Date: 2024-03-08            │
│ │  Status: APPROVED ✅               │
│ │  Days to Resolution: 2             │
│ │  Resolution Date: 2024-03-10       │
│ │  Credit Applied: $185.50           │
│ │                                    │
│ └────────────────────────────────────┘
│
└────────────────────────────────────────┘
```

### Dispute Data Models

```typescript
interface DisputeSubmission {
  id: string;
  shipmentId: string;
  carrierId: string;
  driverId?: string;
  disputeType: "damage" | "loss" | "overcharge" | "service_failure" | "delay";
  claimedAmount: number;
  currency: string;
  description: string;
  submittedAt: Date;
  evidenceUrls: string[];
  claimantInfo: {
    name: string;
    email: string;
    phone: string;
    role: "driver" | "carrier" | "shipper";
  };
}

interface DisputeTimeline {
  disputeId: string;
  events: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: Date;
  eventType: "submitted" | "acknowledged" | "under_review" | "responded" | "resolved" | "escalated" | "appealed";
  actor: string;
  message: string;
  attachmentUrls?: string[];
}

interface DisputeResolution {
  disputeId: string;
  resolvedAt: Date;
  resolutionType: "approved" | "partial" | "denied" | "settled";
  approvedAmount: number;
  reason: string;
  resolvingOfficer: string;
  paymentMethod: "credit" | "refund" | "replacement";
  paymentDueDate: Date;
}
```

### Dispute Management Schema

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  shipment_id UUID REFERENCES shipments(id),
  carrier_id UUID REFERENCES carriers(id),
  driver_id UUID REFERENCES drivers(id),
  dispute_type VARCHAR(50),
  claimed_amount DECIMAL(15,2),
  currency VARCHAR(3),
  description TEXT,
  submitted_at TIMESTAMP,
  status VARCHAR(50), -- "open", "under_review", "resolved", "appealed"
  priority VARCHAR(50), -- "low", "normal", "high", "critical"
  assigned_to UUID REFERENCES auth.users(id),
  days_open INT,
  created_at TIMESTAMP
);

CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  evidence_type VARCHAR(50), -- "photo", "document", "report", "statement"
  file_url VARCHAR(500),
  submitted_by VARCHAR(100),
  submitted_at TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE dispute_messages (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  sender_id UUID REFERENCES auth.users(id),
  sender_role VARCHAR(50), -- "shipper", "carrier", "koho_staff"
  message_text TEXT,
  attachment_urls TEXT[],
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE dispute_resolutions (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES disputes(id),
  resolved_at TIMESTAMP,
  resolution_type VARCHAR(50), -- "approved", "partial", "denied", "settled"
  approved_amount DECIMAL(15,2),
  resolution_reason TEXT,
  resolving_officer_id UUID REFERENCES auth.users(id),
  payment_method VARCHAR(50),
  payment_due_date DATE,
  payment_completed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 5. Carrier Capacity Forecasting

### Predictive Capacity Planning

```
┌────────────────────────────────────────┐
│  CAPACITY FORECASTING DASHBOARD        │
├────────────────────────────────────────┤
│                                        │
│ CURRENT CAPACITY UTILIZATION: 78%      │
│ [███████░░] Approaching peak capacity  │
│                                        │
│ FORECAST (Next 30 Days)                │
│                                        │
│ Week 1 (Mar 14-20):  [██████░░░░] 62% │
│ Week 2 (Mar 21-27):  [████████░░░] 75%│
│ Week 3 (Mar 28-Apr3): [██████████░] 88%
│ Week 4 (Apr 4-10):   [██████████░] 85%│
│                                        │
│ Recommendations:                       │
│ ✓ Week 3 may exceed capacity by 12%   │
│ ✓ Consider adding subcontractors       │
│ ✓ Optimize route consolidation        │
│                                        │
│ VEHICLE UTILIZATION BY TYPE:           │
│ ├─ Vans (20): [██████░░░░] 62%        │
│ ├─ Small Trucks (15): [███████░░░] 71%
│ └─ Large Trucks (8): [████████░░] 78% │
│                                        │
│ DRIVER AVAILABILITY:                   │
│ ├─ Available: 32/45 (71%)             │
│ ├─ On Route: 12/45 (27%)              │
│ └─ Off Duty: 1/45 (2%)                │
│                                        │
└────────────────────────────────────────┘
```

### Capacity Forecasting Models

```typescript
interface CapacityForecast {
  carrierId: string;
  forecastDate: Date;
  forecastPeriod: "daily" | "weekly" | "monthly";
  predictions: CapacityPrediction[];
  confidence: number; // 0-100
  modelVersion: string;
  lastTrainedAt: Date;
}

interface CapacityPrediction {
  date: Date;
  predictedShipments: number;
  currentCapacity: number;
  utilizationPercent: number;
  forecast_low: number; // 80th percentile
  forecast_high: number; // 95th percentile
  confidence: number;
  factors: {
    seasonality: number;
    trend: number;
    promotionalEvents: string[];
    historicalGrowth: number;
  };
}

interface VehicleAvailability {
  carrierId: string;
  date: Date;
  totalFleet: number;
  availableVehicles: number;
  onRoute: number;
  maintenance: number;
  offDuty: number;
  byVehicleType: {
    type: string;
    total: number;
    available: number;
    utilizationRate: number;
  }[];
}

interface CapacityAlert {
  id: string;
  carrierId: string;
  alertType: "capacity_overrun" | "driver_shortage" | "maintenance_due" | "fleet_expansion_recommended";
  severity: "info" | "warning" | "critical";
  affectedDate: Date;
  predictedUtilization: number;
  recommendedAction: string;
  estimatedImpact: string;
  createdAt: Date;
}

// ML Model for Capacity Forecasting
async function generateCapacityForecast(
  carrierId: string,
  forecastDays: number
): Promise<CapacityForecast> {
  // 1. Gather historical data (past 12 months)
  const historicalData = await getHistoricalShipments(carrierId, 365);

  // 2. Extract features
  const features = extractCapacityFeatures(historicalData);
  // - Day of week seasonality
  // - Month seasonality
  // - Holiday effects
  // - Promotional period impacts
  // - Year-over-year growth trend

  // 3. Train/load ARIMA model
  const model = await loadOrTrainModel("arima_capacity_" + carrierId);

  // 4. Generate predictions
  const predictions = model.forecast(forecastDays);

  // 5. Calculate confidence intervals
  const withConfidence = predictions.map((pred) => ({
    ...pred,
    forecast_low: pred.value - pred.stdError * 1.28, // 80th percentile
    forecast_high: pred.value + pred.stdError * 1.96, // 95th percentile
  }));

  return {
    carrierId,
    forecastDate: new Date(),
    forecastPeriod: "daily",
    predictions: withConfidence,
    confidence: 85, // Model accuracy
    modelVersion: "ARIMA-v2.1",
    lastTrainedAt: new Date(),
  };
}
```

### Capacity Planning Database Schema

```sql
CREATE TABLE carrier_capacity_profile (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  max_daily_shipments INT,
  max_weekly_shipments INT,
  current_fleet_size INT,
  vehicle_types JSONB, -- {"van": 20, "truck": 15, "motorcycle": 10}
  average_delivery_time_minutes INT,
  peak_capacity_days VARCHAR(50)[], -- ["Monday", "Friday"]
  seasonal_capacity_multiplier DECIMAL(3,2),
  updated_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE capacity_forecasts (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  forecast_date DATE,
  forecast_period VARCHAR(50),
  predicted_shipments INT,
  current_capacity INT,
  utilization_percent INT,
  confidence_score DECIMAL(5,2),
  model_version VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE capacity_utilization_history (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  date DATE,
  shipment_count INT,
  capacity_available INT,
  utilization_percent DECIMAL(5,2),
  peak_hour VARCHAR(50),
  peak_volume INT,
  created_at TIMESTAMP
);

CREATE TABLE capacity_alerts (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  alert_type VARCHAR(50),
  severity VARCHAR(50),
  affected_date DATE,
  predicted_utilization INT,
  recommended_action TEXT,
  estimated_impact TEXT,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE vehicle_assignments (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  vehicle_id VARCHAR(100),
  vehicle_type VARCHAR(50),
  license_plate VARCHAR(50),
  capacity_weight_kg INT,
  capacity_volume_m3 DECIMAL(10,2),
  status VARCHAR(50), -- "active", "maintenance", "retired"
  current_route_id UUID,
  mileage_km BIGINT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  created_at TIMESTAMP
);

CREATE TABLE driver_availability (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  driver_id UUID REFERENCES drivers(id),
  date DATE,
  status VARCHAR(50), -- "available", "on_route", "maintenance", "off_duty"
  shift_start TIME,
  shift_end TIME,
  max_hours_per_day INT,
  hours_utilized INT,
  created_at TIMESTAMP
);
```

---

## 6. API Endpoints for Carrier Operations

```
# Driver Mobile App APIs
POST   /api/driver/auth/login                    # Driver authentication
POST   /api/driver/auth/logout                   # Logout
GET    /api/driver/deliveries                    # Get today's delivery queue
POST   /api/driver/deliveries/:id/confirm        # Confirm delivery
POST   /api/driver/deliveries/:id/damage-report  # Report damage
POST   /api/driver/documents/upload              # Upload POD/document
GET    /api/driver/documents/extract             # Get OCR extraction
GET    /api/driver/route/current                 # Get current route info
POST   /api/driver/route/location-ping           # Send GPS location
GET    /api/driver/earnings/today                # Get today's earnings

# Sensor Integration APIs
POST   /api/sensors/reading                      # Submit sensor reading
GET    /api/sensors/:id/status                   # Get sensor health
POST   /api/sensors/alert                        # Trigger alert
GET    /api/shipments/:id/sensor-data            # Get all sensor data
GET    /api/sensors/alerts                       # List active alerts

# Dispute Management APIs
GET    /api/disputes                             # List carrier disputes
POST   /api/disputes                             # Submit new dispute
GET    /api/disputes/:id                         # Get dispute details
POST   /api/disputes/:id/evidence                # Add evidence
POST   /api/disputes/:id/message                 # Post message
GET    /api/disputes/:id/timeline                # Get dispute timeline
POST   /api/disputes/:id/appeal                  # Appeal resolution

# Capacity Forecasting APIs
GET    /api/carriers/:id/capacity/current        # Current utilization
GET    /api/carriers/:id/capacity/forecast       # Capacity forecast
GET    /api/carriers/:id/vehicles/availability   # Vehicle availability
GET    /api/carriers/:id/drivers/availability    # Driver availability
POST   /api/carriers/:id/capacity/alert          # Set capacity alert
GET    /api/carriers/:id/capacity/recommendations # Get recommendations

# Document Management APIs
POST   /api/documents/upload                     # Upload document
POST   /api/documents/:id/ocr-extract            # Run OCR extraction
GET    /api/documents/:id                        # Get document
DELETE /api/documents/:id                        # Delete document
GET    /api/documents/:id/extraction-result      # Get OCR result
```

---

## 7. Real-Time Notification System

### Message Queue Architecture

```typescript
// WebSocket notifications for driver app
interface DriverNotification {
  id: string;
  driverId: string;
  type: "new_delivery" | "route_change" | "sensor_alert" | "dispute_update" | "earnings_notification";
  priority: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  actionUrl?: string;
  data: Record<string, any>;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt: Date;
}

// Push notification integration
interface PushNotificationConfig {
  provider: "fcm" | "apns"; // Firebase Cloud Messaging / Apple Push Notification service
  deviceTokens: string[];
  sound: string;
  vibration: boolean;
  badge: number;
}

async function notifyDriverOfNewDelivery(driverId: string, delivery: any) {
  const notification: DriverNotification = {
    id: generateId(),
    driverId,
    type: "new_delivery",
    priority: "high",
    title: "New Delivery Added",
    body: `${delivery.recipientName} at ${delivery.address}`,
    actionUrl: `/deliveries/${delivery.id}`,
    data: { deliveryId: delivery.id, address: delivery.address },
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  // 1. Save to database
  await saveNotification(notification);

  // 2. Send via WebSocket if driver is online
  if (isDriverOnline(driverId)) {
    await sendWebSocketMessage(driverId, notification);
  }

  // 3. Send push notification if configured
  const config = await getPushNotificationConfig(driverId);
  if (config) {
    await sendPushNotification(config, notification);
  }
}
```

---

## 8. Implementation Roadmap

### Sprint 10: Mobile App Foundation (Weeks 19-20)
- React Native project setup
- Authentication & biometric login
- Delivery queue and navigation
- Delivery confirmation workflow
- Photo capture and POD upload

### Sprint 11: Document OCR & IoT (Weeks 21-22)
- OCR engine integration
- Document extraction pipeline
- IoT sensor data ingestion
- Real-time sensor dashboard
- Alert threshold configuration

### Sprint 12: Disputes & Capacity (Weeks 23-24)
- Dispute submission form
- Evidence upload system
- Timeline/communication threads
- Capacity forecasting model
- Availability calendar

### Sprint 17: Advanced Features (Weeks 33-34)
- Offline support and sync
- Advanced route optimization
- Performance analytics for drivers
- Integration with external telematics
- ML model improvements

---

## 9. Key Metrics & SLAs

```
Driver Experience:
├─ App response time < 500ms
├─ Photo upload < 10 seconds (per photo)
├─ Delivery confirmation < 30 seconds
├─ GPS location update interval: 30 seconds
└─ Push notification delivery < 5 seconds

OCR Accuracy:
├─ Field extraction > 95%
├─ Barcode recognition > 98%
├─ Signature detection > 90%
└─ Processing time < 3 seconds

Sensor Integration:
├─ Data transmission interval: 5 minutes (normal), 30 seconds (alert mode)
├─ Battery life: 30+ days per charge
├─ Data loss: < 0.1%
└─ Alert notification latency < 2 minutes

Dispute Resolution:
├─ Average resolution time < 15 days
├─ First response time < 24 hours
├─ Evidence processing accuracy > 95%
└─ Customer satisfaction > 85%

Capacity Forecasting:
├─ Forecast accuracy (MAPE) < 12%
├─ Prediction latency < 1 second
├─ Model retraining: weekly
└─ Alert accuracy > 88%
```

---

## 10. Security & Compliance

```
Mobile App Security:
- End-to-end encryption for sensitive data
- Biometric authentication
- JWT token expiration (15 minutes)
- Certificate pinning for API calls
- Local data encryption (AES-256)

Document Security:
- Encrypted file storage (AES-256)
- OCR processing on secure servers
- Data retention policies enforcement
- GDPR-compliant deletion workflows

IoT Security:
- Sensor firmware encryption
- Secure WebSocket (TLS 1.3)
- Sensor authentication via certificates
- Anomaly detection for suspicious readings

Dispute Data Protection:
- PII masking in communications
- Evidence encryption in transit/rest
- Access audit logs
- 90-day retention after closure
```

---

**Status:** Specification Complete
**Last Updated:** March 2026
**Ready for:** Development Phase - Sprint 10
