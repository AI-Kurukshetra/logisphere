# Logistics & Supply Chain Manager Dashboard - Comprehensive Module

## Module Overview
**Purpose:** Real-time operational control center for logistics managers
**Target User:** Logistics Managers, Supply Chain Coordinators, Operations Teams
**Status:** Advanced Feature (Sprints 3, 6-7, 15)
**Priority:** High - Core Operations

---

## 1. Real-Time Shipment Tracking Interface

### Unified Multi-Carrier Tracking View

```
┌─────────────────────────────────────────────────────────────┐
│  ACTIVE SHIPMENTS (1,247)                    [Filter] [View] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Tracking #1Z999AA10123456784 (FedEx)                    │
│ │ ├─ Status: In Transit                                    │
│ │ ├─ Current: Memphis, TN Distribution Center              │
│ │ ├─ Est. Delivery: Today, 5:30 PM                        │
│ │ ├─ Progress: [████████░░] 80%                           │
│ │ └─ Last Update: 2 hours ago                             │
│                                                              │
│ ┌─ Tracking #1Z888BB20987654321 (UPS)                      │
│ │ ├─ Status: Out for Delivery                              │
│ │ ├─ Current: 42.3521° N, 83.0455° W (Detroit, MI)        │
│ │ ├─ Est. Delivery: Today, 4:15 PM                        │
│ │ ├─ Progress: [█████████░] 90%                           │
│ │ └─ Last Update: 15 min ago                              │
│                                                              │
│ ┌─ Tracking #1Z777CC30456789012 (XPO)        [DELAYED]    │
│ │ ├─ Status: Exception - Delayed                           │
│ │ ├─ Reason: Traffic congestion on planned route           │
│ │ ├─ Current: Indianapolis, IN                             │
│ │ ├─ Est. Delivery: Tomorrow, 10:00 AM (+4hrs)            │
│ │ ├─ Progress: [██████░░░░] 60%                           │
│ │ └─ Last Update: 30 min ago [ASSIGN TO ME]               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Map View:
┌─────────────────────────────────────────────────────────────┐
│  [🗺 TRACKING MAP]                              [Satellite] │
│                                                              │
│  [FedEx carrier symbol] ▲ Memphis Hub                       │
│                          |                                   │
│  [UPS carrier symbol]    ◆ Detroit (Out for Delivery)       │
│                                                              │
│  [XPO carrier symbol]    ⚠ Indianapolis (Delayed)           │
│                                                              │
│  [Destination marker]    ● Chicago Distribution Center      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### React Component Architecture

```typescript
// Core Components
<ShipmentTrackingDashboard>
  ├── <ShipmentListPanel>
  │   ├── <ShipmentCard>
  │   │   ├── <TrackingNumberBadge>
  │   │   ├── <StatusIndicator>
  │   │   ├── <ProgressBar>
  │   │   ├── <TimelinePreview>
  │   │   └── <QuickActionButtons>
  │   ├── <FilterBar>
  │   │   ├── <StatusFilter>
  │   │   ├── <CarrierFilter>
  │   │   ├── <DateRangeFilter>
  │   │   └── <SearchBox>
  │   └── <VirtualizedList> (1000+ items)
  │
  ├── <TrackingMapView>
  │   ├── <MapContainer> (Mapbox/Leaflet)
  │   ├── <ShipmentMarker>
  │   ├── <RoutePolyline>
  │   ├── <ZoomControls>
  │   └── <MapLegend>
  │
  ├── <DetailPanel>
  │   ├── <ShipmentHeader>
  │   ├── <TimelineView>
  │   │   └── <TimelineEvent>
  │   ├── <LocationTimeline>
  │   ├── <DocumentViewer>
  │   └── <ActionButtons>
  │
  └── <RealtimeIndicator>
      ├── <LastUpdateTime>
      ├── <ConnectionStatus>
      └── <RefreshButton>
```

### WebSocket Real-Time Updates

```typescript
// WebSocket Connection
interface TrackingUpdate {
  shipmentId: string;
  trackingNumber: string;
  status: "created" | "picked_up" | "in_transit" | "delivered" | "exception";
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  };
  lastUpdate: timestamp;
  estimatedDelivery: Date;
  eventType: string;
  eventDescription: string;
  timestamp: timestamp;
}

