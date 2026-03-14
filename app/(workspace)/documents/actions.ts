"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDocumentAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("documents.manage");
  const title = getValue(formData, "title");
  const documentType = getValue(formData, "documentType");
  const storagePath = getValue(formData, "storagePath");
  const entityRef = getValue(formData, "entityRef"); // "invoice:uuid" | "shipment:uuid" | "contract:uuid"

  let entityType: string | null = null;
  let entityId: string | null = null;
  if (entityRef && entityRef.includes(":")) {
    const [type, id] = entityRef.split(":");
    if (type && id) {
      entityType = type;
      entityId = id;
    }
  }

  if (!title || !documentType) {
    redirect("/documents?error=Title and document type are required.");
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      company_id: company!.id,
      document_type: documentType,
      entity_id: entityId || null,
      entity_type: entityType || null,
      metadata: {
        registered_via: "phase1_ui",
      },
      storage_path: storagePath || null,
      title,
      uploaded_by: profile!.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/documents?error=Unable to register document.");
  }

  await logActivity(supabase, {
    action: "documents.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "document",
    summary: `Registered document ${title}.`,
  });

  revalidatePath("/documents");
  redirect("/documents?message=Document registered.");
}
