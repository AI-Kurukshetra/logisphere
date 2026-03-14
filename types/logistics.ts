/**
 * Koho Freight Intelligence — Logistics Manager Dashboard
 * Types and sample payloads for real-time tracking, exceptions, and analytics.
 */

// —— Real-time tracking (WebSocket) ——

export type TrackingStatus =
  | "created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export interface TrackingUpdateLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export interface TrackingUpdate {
  shipmentId: string;
  trackingNumber: string;
  status: TrackingStatus;
  location: TrackingUpdateLocation;
  lastUpdate: string;
  estimatedDelivery: string;
  eventType: string;
  eventDescription: string;
  timestamp: string;
}

export type WebSocketMessageType =
  | "tracking.update"
  | "shipment.created"
  | "shipment.exception"
  | "heartbeat";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: TrackingUpdate;
  timestamp: string;
}

export interface WebSocketSubscribePayload {
  action: "subscribe";
  shipmentIds: string[];
}

// —— Shipment Exception (full spec per LOGISTICS_MANAGER_DASHBOARD) ——

export type ExceptionType = "tracking_exception" | "billing_exception" | "operational_exception";
export type ExceptionSubType =
  | "lost_in_transit"
  | "delayed"
  | "returned_to_sender"
  | "misdelivered"
  | "overcharge"
  | "duplicate_invoice"
  | "service_mismatch"
  | "unauthorized_charges"
  | "failed_delivery_attempt"
  | "address_issue"
  | "signature_refused"
  | "damaged_package";
export type ExceptionSeverity = "critical" | "high" | "medium" | "low";
export type ExceptionStatus =
  | "open"
  | "awaiting_carrier_response"
  | "awaiting_finance_review"
  | "in_progress"
  | "resolved";

export interface ShipmentExceptionAlert {
  exception: {
    id: string;
    type: ExceptionType;
    subType: ExceptionSubType;
    severity: ExceptionSeverity;
    shipment: {
      id: string;
      trackingNumber: string;
      carrier: { id: string; name: string };
    };
    timeline: {
      createdAt: string;
      detectedAt: string;
      lastUpdateFromCarrier: string;
    };
    details: {
      description: string;
      lastKnownLocation?: {
        facility: string;
        city: string;
        state: string;
        timestamp: string;
      };
      estimatedDelivery?: string;
      daysWithoutUpdate?: number;
      billedRate?: number;
      contractRate?: number;
      varianceAmount?: number;
      variancePercent?: number;
    };
    impact: {
      financial?: {
        shipmentValue: number;
        potentialRecovery: number;
        currency: string;
      };
      operational?: {
        customerAffected: string;
        orderNumber: string;
      };
    };
    status: ExceptionStatus;
    assignedTo?: {
      userId: string;
      name: string;
      role: string;
    };
    autoEscalation?: {
      triggered: boolean;
      rule: string;
      escalatedAt: string;
    };
    resolution: {
      attempts: Array<{
        type: string;
        timestamp: string;
        method: string;
        status: string;
      }>;
      actions: Array<{
        action: string;
        priority: string;
        status: string;
      }>;
    };
  };
}

/** Sample Shipment Exception alert — matches LOGISTICS_MANAGER_DASHBOARD.md */
export const SAMPLE_SHIPMENT_EXCEPTION_ALERT: ShipmentExceptionAlert = {
  exception: {
    id: "exc_crit_001",
    type: "tracking_exception",
    subType: "lost_in_transit",
    severity: "critical",
    shipment: {
      id: "ship_b2c3d4e5",
      trackingNumber: "1Z777CC30456789012",
      carrier: { id: "carrier_xpo", name: "XPO Logistics" },
    },
    timeline: {
      createdAt: "2024-01-09T14:30:00Z",
      detectedAt: "2024-01-16T08:00:00Z",
      lastUpdateFromCarrier: "2024-01-09T22:15:00Z",
    },
    details: {
      description:
        "Package has not been updated for 7 days. Last known location: Memphis Hub, TN",
      lastKnownLocation: {
        facility: "Memphis Hub",
        city: "Memphis",
        state: "TN",
        timestamp: "2024-01-09T22:15:00Z",
      },
      estimatedDelivery: "2024-01-11T18:00:00Z",
      daysWithoutUpdate: 7,
    },
    impact: {
      financial: {
        shipmentValue: 2500.0,
        potentialRecovery: 150.0,
        currency: "USD",
      },
      operational: {
        customerAffected: "Acme Corp",
        orderNumber: "ORD-2024-98765",
      },
    },
    status: "awaiting_carrier_response",
    assignedTo: {
      userId: "user_123",
      name: "John Smith",
      role: "operations_manager",
    },
    autoEscalation: {
      triggered: true,
      rule: "7_day_no_update",
      escalatedAt: "2024-01-16T08:00:00Z",
    },
    resolution: {
      attempts: [
        {
          type: "carrier_contact",
          timestamp: "2024-01-16T09:30:00Z",
          method: "email",
          status: "awaiting_response",
        },
        {
          type: "customer_notification",
          timestamp: "2024-01-16T10:00:00Z",
          method: "email",
          status: "sent",
        },
      ],
      actions: [
        { action: "contact_carrier", priority: "high", status: "pending" },
        { action: "open_dispute", priority: "high", status: "available" },
        { action: "initiate_claim", priority: "medium", status: "available" },
      ],
    },
  },
};