// WebSocket Events
interface WebSocketMessage {
  type: "tracking.update" | "shipment.created" | "shipment.exception" | "heartbeat";
  data: TrackingUpdate;
  timestamp: timestamp;
}

// Client-side Subscription
const trackingSocket = new WebSocket('wss://api.logisphere.app/ws/tracking');

trackingSocket.addEventListener('message', (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);

  if (message.type === 'tracking.update') {
    // Update map marker
    updateMarkerLocation(message.data.shipmentId, message.data.location);

    // Update list view
    updateShipmentStatus(message.data.shipmentId, message.data.status);

    // Add timeline event
    addTimelineEvent(message.data.shipmentId, message.data);

    // Play notification sound
    playNotificationSound(message.data.status);
  }
});

// Subscribe to specific shipments
trackingSocket.send(JSON.stringify({
  action: 'subscribe',
  shipmentIds: ['ship_123', 'ship_456', 'ship_789']
}));
```

### Tracking Data Structure

```json
{
  "shipment": {
    "id": "ship_a1b2c3d4",
    "trackingNumber": "1Z999AA10123456784",
    "carrier": {
      "id": "carrier_fdx",
      "name": "FedEx",
      "logo": "https://cdn.logisphere.app/carriers/fedex.png"
    },
    "status": "in_transit",
    "progress": {
      "percent": 80,
      "stage": "in_transit"
    },
    "origin": {
      "facility": "Los Angeles Distribution Center",
      "address": "2830 North Main St, Los Angeles, CA 90001",
      "timestamp": "2024-01-15T08:00:00Z"
    },
    "destination": {
      "facility": "Chicago Distribution Center",
      "address": "5555 W Lawrence Ave, Chicago, IL 60630",
      "expectedDate": "2024-01-17T18:00:00Z"
    },
    "currentLocation": {
      "latitude": 35.0731,
      "longitude": -89.7673,
      "city": "Memphis",
      "state": "TN",
      "country": "USA",
      "timestamp": "2024-01-16T14:30:00Z"
    },
    "events": [
      {
        "timestamp": "2024-01-15T08:00:00Z",
        "type": "picked_up",
        "description": "Picked up from shipper",
        "location": { "city": "Los Angeles", "state": "CA" }
      },
      {
        "timestamp": "2024-01-15T22:15:00Z",
        "type": "in_transit",
        "description": "In transit to Memphis Hub",
        "location": { "city": "Memphis", "state": "TN" }
      },
      {
        "timestamp": "2024-01-16T14:30:00Z",
        "type": "in_transit",
        "description": "Departed Memphis Hub",
        "location": { "city": "Memphis", "state": "TN" }
      }
    ],
    "estimatedDelivery": "2024-01-17T18:00:00Z",
    "actualDelivery": null,
    "lastUpdate": "2024-01-16T14:30:00Z"
  }
}
```

---

## 2. Rate Shopping Engine

### Real-Time Rate Comparison Interface

```
┌─────────────────────────────────────────────────────────────┐
│  RATE SHOPPING ENGINE                         [Get Quote]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Origin: [Los Angeles, CA ▼]                                 │
│ Destination: [Chicago, IL ▼]                                │
│ Weight: [25 lbs ▼]                                          │
│ Service: [Ground ▼]                                         │
│ Date Needed: [01/17/2024 ▼]                                 │
│                                                              │
│ [GENERATE QUOTES]                                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ BEST PRICE OPTIONS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. 🏆 XPO Logistics                    [RECOMMENDED]       │
│    ├─ Cost: $42.30                                         │
│    ├─ Service: 3-day Ground                                │
│    ├─ Est. Delivery: Jan 18, 10:00 AM                      │
│    ├─ Carrier Score: 4.2/5 (90% on-time)                   │
│    ├─ Your Discount: 15% (contract)                        │
│    └─ [SELECT] [DETAILS]                                   │
│                                                              │
│ 2. FedEx Ground                         [SAVINGS: $3.30]   │
│    ├─ Cost: $45.60                                         │
│    ├─ Service: 2-day Ground                                │
│    ├─ Est. Delivery: Jan 17, 5:30 PM                       │
│    ├─ Carrier Score: 4.8/5 (95% on-time)                   │
│    ├─ Your Discount: 12% (contract)                        │
│    └─ [SELECT] [DETAILS]                                   │
│                                                              │
│ 3. UPS Ground                                              │
│    ├─ Cost: $48.20                                         │
│    ├─ Service: 2-day Ground                                │
│    ├─ Est. Delivery: Jan 17, 4:15 PM                       │
│    ├─ Carrier Score: 4.5/5 (92% on-time)                   │
│    ├─ Your Discount: 10% (contract)                        │
│    └─ [SELECT] [DETAILS]                                   │
│                                                              │
│ Savings Analysis:                                          │
│ • Best Price Option: Save $3.30 vs FedEx (7%)             │
│ • Best Service Option: FedEx (95% on-time, $45.60)        │
│ • Best Overall: XPO (42% less, 4.2/5 score)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Rate Shopping Components

