"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkspaceReportAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("audit.read");
  const name = getValue(formData, "name");
  const type = getValue(formData, "type");
  const schedule = getValue(formData, "schedule");
  const focus = getValue(formData, "focus");
  const format = getValue(formData, "format") || "csv";
  const visualization = getValue(formData, "visualization") || "table";
  const dateRange = getValue(formData, "dateRange") || "30d";
  const groupBy = getValue(formData, "groupBy") || "carrier";
  const dimensions = formData
    .getAll("dimensions")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const metrics = formData
    .getAll("metrics")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (!name || !type) {
    redirect("/reports?error=Report name and type are required.");
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      company_id: company!.id,
      created_by: profile?.id ?? null,
      name,
      params: {
        date_range: dateRange,
        dimensions,
        focus: focus || "company",
        format,
        group_by: groupBy,
        metrics,
        schedule: schedule || "manual",
        visualization,
      },
      type,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/reports?error=Unable to create report.");
  }

  await logActivity(supabase, {
    action: "reports.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: data.id,
    entityType: "report",
    metadata: { dateRange, format, groupBy, schedule, type, visualization },
    summary: `Created report "${name}".`,
  });

  revalidatePath("/reports");
  redirect("/reports?message=Report created.");
}

export async function queueReportExportAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("imports.manage");
  const reportId = getValue(formData, "reportId");
  const format = getValue(formData, "format") || "csv";
  const reportName = getValue(formData, "reportName") || "report";

  if (!reportId) {
    redirect("/reports?error=Report id is required to queue an export.");
  }

  const safeName = slugify(reportName) || "report";
  const fileName = `${safeName}.${format}`;

  const { data, error } = await supabase
    .from("export_jobs")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      entity_type: "reports",
      file_name: fileName,
      format,
      params: {
        report_id: reportId,
      },
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/reports?error=Unable to queue report export.");
  }

  await logActivity(supabase, {
    action: "reports.export.queued",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: data.id,
    entityType: "export_job",
    metadata: { reportId, format },
    summary: `Queued ${format.toUpperCase()} export for report ${reportId}.`,
  });

  revalidatePath("/reports");
  redirect("/reports?message=Report export queued.");
}
