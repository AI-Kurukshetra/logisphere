# Koho API Specifications - Complete Reference

## API Base URL
```
Development:  http://localhost:3000/api/v1
Production:   https://api.logisphere.app/api/v1
```

## Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Response includes:
- `X-Request-ID`: Unique request identifier (for logging)
- `X-RateLimit-Limit`: 1000 requests/hour per user
- `X-RateLimit-Remaining`: Requests remaining

---

## Admin & Security Module APIs

### User Management
```
GET    /admin/users
Returns: { users: User[], total: number, page: number }

POST   /admin/users
Body: { email, fullName, role, workspaceId }
Returns: { userId, email, role }

PUT    /admin/users/:userId
Body: { fullName, role, status }
Returns: { success: boolean }

DELETE /admin/users/:userId
Returns: { success: boolean }

GET    /admin/users/:userId/audit-logs
Query: ?from=2024-01-01&to=2024-12-31
Returns: { logs: AuditLog[], total: number }
```

### Audit Logs
```
GET    /admin/audit-logs
Query: ?resourceType=invoice&startDate=2024-01-01&limit=50
Returns: { logs: AuditLog[], total: number }

GET    /admin/audit-logs/:logId
Returns: { log: AuditLog }

POST   /admin/audit-logs/export
Body: { format: "csv"|"json", filters: {...} }
Returns: { fileUrl: string, expiresIn: number }
```

### Integrations
```
GET    /admin/integrations
Returns: { integrations: Integration[], total: number }

POST   /admin/integrations
Body: {
  name: string,
  type: "erp"|"wms"|"payment"|"carrier",
  config: { apiKey, endpoint, etc }
}
Returns: { integrationId, status: "testing" }

PUT    /admin/integrations/:integrationId
Body: { config, status }
Returns: { success: boolean }

POST   /admin/integrations/:integrationId/test
Returns: { status: "success"|"failed", message: string }

GET    /admin/integrations/:integrationId/logs
Returns: { logs: IntegrationEvent[], lastSync: Date }
```

### Multi-Location Management
```
GET    /admin/locations
Returns: { regions: Region[], facilities: Facility[], businessUnits: BU[] }

POST   /admin/regions
Body: { name, countryCode, timezone }
Returns: { regionId }

POST   /admin/facilities
Body: { name, regionId, type, address, capacity, coordinates }
Returns: { facilityId }

POST   /admin/business-units
Body: { name, parentUnitId, budgetAllocation }
Returns: { unitId }
```

---

## Financial Operations Module APIs

### Invoice Management
```
GET    /financial/invoices
Query: ?status=pending&carrier=FDX&limit=20&page=1
Returns: { invoices: Invoice[], total: number }

POST   /financial/invoices
Body: {
  carrierId, amount, lineItems: [...],
  documentUrl, invoiceNumber, invoiceDate
}
Returns: { invoiceId, auditStatus: "pending" }

GET    /financial/invoices/:invoiceId
Returns: { invoice: Invoice, auditResults: AuditResult[] }

PUT    /financial/invoices/:invoiceId
Body: { status, notes }
Returns: { success: boolean }

POST   /financial/invoices/bulk-import
Body: FormData with CSV file
Returns: { importedCount, failedCount, errors: [...] }

POST   /financial/invoices/:invoiceId/audit
Returns: { auditResults: AuditResult[], passed: boolean, savings: number }
```

### Payments
```
GET    /financial/payments
Query: ?status=pending&approvalLevel=1
Returns: { payments: Payment[], total: number }

POST   /financial/payments
Body: {
  invoiceId, amount, paymentMethod,
  scheduledDate, notes
}
Returns: { paymentId, status: "pending" }

POST   /financial/payments/:paymentId/approve
Body: { approverId, approvalAmount }
Returns: { success: boolean }

POST   /financial/payments/:paymentId/reject
Body: { reason }
Returns: { success: boolean }

POST   /financial/payments/:paymentId/process
Body: { transactionReference }
Returns: { transactionId, status: "paid" }

GET    /financial/payments/:paymentId/approvals
Returns: { approvals: PaymentApproval[], pendingApprovals: number }
```