```typescript
<RateShoppingEngine>
  ├── <QuoteRequestForm>
  │   ├── <OriginInput> (autocomplete)
  │   ├── <DestinationInput> (autocomplete)
  │   ├── <WeightInput>
  │   ├── <ServiceTypeSelect>
  │   ├── <DatePicker>
  │   ├── <AccessorialsSelector>
  │   └── <GenerateQuoteButton>
  │
  ├── <RateOptionsComparison>
  │   ├── <PriceSortButton>
  │   ├── <ServiceSortButton>
  │   ├── <ScoreSortButton>
  │   └── <RateCard> (repeating)
  │       ├── <CarrierLogo>
  │       ├── <PriceDisplay>
  │       ├── <ServiceInfo>
  │       ├── <DeliveryEstimate>
  │       ├── <PerformanceScore>
  │       ├── <DiscountBadge>
  │       ├── <RecommendationBadge>
  │       └── <SelectButton>
  │
  └── <SavingsAnalysis>
      ├── <ComparisonChart>
      ├── <SavingsMetrics>
      └── <LaneHistory>
```

### Rate Quote JSON Structure

```json
{
  "quoteRequest": {
    "id": "quote_req_12345",
    "origin": {
      "postalCode": "90001",
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA"
    },
    "destination": {
      "postalCode": "60630",
      "city": "Chicago",
      "state": "IL",
      "country": "USA"
    },
    "shipmentDetails": {
      "weight": 25,
      "weightUnit": "lbs",
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 10,
        "unit": "inches"
      },
      "serviceType": "ground",
      "requestedDeliveryDate": "2024-01-17"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-16T10:30:00Z"
  },
  "rateOptions": [
    {
      "id": "rate_opt_xpo_001",
      "carrier": {
        "id": "carrier_xpo",
        "name": "XPO Logistics",
        "code": "XPO",
        "performanceScore": 4.2,
        "onTimePercent": 90,
        "logo": "https://cdn.logisphere.app/carriers/xpo.png"
      },
      "pricing": {
        "baseRate": 42.30,
        "currency": "USD",
        "discount": {
          "percent": 15,
          "reason": "contract_discount",
          "finalPrice": 35.96
        },
        "accessorials": 0,
        "totalCost": 35.96
      },
      "service": {
        "type": "ground",
        "days": 3,
        "estimatedDelivery": "2024-01-18T10:00:00Z"
      },
      "contractId": "contract_xpo_2024",
      "recommendation": {
        "label": "best_price",
        "savings": 10.0,
        "savingsPercent": 22.1
      },
      "ranking": 1
    },
    {
      "id": "rate_opt_fdx_001",
      "carrier": {
        "id": "carrier_fdx",
        "name": "FedEx",
        "code": "FDX",
        "performanceScore": 4.8,
        "onTimePercent": 95,
        "logo": "https://cdn.logisphere.app/carriers/fedex.png"
      },
      "pricing": {
        "baseRate": 45.60,
        "currency": "USD",
        "discount": {
          "percent": 12,
          "reason": "contract_discount",
          "finalPrice": 40.13
        },
        "accessorials": 0,
        "totalCost": 40.13
      },
      "service": {
        "type": "ground",
        "days": 2,
        "estimatedDelivery": "2024-01-17T17:30:00Z"
      },
      "contractId": "contract_fdx_2024",
      "recommendation": {
        "label": "best_service",
        "reasoning": "highest on-time rate"
      },
      "ranking": 2
    }
  ],
  "analysis": {
    "bestPrice": {
      "carrierId": "carrier_xpo",
      "price": 35.96,
      "savings": 10.0
    },
    "bestService": {
      "carrierId": "carrier_fdx",
      "score": 4.8
    },
    "bestOverall": {
      "carrierId": "carrier_xpo",
      "reasoning": "Optimal balance of price and performance"
    }
  }
}
```

