"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createFieldUpdateAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("tracking.manage");
  const shipmentId = getValue(formData, "shipmentId");
  const status = getValue(formData, "status");
  const notes = getValue(formData, "notes");
  const city = getValue(formData, "city");
  const country = getValue(formData, "country");

  if (!shipmentId || !status) {
    redirect("/field-ops?error=Shipment and status are required.");
  }

  const { data, error } = await supabase
    .from("tracking_events")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      description: notes || null,
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
    redirect("/field-ops?error=Unable to save field update.");
  }

  const shipmentUpdate: Record<string, string | null> = { status };
  if (status === "delivered") {
    shipmentUpdate.delivered_at = new Date().toISOString();
  }

  await supabase
    .from("shipments")
    .update(shipmentUpdate)
    .eq("id", shipmentId)
    .eq("company_id", company!.id);

  if (status === "exception") {
    await supabase.from("alerts").insert({
      company_id: company!.id,
      message: notes || "Field team marked the shipment as exception.",
      metadata: {
        shipment_id: shipmentId,
        source: "field_ops",
      },
      read: false,
      title: "Field exception reported",
      type: "shipment_exception",
    });
  }

  await logActivity(supabase, {
    action: "field_ops.update.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: data.id,
    entityType: "tracking_event",
    metadata: { shipmentId, status },
    summary: `Logged field update ${status} for shipment ${shipmentId}.`,
  });

  revalidatePath("/field-ops");
  revalidatePath("/tracking");
  revalidatePath("/exceptions");
  redirect("/field-ops?message=Field update saved.");
}

export async function captureDeliveryProofAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("tracking.manage");
  const shipmentId = getValue(formData, "shipmentId");
  const signerName = getValue(formData, "signerName");
  const storagePath = getValue(formData, "storagePath");
  const notes = getValue(formData, "notes");

  if (!shipmentId || !signerName) {
    redirect("/field-ops?error=Shipment and signer are required for POD capture.");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      company_id: company!.id,
      document_type: "proof_of_delivery",
      entity_id: shipmentId,
      entity_type: "shipment",
      metadata: {
        captured_at: new Date().toISOString(),
        notes: notes || null,
        signer_name: signerName,
      },
      storage_path: storagePath || null,
      title: `POD ${shipmentId.slice(0, 8)}`,
      uploaded_by: profile!.id,
    })
    .select("id")
    .single();

  if (error || !document) {
    redirect("/field-ops?error=Unable to capture POD metadata.");
  }

  await supabase.from("tracking_events").insert({
    company_id: company!.id,
    created_by: profile!.id,
    description: `Proof of delivery captured by ${signerName}.`,
    location: {},
    shipment_id: shipmentId,
    status: "delivered",
  });

  await supabase
    .from("shipments")
    .update({
      delivered_at: new Date().toISOString(),
      status: "delivered",
    })
    .eq("id", shipmentId)
    .eq("company_id", company!.id);

  await logActivity(supabase, {
    action: "field_ops.pod.captured",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: document.id,
    entityType: "document",
    metadata: { shipmentId, signerName },
    summary: `Captured delivery proof for shipment ${shipmentId}.`,
  });

  revalidatePath("/field-ops");
  revalidatePath("/tracking");
  redirect("/field-ops?message=Proof of delivery captured.");
}

export async function reportDamageAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("tracking.manage");
  const shipmentId = getValue(formData, "shipmentId");
  const severity = getValue(formData, "severity") || "high";
  const notes = getValue(formData, "notes");

  if (!shipmentId) {
    redirect("/field-ops?error=Shipment is required to report damage.");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      company_id: company!.id,
      document_type: "damage_report",
      entity_id: shipmentId,
      entity_type: "shipment",
      metadata: {
        reported_at: new Date().toISOString(),
        severity,
      },
      title: `Damage report ${shipmentId.slice(0, 8)}`,
      uploaded_by: profile!.id,
    })
    .select("id")
    .single();

  if (error || !document) {
    redirect("/field-ops?error=Unable to create damage report.");
  }

  await supabase.from("tracking_events").insert({
    company_id: company!.id,
    created_by: profile!.id,
    description: notes || "Damage reported by field operations.",
    location: {},
    shipment_id: shipmentId,
    status: "exception",
  });

  await supabase
    .from("shipments")
    .update({ status: "exception" })
    .eq("id", shipmentId)
    .eq("company_id", company!.id);

  await supabase.from("alerts").insert({
    company_id: company!.id,
    message: notes || "Damage exception was logged in the field.",
    metadata: {
      document_id: document.id,
      severity,
      shipment_id: shipmentId,
      source: "field_ops",
    },
    read: false,
    title: "Damage report submitted",
    type: "damage_report",
  });

  await logActivity(supabase, {
    action: "field_ops.damage.reported",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: document.id,
    entityType: "document",
    metadata: { severity, shipmentId },
    summary: `Reported damage for shipment ${shipmentId}.`,
  });

  revalidatePath("/field-ops");
  revalidatePath("/exceptions");
  revalidatePath("/tracking");
  redirect("/field-ops?message=Damage report submitted.");
}
