type ActivityLogInput = {
  action: string;
  actorProfileId: string;
  companyId: string;
  entityId?: string | null;
  entityType: string;
  metadata?: Record<string, unknown>;
  summary: string;
};

export async function logActivity(
  supabase: any,
  input: ActivityLogInput
) {
  const { error } = await supabase.from("activity_logs").insert({
    action: input.action,
    actor_profile_id: input.actorProfileId,
    company_id: input.companyId,
    entity_id: input.entityId ?? null,
    entity_type: input.entityType,
    metadata: input.metadata ?? {},
    summary: input.summary,
  });

  return error;
}

export async function createRegionRecord(
  supabase: any,
  input: {
    code?: string;
    companyId: string;
    description?: string;
    name: string;
  }
) {
  return supabase
    .from("regions")
    .insert({
      code: input.code || null,
      company_id: input.companyId,
      description: input.description || null,
      name: input.name,
    })
    .select("id, name, code")
    .single();
}

export async function createBusinessUnitRecord(
  supabase: any,
  input: {
    code?: string;
    companyId: string;
    description?: string;
    name: string;
    regionId?: string;
  }
) {
  return supabase
    .from("business_units")
    .insert({
      code: input.code || null,
      company_id: input.companyId,
      description: input.description || null,
      name: input.name,
      region_id: input.regionId || null,
    })
    .select("id, name, code")
    .single();
}

export async function createFacilityRecord(
  supabase: any,
  input: {
    businessUnitId?: string;
    city?: string;
    code?: string;
    companyId: string;
    contactEmail?: string;
    contactName?: string;
    country?: string;
    name: string;
    regionId?: string;
    type?: string;
  }
) {
  return supabase
    .from("facilities")
    .insert({
      address: {
        city: input.city || null,
        country: input.country || null,
      },
      business_unit_id: input.businessUnitId || null,
      code: input.code || null,
      company_id: input.companyId,
      contact_email: input.contactEmail || null,
      contact_name: input.contactName || null,
      name: input.name,
      region_id: input.regionId || null,
      type: input.type || "hub",
    })
    .select("id, name, code")
    .single();
}