---

## 3. Exception Management System

### Exception Detection & Workflow

```
EXCEPTION TYPES:
├─ Tracking Exceptions
│  ├─ Delayed (est. delivery exceeded)
│  ├─ Lost in Transit (no update 7+ days)
│  ├─ Returned to Sender
│  └─ Misdelivered
│
├─ Billing Exceptions
│  ├─ Overcharge (rate mismatch)
│  ├─ Duplicate Invoice
│  ├─ Service Mismatch
│  └─ Unauthorized Charges
│
└─ Operational Exceptions
   ├─ Failed Delivery Attempt
   ├─ Address Issue
   ├─ Signature Required - Refused
   └─ Damaged Package
```

### Exception Alert Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  EXCEPTION MANAGEMENT                  [Open: 47] [Today: 3]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ CRITICAL EXCEPTIONS (5)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🔴 URGENT: Shipment Lost - Tracking #1Z777CC30456789012    │
│    ├─ Type: Lost in Transit                                │
│    ├─ Carrier: XPO Logistics                               │
│    ├─ Last Update: 7 days ago (Memphis Hub)                │
│    ├─ Impact: $2,500 + $150 shipping                       │
│    ├─ Auto-Escalated: Yes (7-day rule)                     │
│    ├─ Status: [Awaiting Carrier Response]                  │
│    ├─ Action Items: [CONTACT CARRIER] [OPEN DISPUTE]       │
│    └─ Assigned to: [John Smith]                            │
│                                                              │
│ 🔴 DELAYED: Shipment #1Z999AA10123456784                   │
│    ├─ Type: Delivery Overdue                               │
│    ├─ Carrier: FedEx                                       │
│    ├─ Original Estimate: Jan 17, 5:30 PM                   │
│    ├─ Current Status: In Transit, Memphis Hub              │
│    ├─ Days Late: 2 days                                    │
│    ├─ Estimated New Delivery: Jan 19, 2:00 PM              │
│    ├─ Auto-Notification: Customer notified 1 hour ago      │
│    ├─ Action Items: [CONTACT CUSTOMER] [UPDATE ETA]        │
│    └─ Assigned to: [Sarah Jones]                           │
│                                                              │
│ ⚠️  WARNING: Invoice Exception - INV-2024-05432             │
│    ├─ Type: Overcharge Detected                            │
│    ├─ Carrier: UPS                                         │
│    ├─ Billed Rate: $52.30 vs Contract: $47.80              │
│    ├─ Variance: $4.50 (9.4%)                               │
│    ├─ Auto-Flagged: Audit engine (Rule: Rate Validation)   │
│    ├─ Status: [Awaiting Finance Review]                    │
│    ├─ Action Items: [CONTACT CARRIER] [REQUEST CREDIT]     │
│    └─ Assigned to: [Finance Team]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Exception Components

```typescript
<ExceptionManagementSystem>
  ├── <ExceptionDashboard>
  │   ├── <ExceptionCounters>
  │   │   ├── <CriticalBadge>
  │   │   ├── <WarningBadge>
  │   │   ├── <TodayBadge>
  │   │   └── <AssignedToMeBadge>
  │   │
  │   ├── <ExceptionListView>
  │   │   ├── <FilterByType>
  │   │   ├── <FilterBySeverity>
  │   │   ├── <FilterByCarrier>
  │   │   ├── <SortOptions>
  │   │   └── <ExceptionCard> (repeating)
  │   │       ├── <SeverityIndicator>
  │   │       ├── <ExceptionTitle>
  │   │       ├── <AffectedEntity>
  │   │       ├── <ImpactMetrics>
  │   │       ├── <TimelineInfo>
  │   │       ├── <AssigneeInfo>
  │   │       ├── <ActionButtons>
  │   │       └── <StatusBadge>
  │   │
  │   └── <DetailPanel>
  │       ├── <TimelineView>
  │       ├── <CommunicationHistory>
  │       ├── <ResolutionActions>
  │       └── <DocumentAttachments>
  │
  └── <AutoEscalation>
      ├── <RuleEngine>
      ├── <NotificationSystem>
      └── <AssignmentLogic>
```

