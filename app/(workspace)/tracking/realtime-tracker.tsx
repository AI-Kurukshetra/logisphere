"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function titleize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "No timestamp";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No timestamp";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(parsed);
}

function getShipmentTone(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "exception") return "bg-rose-100 text-rose-700";
  if (status === "out_for_delivery") return "bg-amber-100 text-amber-700";
  if (status === "in_transit" || status === "picked_up") {
    return "bg-cyan-100 text-cyan-700";
  }
  return "bg-slate-100 text-slate-700";
}

type TrackingEvent = {
  id: string;
  shipment_id: string;
  status: string;
  description: string | null;
  event_at: string;
  location?: {
    city?: string;
    country?: string;
  } | null;
};

type Shipment = {
  id: string;
  tracking_number: string;
  status: string;
  created_at: string;
};

export function RealtimeTracker({
  companyId,
  initialEvents,
  initialShipments,
}: {
  companyId: string;
  initialEvents: TrackingEvent[];
  initialShipments: Shipment[];
}) {
  const [events, setEvents] = useState<TrackingEvent[]>(initialEvents);
  const [shipments, setShipments] = useState<Map<string, Shipment>>(
    new Map(initialShipments.map((s) => [s.id, s]))
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`tracking-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_events",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          const newEvent = payload.new as TrackingEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 40));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipments",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          const newShipment = payload.new as Shipment;
          setShipments((prev) => new Map(prev).set(newShipment.id, newShipment));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const shipmentMap = shipments;

  return (
    <div className="rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
        Recent Timeline
      </p>
      <div className="mt-5 space-y-4">
        {events.length === 0 ? (
          <p className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No tracking events yet.
          </p>
        ) : (
          events.slice(0, 10).map((event) => {
            const shipment = shipmentMap.get(event.shipment_id);
            const locationParts = [
              (event.location as any)?.city,
              (event.location as any)?.country,
            ].filter(Boolean);

            return (
              <article
                key={event.id}
                className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">
                        {shipment?.tracking_number || "Shipment"}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getShipmentTone(
                          event.status
                        )}`}
                      >
                        {titleize(event.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {event.description || "No event description provided."}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {formatDateTime(event.event_at)}
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {locationParts.length > 0
                    ? `📍 ${locationParts.join(", ")}`
                    : "Location not specified"}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
