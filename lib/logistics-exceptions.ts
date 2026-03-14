/**
 * Shared exception-alert builder for Logistics Manager and Exceptions page.
 * Used by supply_chain_manager dashboard and /exceptions.
 */

export type ExceptionAlertInputShipment = {
  id: string;
  carrier_id: string;
  status: string;
  tracking_number: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type ExceptionAlertInputInvoice = {
  shipment_id: string | null;
  status: string;
};

export type ExceptionAlertInputEvent = {
  shipment_id: string;
  event_at: string;
};

export type ExceptionAlertInputCarrier = {
  id: string;
  name: string;
};

export type ShipmentExceptionAlertUI = {
  shipmentId: string;
  trackingNumber: string;
  severity: "medium" | "high" | "critical";
  category: "delivery" | "billing" | "tracking";
  carrier: string;
  message: string;
  detectedAt: string;
  recommendedAction: string;
  source: {
    shipmentStatus: string;
    lastTrackingEventAt: string | null;
    invoiceStatus?: string | null;
  };
};

export function buildExceptionAlerts(
  shipments: ExceptionAlertInputShipment[],
  invoices: ExceptionAlertInputInvoice[],
  trackingEvents: ExceptionAlertInputEvent[],
  carriers: ExceptionAlertInputCarrier[]
): ShipmentExceptionAlertUI[] {
  return shipments
    .flatMap((shipment) => {
      const invoice = invoices.find((item) => item.shipment_id === shipment.id);
      const latestEvent = trackingEvents.find((event) => event.shipment_id === shipment.id);
      const carrier = carriers.find((item) => item.id === shipment.carrier_id)?.name ?? "Carrier";

      if (
        shipment.status !== "exception" &&
        invoice?.status !== "exception" &&
        invoice?.status !== "disputed"
      ) {
        return [];
      }

      const severity: ShipmentExceptionAlertUI["severity"] =
        shipment.status === "exception" && invoice?.status === "disputed"
          ? "critical"
          : shipment.status === "exception"
            ? "high"
            : "medium";

      const category: ShipmentExceptionAlertUI["category"] =
        invoice?.status === "exception" || invoice?.status === "disputed"
          ? "billing"
          : shipment.status === "exception"
            ? "delivery"
            : "tracking";

      return [
        {
          carrier,
          category,
          detectedAt:
            latestEvent?.event_at || shipment.delivered_at || shipment.shipped_at || shipment.created_at,
          message:
            category === "billing"
              ? "Invoice mismatch detected against the active carrier contract."
              : "Shipment has entered an operational exception state and needs escalation.",
          recommendedAction:
            category === "billing"
              ? "Open dispute, compare against rate card, and assign finance follow-up."
              : "Escalate with carrier, refresh tracking feed, and inform facility ops.",
          severity,
          shipmentId: shipment.id,
          source: {
            invoiceStatus: invoice?.status ?? null,
            lastTrackingEventAt: latestEvent?.event_at || null,
            shipmentStatus: shipment.status,
          },
          trackingNumber: shipment.tracking_number,
        },
      ];
    })
    .slice(0, 50);
}