### Exception JSON Structure

```json
{
  "exception": {
    "id": "exc_crit_001",
    "type": "tracking_exception",
    "subType": "lost_in_transit",
    "severity": "critical",
    "shipment": {
      "id": "ship_b2c3d4e5",
      "trackingNumber": "1Z777CC30456789012",
      "carrier": {
        "id": "carrier_xpo",
        "name": "XPO Logistics"
      }
    },
    "timeline": {
      "createdAt": "2024-01-09T14:30:00Z",
      "detectedAt": "2024-01-16T08:00:00Z",
      "lastUpdateFromCarrier": "2024-01-09T22:15:00Z"
    },
    "details": {
      "description": "Package has not been updated for 7 days. Last known location: Memphis Hub, TN",
      "lastKnownLocation": {
        "facility": "Memphis Hub",
        "city": "Memphis",
        "state": "TN",
        "timestamp": "2024-01-09T22:15:00Z"
      },
      "estimatedDelivery": "2024-01-11T18:00:00Z",
      "daysWithoutUpdate": 7
    },
    "impact": {
      "financial": {
        "shipmentValue": 2500.00,
        "potentialRecovery": 150.00,
        "currency": "USD"
      },
      "operational": {
        "customerAffected": "Acme Corp",
        "orderNumber": "ORD-2024-98765"
      }
    },
    "status": "awaiting_carrier_response",
    "assignedTo": {
      "userId": "user_123",
      "name": "John Smith",
      "role": "operations_manager"
    },
    "autoEscalation": {
      "triggered": true,
      "rule": "7_day_no_update",
      "escalatedAt": "2024-01-16T08:00:00Z"
    },
    "resolution": {
      "attempts": [
        {
          "type": "carrier_contact",
          "timestamp": "2024-01-16T09:30:00Z",
          "method": "email",
          "status": "awaiting_response"
        },
        {
          "type": "customer_notification",
          "timestamp": "2024-01-16T10:00:00Z",
          "method": "email",
          "status": "sent"
        }
      ],
      "actions": [
        {
          "action": "contact_carrier",
          "priority": "high",
          "status": "pending"
        },
        {
          "action": "open_dispute",
          "priority": "high",
          "status": "available"
        },
        {
          "action": "initiate_claim",
          "priority": "medium",
          "status": "available"
        }
      ]
    }
  }
}
```

---

## 4. Carrier Performance Scorecards