### Disputes
```
GET    /financial/disputes
Query: ?status=open&carrier=FDX
Returns: { disputes: Dispute[], total: number }

POST   /financial/disputes
Body: {
  invoiceId, shipmentId, carrierId,
  type: "overcharge"|"service_failure"|"damage",
  amount, description, evidenceUrls: [...]
}
Returns: { disputeId, status: "open" }

POST   /financial/disputes/:disputeId/submit
Returns: { submittedAt: Date }

POST   /financial/disputes/:disputeId/resolve
Body: {
  resolution: "approved"|"partial"|"rejected",
  approvedAmount, reason
}
Returns: { success: boolean }

GET    /financial/disputes/:disputeId/communications
Returns: { messages: DisputeMessage[] }
```

### Budget & Forecast
```
GET    /financial/budgets
Returns: { budget: Budget, byCarrier: {...}, byLane: {...} }

PUT    /financial/budgets
Body: { totalBudget, byCarrier: {...}, notes }
Returns: { success: boolean }

GET    /financial/forecasts
Query: ?period=monthly&months=12
Returns: { forecast: Forecast, predictions: [...] }

POST   /financial/forecasts/generate
Body: { algorithm: "arima"|"prophet", periods: 12 }
Returns: { forecastId, status: "processing" }

GET    /financial/budget-vs-actual
Query: ?fiscalYear=2024
Returns: { months: [...], variance: [...], trend: "..." }
```

---

## Logistics Intelligence Module APIs

### Carriers
```
GET    /logistics/carriers
Query: ?status=active
Returns: { carriers: Carrier[], total: number }

POST   /logistics/carriers
Body: {
  name, code, contactName, email, phone,
  apiType, apiEndpoint
}
Returns: { carrierId }

GET    /logistics/carriers/:carrierId/scorecard
Query: ?month=2024-01&year=2024
Returns: { scorecard: Scorecard, trend: "..." }

GET    /logistics/carriers/:carrierId/rates
Returns: { rates: RateCard[], activeFrom: Date }
```

### Rate Management
```
GET    /logistics/rates
Query: ?carrierId=FDX&zone=1
Returns: { rates: RateTable[] }

POST   /logistics/rates/quote
Body: {
  originZip, destinationZip, weight,
  serviceType, shipmentDate
}
Returns: {
  options: [{
    carrierId, carrierName, baseRate,
    totalCost, estimatedDelivery, score
  }],
  bestPrice: string, bestService: string
}

POST   /logistics/rates/shop
Body: { shipmentDetails }
Returns: { quoteId, options: [...] }

POST   /logistics/rates/contracts
Body: {
  carrierId, startDate, endDate,
  minimumSpend, discountPercent, terms
}
Returns: { contractId }
```

### Shipments & Tracking
```
GET    /logistics/shipments
Query: ?status=in_transit&limit=50
Returns: { shipments: Shipment[], total: number }

POST   /logistics/shipments
Body: {
  carrierId, trackingNumber, originFacilityId,
  destinationFacilityId, weight, serviceType,
  estimatedDeliveryDate
}
Returns: { shipmentId, status: "created" }

GET    /logistics/shipments/:shipmentId/tracking
Returns: {
  shipment: Shipment,
  events: TrackingEvent[],
  currentLocation: Location,
  estimatedDelivery: Date
}

GET    /logistics/shipments/:shipmentId/timeline
Returns: { events: [...], timeline: [...] }

POST   /logistics/shipments/:shipmentId/subscribe
Body: { webhookUrl, eventTypes: ["delivered", "exception"] }
Returns: { subscriptionId }
```

### Exceptions
```
GET    /logistics/exceptions
Query: ?type=delay&severity=high
Returns: { exceptions: Exception[], total: number }

POST   /logistics/exceptions
Body: {
  shipmentId, exceptionType, description,
  severity, assignedTo
}
Returns: { exceptionId }

POST   /logistics/exceptions/:exceptionId/resolve
Body: { resolution, notes }
Returns: { success: boolean }

GET    /logistics/exceptions/:exceptionId/actions
Returns: { actions: ExceptionAction[] }
```

---

## Analytics & Sustainability Module APIs

### Reports
```
GET    /analytics/reports
Query: ?type=financial&limit=20
Returns: { reports: Report[], total: number }

POST   /analytics/reports
Body: {
  name, type, configuration: {...},
  visualizationConfig: {...},
  filters: {...}
}
Returns: { reportId }

POST   /analytics/reports/:reportId/execute
Returns: { executionId, dataUrl: string, rowCount: number }

POST   /analytics/reports/:reportId/schedule
Body: {
  frequency: "daily"|"weekly"|"monthly",
  recipients: [...],
  format: "pdf"|"csv"|"excel"
}
Returns: { scheduledReportId }

GET    /analytics/reports/:reportId/history
Returns: { executions: ReportExecution[] }
```

