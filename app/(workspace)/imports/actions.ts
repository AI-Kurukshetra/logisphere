"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createImportJobAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const entityType = getValue(formData, "entityType");
  const sourceName = getValue(formData, "sourceName");
  const fileName = getValue(formData, "fileName");
  const rowCount = Number(getValue(formData, "rowCount") || "0");

  if (!entityType || !sourceName) {
    redirect("/imports?error=Entity type and source are required.");
  }

  const { data, error } = await supabase
    .from("import_jobs")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      entity_type: entityType,
      file_name: fileName || null,
      row_count: rowCount,
      source_name: sourceName,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/imports?error=Unable to create import job.");
  }

  await logActivity(supabase, {
    action: "imports.job.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "import_job",
    summary: `Created ${entityType} import job from ${sourceName}.`,
  });

  revalidatePath("/imports");
  redirect("/imports?message=Import job created.");
}

export async function createExportJobAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const entityType = getValue(formData, "entityType");
  const format = getValue(formData, "format");
  const fileName = getValue(formData, "fileName");

  if (!entityType) {
    redirect("/imports?error=Entity type is required for export.");
  }

  const { data, error } = await supabase
    .from("export_jobs")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      entity_type: entityType,
      file_name: fileName || null,
      format: format || "csv",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/imports?error=Unable to create export job.");
  }

  await logActivity(supabase, {
    action: "exports.job.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "export_job",
    summary: `Queued ${entityType} export job.`,
  });

  revalidatePath("/imports");
  redirect("/imports?message=Export job queued.");
}