### Dynamic Scoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  CARRIER PERFORMANCE SCORECARDS               [Export] [PDF] │
├─────────────────────────────────────────────────────────────┤
│ Period: [January 2024 ▼]  View: [Monthly ▼] [Trend ▼]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🏆 1. FedEx                                    Score: 4.8/5  │
│    ├─ On-Time Delivery: 95% (4.8/5) ████████░░             │
│    ├─ Billing Accuracy: 99% (5.0/5) ██████████             │
│    ├─ Service Quality: 92% (4.6/5) █████████░              │
│    ├─ Responsiveness: <12hrs (5.0/5) ██████████            │
│    ├─ Trend: ↑ Improving                                   │
│    ├─ Volume: 342 shipments                                │
│    ├─ Spend: $15,420                                       │
│    ├─ Exceptions: 25 (7.3%)                                │
│    ├─ Contract: Negotiated Rate (12% discount)            │
│    └─ [VIEW DETAILS] [ANALYSIS]                            │
│                                                              │
│ 2. XPO Logistics                               Score: 4.2/5  │
│    ├─ On-Time Delivery: 89% (4.4/5) ████████░░             │
│    ├─ Billing Accuracy: 97% (4.8/5) █████████░             │
│    ├─ Service Quality: 85% (4.2/5) ████████░░              │
│    ├─ Responsiveness: 18hrs (4.0/5) ████████░░             │
│    ├─ Trend: ↑ Slight improvement                          │
│    ├─ Volume: 298 shipments                                │
│    ├─ Spend: $12,850                                       │
│    ├─ Exceptions: 32 (10.7%)                               │
│    ├─ Contract: Standard (15% discount)                    │
│    └─ [VIEW DETAILS] [ANALYSIS]                            │
│                                                              │
│ 3. UPS                                         Score: 4.5/5  │
│    ├─ On-Time Delivery: 93% (4.6/5) █████████░             │
│    ├─ Billing Accuracy: 95% (4.7/5) █████████░             │
│    ├─ Service Quality: 90% (4.5/5) █████████░              │
│    ├─ Responsiveness: 14hrs (4.2/5) ████████░░             │
│    ├─ Trend: ↓ Slight decline                              │
│    ├─ Volume: 215 shipments                                │
│    ├─ Spend: $11,200                                       │
│    ├─ Exceptions: 19 (8.8%)                                │
│    ├─ Contract: Standard (10% discount)                    │
│    └─ [VIEW DETAILS] [ANALYSIS]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Historical Trend Chart:
┌─────────────────────────────────────────────────────────────┐
│ FedEx Trend                                                  │
│ 5.0 ┤                          ●                             │
│ 4.9 ┤                    ●         ●                         │
│ 4.8 ┤              ●  ●     ●  ●  ●  ←Current             │
│ 4.7 ┤        ●  ●  ●                  ●                    │
│ 4.6 ┤  ●  ●                                ●  ●             │
│ 4.5 ├──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──                 │
│     Dec  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug            │
│ Status: ↑ 3.2% improvement YoY                             │
└─────────────────────────────────────────────────────────────┘
```

### Performance Scorecard Components

```typescript
<CarrierScorecardsView>
  ├── <ScorecardHeader>
  │   ├── <PeriodSelector>
  │   ├── <ViewToggle>
  │   └── <ExportButton>
  │
  ├── <ScorecardRanking>
  │   └── <CarrierScoreCard> (repeating)
  │       ├── <RankingBadge>
  │       ├── <CarrierLogo>
  │       ├── <OverallScore>
  │       ├── <ScoreBreakdown>
  │       │   ├── <MetricBar>
  │       │   │   ├── OnTimeDelivery
  │       │   │   ├── BillingAccuracy
  │       │   │   ├── ServiceQuality
  │       │   │   └── Responsiveness
  │       ├── <TrendIndicator>
  │       ├── <OperationalMetrics>
  │       │   ├── Volume
  │       │   ├── Spend
  │       │   ├── Exceptions
  │       │   └── ContractInfo
  │       └── <ActionButtons>
  │
  ├── <DetailPanel>
  │   ├── <MetricAnalysis>
  │   ├── <TrendChart>
  │   ├── <ComparisonBenchmark>
  │   └── <RecommendationCards>
  │
  └── <BulkActions>
      ├── <ExportAllScores>
      ├── <EmailScorecard>
      └── <ShareWithTeam>
