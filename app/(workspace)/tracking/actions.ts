"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createShipmentAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("shipments.manage");
  const carrierId = getValue(formData, "carrierId");
  const trackingNumber = getValue(formData, "trackingNumber");
  const originFacilityId = getValue(formData, "originFacilityId");
  const destFacilityId = getValue(formData, "destFacilityId");
  const shippedAt = getValue(formData, "shippedAt");

  if (!carrierId || !trackingNumber) {
    redirect("/tracking?error=Carrier and tracking number are required.");
  }

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      carrier_id: carrierId,
      company_id: company!.id,
      dest_facility_id: destFacilityId || null,
      origin_facility_id: originFacilityId || null,
      shipped_at: shippedAt || null,
      status: "created",
      tracking_number: trackingNumber,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/tracking?error=Unable to create shipment.");
  }

  await logActivity(supabase, {
    action: "shipments.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "shipment",
    summary: `Created shipment ${trackingNumber}.`,
  });

  revalidatePath("/tracking");
  redirect("/tracking?message=Shipment created.");
}

export async function createTrackingEventAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("tracking.manage");
  const shipmentId = getValue(formData, "shipmentId");
  const status = getValue(formData, "status");
  const description = getValue(formData, "description");
  const city = getValue(formData, "city");
  const country = getValue(formData, "country");

  if (!shipmentId || !status) {
    redirect("/tracking?error=Shipment and status are required.");
  }

  const { data, error } = await supabase
    .from("tracking_events")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      description: description || null,
      location: {
        city: city || null,
        country: country || null,
      },
      shipment_id: shipmentId,
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/tracking?error=Unable to add tracking event.");
  }

  const updatePayload: Record<string, string> = { status };
  if (status === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  await supabase.from("shipments").update(updatePayload).eq("id", shipmentId);

  await logActivity(supabase, {
    action: "tracking.event.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "tracking_event",
    summary: `Added ${status} tracking event.`,
  });

  revalidatePath("/tracking");
  redirect("/tracking?message=Tracking event created.");
}