### Carbon Footprint
```
GET    /analytics/carbon-report
Query: ?from=2024-01-01&to=2024-12-31
Returns: {
  totalEmissionsKg, byMode: {...},
  byCarrier: {...}, offsetsApplied: number,
  netEmissions: number
}

POST   /analytics/carbon-offsets
Body: {
  description, carbonReductionKg,
  provider, certificationUrl
}
Returns: { offsetId, appliedAt: Date }

GET    /analytics/carbon-targets
Returns: { target: CarbonTarget, progress: number }

PUT    /analytics/carbon-targets
Body: { targetYear, reductionPercent, strategy }
Returns: { targetId }
```

### Predictions
```
GET    /analytics/predictions/delay/:shipmentId
Returns: {
  probability: number,
  confidence: number,
  insights: [...],
  recommendations: [...]
}

GET    /analytics/predictions/overcharge/:invoiceId
Returns: {
  probability: number,
  confidence: number,
  insights: [...],
  recommendations: [...]
}

GET    /analytics/predictions/cost-forecast
Query: ?months=12
Returns: {
  forecast: [...],
  confidence80: [...],
  confidence95: [...]
}
```

### Dashboards
```
GET    /analytics/dashboard/executive
Returns: {
  totalSpend, savingsRecovered, avgCostPerShipment,
  onTimeDeliveryRate, activeShipments, ...
}

GET    /analytics/dashboard/operations
Returns: {
  shipmentStatus: {...},
  exceptionsByType: {...},
  carrierPerformance: [...],
  ...
}

GET    /analytics/dashboard/financial
Returns: {
  spendByCarrier: {...},
  spendTrend: [...],
  invoiceStatus: {...},
  budgetVsActual: {...},
  ...
}

GET    /analytics/dashboard/sustainability
Returns: {
  carbonEmissions: {...},
  emissionsByMode: {...},
  offsetsApplied: number,
  progressToTarget: number
}
```

---

## Error Responses

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: carrierId",
    "details": {
      "field": "carrierId",
      "reason": "required"
    },
    "requestId": "req_12345"
  }
}
```

### Common Error Codes
```
400 BAD_REQUEST          - Invalid input
401 UNAUTHORIZED         - Missing/invalid token
403 FORBIDDEN            - Insufficient permissions
404 NOT_FOUND            - Resource not found
409 CONFLICT             - Resource already exists
429 RATE_LIMIT_EXCEEDED  - Too many requests
500 INTERNAL_ERROR       - Server error
503 SERVICE_UNAVAILABLE  - Service temporarily down
```

---

## Webhook Events

Webhooks can be subscribed to for real-time updates:

```json
{
  "event": "shipment.delivered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "shipmentId": "ship_123",
    "trackingNumber": "1Z999AA10123456784",
    "status": "delivered",
    "deliveryDate": "2024-01-15",
    "location": {...}
  }
}
```

### Available Events
```
shipment.created
shipment.picked_up
shipment.in_transit
shipment.delivered
shipment.exception
invoice.created
invoice.audited
invoice.exception
payment.approved
payment.paid
dispute.created
dispute.resolved
```

---

## Rate Limiting

- **General endpoints:** 1000 requests/hour per user
- **Auth endpoints:** 10 requests/minute per IP
- **Webhook delivery:** 100 attempts per webhook over 24 hours

Response headers:
```
X-RateLimit-Limit:     1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset:     1642425600
```

---

## Pagination

All list endpoints support:
```
?limit=20      (max 100, default 20)
?page=1        (default 1, zero-indexed)
?sort=-created_at   (prefix with - for descending)
```

Response format:
```json
{
  "items": [...],
  "total": 250,
  "limit": 20,
  "page": 1,
  "totalPages": 13,
  "hasMore": true
}
```

---

## Versioning

API versioning via URL path:
```
/api/v1/...     (current)
/api/v2/...     (future)
```

Deprecation warnings in response headers:
```
Deprecation: true
Sunset: Wed, 21 Dec 2025 00:00:00 GMT
Link: <https://docs.logisphere.app/api/v2>; rel="successor-version"
```

---

## Documentation Links

- Full API docs: https://docs.logisphere.app/api
- Postman Collection: https://api.logisphere.app/postman.json
- OpenAPI Schema: https://api.logisphere.app/openapi.json
- Interactive API Explorer: https://api.logisphere.app/explorer