```

### Scorecard JSON Structure

```json
{
  "scorecards": [
    {
      "period": "2024-01",
      "carrier": {
        "id": "carrier_fdx",
        "name": "FedEx",
        "code": "FDX"
      },
      "overallScore": 4.8,
      "metrics": {
        "onTimeDelivery": {
          "percent": 95,
          "score": 4.8,
          "weight": 0.4,
          "target": 95
        },
        "billingAccuracy": {
          "percent": 99,
          "score": 5.0,
          "weight": 0.3,
          "target": 98
        },
        "serviceQuality": {
          "percent": 92,
          "score": 4.6,
          "weight": 0.2,
          "target": 97
        },
        "responsiveness": {
          "avgResponseTimeHours": 11.5,
          "score": 5.0,
          "weight": 0.1,
          "target": 12
        }
      },
      "operationalMetrics": {
        "shipmentCount": 342,
        "totalSpend": 15420.50,
        "exceptionCount": 25,
        "exceptionRate": 0.073
      },
      "trend": {
        "direction": "up",
        "monthOverMonthChange": 2.3,
        "yearOverYearChange": 5.1,
        "trajectory": "improving"
      },
      "contract": {
        "type": "negotiated",
        "discountPercent": 12,
        "minimumSpend": 10000
      },
      "recommendation": {
        "action": "maintain",
        "reasoning": "Excellent performance across all metrics"
      }
    }
  ]
}
```

---

## 5. AI-Powered Predictive Analytics

### Prediction Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  PREDICTIVE ANALYTICS                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ HIGH-RISK SHIPMENTS (Next 7 Days)              [5 at risk]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🚨 Tracking #1Z999AA10123456784 (FedEx)                    │
│    ├─ Delay Risk: 72% probability                          │
│    ├─ Predicted Delay: 3 days                              │
│    ├─ Reason: Weather condition + Traffic congestion       │
│    ├─ Confidence: 88%                                      │
│    ├─ Recommended Action: Contact customer, offer discount │
│    └─ [TAKE ACTION] [VIEW DETAILS]                         │
│                                                              │
│ ⚠️  Tracking #1Z888BB20987654321 (UPS)                      │
│    ├─ Delay Risk: 45% probability                          │
│    ├─ Predicted Delay: 1-2 days                            │
│    ├─ Reason: Volume spike at origin hub                   │
│    ├─ Confidence: 76%                                      │
│    ├─ Recommended Action: Monitor closely                  │
│    └─ [TAKE ACTION] [VIEW DETAILS]                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ COST OVERRUN FORECASTING (Next 30 Days)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Projected Monthly Spend: $127,450                           │
│ Budget: $120,000                                            │
│ Variance: +$7,450 (6.2% over budget)                        │
│ Confidence: 92%                                             │
│                                                              │
│ Trend Analysis:                                             │
│ • Week 1: $28,320 (on pace)                                │
│ • Week 2: $32,100 (↑ 13% from avg)                         │
│ • Week 3: $33,450 (↑ 4% from week 2)                       │
│ • Week 4 (forecast): $33,580                               │
│                                                              │
│ Drivers:                                                    │
│ • 15% increase in shipment volume                          │
│ • Peak season rate premiums (+8%)                          │
│ • XPO rate increase (-12% contract discount)               │
│                                                              │
│ Recommendations:                                            │
│ ✓ Consolidate shipments (potential 3-5% savings)          │
│ ✓ Negotiate temp rates with FedEx (1-2% savings)          │
│ ✓ Shift some volume to Ground service (-4% savings)       │
│                                                              │
│ Potential Savings with Actions: $6,200 (bringing total     │
│ spend to $121,250, within budget)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Predictive Analytics Components

```typescript
<PredictiveAnalyticsDashboard>
  ├── <DelayPredictionPanel>
  │   ├── <HighRiskShipmentsList>
  │   │   └── <RiskCard>
  │   │       ├── <RiskScoreGauge>
  │   │       ├── <DelayPrediction>
  │   │       ├── <ConfidenceScore>
  │   │       ├── <RootCauseAnalysis>
  │   │       ├── <RecommendedActions>
  │   │       └── <ActionButtons>
  │   │
  │   └── <DelayTrendChart>
  │
  ├── <CostOverrunForecasting>
  │   ├── <BudgetComparison>
  │   │   ├── <ProjectedSpend>
  │   │   ├── <BudgetThreshold>
  │   │   ├── <VarianceIndicator>
  │   │   └── <ConfidenceScore>
  │   │
  │   ├── <WeeklyBreakdown>
  │   │   └── <WeeklyBar>
  │   │
  │   ├── <DriverAnalysis>
  │   │   └── <DriverCard>
  │   │
  │   └── <SavingsRecommendations>
  │       └── <RecommendationCard>
  │
  └── <ModelAccuracy>
      ├── <AccuracyMetrics>
      ├── <HistoricalPerformance>
      └── <ModelVersion>
