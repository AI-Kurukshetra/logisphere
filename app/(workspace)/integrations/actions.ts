"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createIntegrationAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const name = getValue(formData, "name");
  const systemType = getValue(formData, "systemType");
  const mode = getValue(formData, "mode") || "pull";
  const status = getValue(formData, "status") || "planned";
  const endpointUrl = getValue(formData, "endpointUrl");
  const authType = getValue(formData, "authType");
  const notes = getValue(formData, "notes");

  if (!name || !systemType) {
    redirect("/integrations?error=Integration name and system type are required.");
  }

  const { data, error } = await supabase
    .from("integrations")
    .insert({
      auth_type: authType || null,
      company_id: company!.id,
      config: {
        notes: notes || null,
      },
      created_by: profile!.id,
      endpoint_url: endpointUrl || null,
      mode,
      name,
      status,
      system_type: systemType,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/integrations?error=Unable to create integration.");
  }

  await logActivity(supabase, {
    action: "integrations.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: data.id,
    entityType: "integration",
    metadata: { mode, systemType },
    summary: `Created integration "${name}".`,
  });

  revalidatePath("/integrations");
  redirect("/integrations?message=Integration created.");
}

export async function logWebhookEventAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const integrationId = getValue(formData, "integrationId");
  const direction = getValue(formData, "direction") || "inbound";
  const eventType = getValue(formData, "eventType");
  const status = getValue(formData, "status") || "pending";
  const payloadInput = getValue(formData, "payload");

  if (!eventType) {
    redirect("/integrations?error=Webhook event type is required.");
  }

  let payload: Record<string, unknown> = { raw: payloadInput || null };
  if (payloadInput) {
    try {
      const parsed = JSON.parse(payloadInput) as Record<string, unknown>;
      payload = parsed;
    } catch {
      payload = { raw: payloadInput };
    }
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      company_id: company!.id,
      direction,
      event_type: eventType,
      headers: {
        "x-logisphere-source": "workspace-simulator",
      },
      integration_id: integrationId || null,
      payload,
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/integrations?error=Unable to log webhook event.");
  }

  await logActivity(supabase, {
    action: "integrations.webhook.logged",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: data.id,
    entityType: "webhook_event",
    metadata: { direction, eventType, integrationId: integrationId || null },
    summary: `Logged ${direction} webhook event ${eventType}.`,
  });

  revalidatePath("/integrations");
  redirect("/integrations?message=Webhook event recorded.");
}

export async function retryWebhookEventAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const eventId = getValue(formData, "eventId");

  if (!eventId) {
    redirect("/integrations?error=Webhook event id is required.");
  }

  const { error } = await supabase
    .from("webhook_events")
    .update({
      error_message: null,
      processed_at: new Date().toISOString(),
      status: "replayed",
    })
    .eq("id", eventId)
    .eq("company_id", company!.id);

  if (error) {
    redirect("/integrations?error=Unable to replay webhook event.");
  }

  await logActivity(supabase, {
    action: "integrations.webhook.replayed",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: eventId,
    entityType: "webhook_event",
    summary: `Replayed webhook event ${eventId}.`,
  });

  revalidatePath("/integrations");
  redirect("/integrations?message=Webhook event replayed.");
}