```

### Prediction JSON Structure

```json
{
  "predictions": {
    "delayPredictions": [
      {
        "id": "pred_delay_001",
        "shipment": {
          "id": "ship_a1b2c3d4",
          "trackingNumber": "1Z999AA10123456784",
          "carrier": "FedEx"
        },
        "prediction": {
          "riskLevel": "high",
          "delayProbability": 0.72,
          "predictedDelayDays": 3,
          "confidenceScore": 0.88,
          "predictedDeliveryDate": "2024-01-20T18:00:00Z",
          "originalEstimate": "2024-01-17T17:30:00Z"
        },
        "rootCauses": [
          {
            "factor": "weather_condition",
            "impact": "45%",
            "description": "Heavy snow forecasted in route"
          },
          {
            "factor": "traffic_congestion",
            "impact": "35%",
            "description": "Major traffic on I-40 corridor"
          },
          {
            "factor": "volume_spike",
            "impact": "20%",
            "description": "Unusually high volume at Memphis Hub"
          }
        ],
        "recommendations": [
          {
            "action": "contact_customer",
            "priority": "high",
            "suggestion": "Notify customer of potential delay proactively",
            "estimatedSavings": "Prevent 1-2 complaints"
          },
          {
            "action": "offer_incentive",
            "priority": "medium",
            "suggestion": "Offer $25 credit for inconvenience",
            "cost": 25
          }
        ],
        "predictedAt": "2024-01-16T14:30:00Z",
        "modelVersion": "v2.1.3"
      }
    ],
    "costOverrunForecast": {
      "forecastPeriod": "2024-01",
      "projectedSpend": 127450.00,
      "budget": 120000.00,
      "variance": 7450.00,
      "variancePercent": 6.2,
      "confidenceScore": 0.92,
      "weeklyBreakdown": [
        {
          "week": 1,
          "actual": 28320.00,
          "forecast": 28500.00,
          "variance": 180.00
        },
        {
          "week": 2,
          "actual": 32100.00,
          "forecast": 32200.00,
          "variance": 100.00
        },
        {
          "week": 3,
          "forecast": 33450.00
        },
        {
          "week": 4,
          "forecast": 33580.00
        }
      ],
      "drivers": [
        {
          "factor": "volume_increase",
          "impact": "15%",
          "cost": 4200.00,
          "description": "Shipment volume up 15% vs historical"
        },
        {
          "factor": "rate_premium",
          "impact": "8%",
          "cost": 2100.00,
          "description": "Peak season premiums applied"
        },
        {
          "factor": "contract_change",
          "impact": "5%",
          "cost": 1150.00,
          "description": "XPO rate increase"
        }
      ],
      "recommendations": [
        {
          "action": "consolidate_shipments",
          "estimatedSavings": 3800.00,
          "savingsPercent": 3.2,
          "feasibility": "high"
        },
        {
          "action": "negotiate_rates",
          "estimatedSavings": 1500.00,
          "savingsPercent": 1.3,
          "feasibility": "medium"
        },
        {
          "action": "shift_to_ground",
          "estimatedSavings": 2100.00,
          "savingsPercent": 1.8,
          "feasibility": "medium"
        }
      ],
      "projectedSpendWithActions": 121250.00
    }
  }
}
```

---

## 6. API Endpoints for Manager Dashboard

```
GET    /api/logistics/dashboard/overview              # Dashboard summary
GET    /api/logistics/shipments/active                # Active shipments feed
WS     /api/logistics/tracking/stream                 # WebSocket for realtime updates
GET    /api/logistics/shipments/:id/tracking          # Detailed tracking
POST   /api/logistics/rates/quote                     # Get rate quotes
GET    /api/logistics/exceptions                      # Exception list
POST   /api/logistics/exceptions/:id/resolve          # Resolve exception
GET    /api/logistics/carriers/scorecards             # Performance scorecards
GET    /api/logistics/predictions/delays              # Delay predictions
GET    /api/logistics/predictions/cost-forecast       # Cost forecasting
```

---

## 7. Key Performance Indicators

- **Tracking Update Latency:** < 5 minutes
- **WebSocket Connection:** 99.9% uptime
- **Rate Quote Generation:** < 2 seconds
- **Exception Detection:** Automated within 1 minute of event
- **Dashboard Load Time:** < 2 seconds
- **Prediction Accuracy:** > 85% for delays, > 80% for cost overruns
- **Mobile Responsiveness:** Optimized for all screen sizes

---

## 8. Implementation Sprint

**Sprint 3:** Tracking interface + WebSocket foundation
**Sprint 6:** Rate shopping + Exceptions
**Sprint 7:** Performance scorecards
**Sprint 13:** Predictive analytics integration

