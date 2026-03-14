"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";
import { evaluateAllRules } from "@/lib/alert-engine";
import { sendAlertEmail } from "@/lib/email";
import type { AlertRuleType, Database } from "@/types/database";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getArrayValue(formData: FormData, key: string): string[] {
  const values = formData.getAll(key);
  return values.filter((v): v is string => typeof v === "string").map((v) => v.trim());
}

export async function createAlertRuleAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("alerts.manage");

  const name = getValue(formData, "name");
  const type = getValue(formData, "type") as AlertRuleType;
  const threshold = parseFloat(getValue(formData, "threshold")) || 0;
  const channels = getArrayValue(formData, "channels");

  if (!name) {
    redirect("/settings/alerts?error=Rule name is required.");
  }

  if (!type || !["cost_overrun", "service_failure", "invoice_exception", "payment_delay", "carrier_sla"].includes(type)) {
    redirect("/settings/alerts?error=Valid rule type is required.");
  }

  if (threshold <= 0) {
    redirect("/settings/alerts?error=Threshold must be greater than 0.");
  }

  const { data, error } = await supabase
    .from("alert_rules")
    .insert({
      channels: channels.length > 0 ? channels : ["in_app"],
      company_id: company!.id,
      condition: {},
      enabled: true,
      name,
      threshold,
      type,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/settings/alerts?error=Unable to create alert rule.");
  }

  await logActivity(supabase, {
    action: "alert_rules.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "alert_rule",
    metadata: { type, threshold },
    summary: `Created alert rule "${name}" with type ${type}.`,
  });

  revalidatePath("/settings/alerts");
  revalidatePath("/analytics");
  redirect("/settings/alerts?message=Alert rule created.");
}

export async function updateAlertRuleAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("alerts.manage");

  const ruleId = getValue(formData, "ruleId");
  const name = getValue(formData, "name");
  const type = getValue(formData, "type") as AlertRuleType;
  const threshold = parseFloat(getValue(formData, "threshold")) || 0;
  const channels = getArrayValue(formData, "channels");
  const enabled = getValue(formData, "enabled") === "true";

  if (!ruleId) {
    redirect("/settings/alerts?error=Rule ID is required.");
  }

  if (!name) {
    redirect("/settings/alerts?error=Rule name is required.");
  }

  const { error } = await supabase
    .from("alert_rules")
    .update({
      channels: channels.length > 0 ? channels : ["in_app"],
      enabled,
      name,
      threshold,
      type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .eq("company_id", company!.id);

  if (error) {
    redirect("/settings/alerts?error=Unable to update alert rule.");
  }

  await logActivity(supabase, {
    action: "alert_rules.updated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: ruleId,
    entityType: "alert_rule",
    metadata: { type, threshold, enabled },
    summary: `Updated alert rule "${name}".`,
  });

  revalidatePath("/settings/alerts");
  redirect("/settings/alerts?message=Alert rule updated.");
}

export async function deleteAlertRuleAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("alerts.manage");

  const ruleId = getValue(formData, "ruleId");

  if (!ruleId) {
    redirect("/settings/alerts?error=Rule ID is required.");
  }

  const { error } = await supabase
    .from("alert_rules")
    .delete()
    .eq("id", ruleId)
    .eq("company_id", company!.id);

  if (error) {
    redirect("/settings/alerts?error=Unable to delete alert rule.");
  }

  await logActivity(supabase, {
    action: "alert_rules.deleted",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: ruleId,
    entityType: "alert_rule",
    summary: `Deleted alert rule.`,
  });

  revalidatePath("/settings/alerts");
  redirect("/settings/alerts?message=Alert rule deleted.");
}

export async function evaluateAlertRulesAction() {
  const { company, profile, supabase } = await requirePermission("alerts.manage");

  // Fetch enabled alert rules
  const { data: rules, error: rulesError } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("company_id", company!.id)
    .eq("enabled", true);

  if (rulesError || !rules) {
    redirect("/settings/alerts?error=Unable to fetch alert rules.");
  }

  // Evaluate all rules
  const results = await evaluateAllRules(supabase, company!.id, rules);

  // Insert triggered alerts and send emails
  const { data: companyData } = await supabase
    .from("companies")
    .select("name")
    .eq("id", company!.id)
    .single();

  const companyName = (companyData as any)?.name || "Your Company";

  let triggeredCount = 0;
  let emailCount = 0;

  for (const { rule, result } of results) {
    if (!result.triggered) continue;

    // Insert alert into alerts table
    await supabase.from("alerts").insert({
      company_id: company!.id,
      message: result.message,
      metadata: {
        rule_id: rule.id,
        rule_name: rule.name,
        ...result.metadata,
      },
      read: false,
      title: result.title,
      type: rule.type,
    });

    triggeredCount++;

    // Send email notifications if configured
    if (rule.channels?.includes("email")) {
      try {
        const { data: recipients } = await supabase
          .from("profiles")
          .select("email")
          .eq("company_id", company!.id)
          .in("role", ["admin", "manager"]);

        const recipientEmails = (recipients as any[])
          ?.filter((p) => p.email)
          .map((p) => p.email) ?? [];

        if (recipientEmails.length > 0) {
          await sendAlertEmail({
            alertType: rule.type,
            companyName,
            message: result.message,
            metadata: result.metadata,
            ruleName: rule.name,
            title: result.title,
            to: recipientEmails,
          });

          emailCount++;
        }
      } catch (emailError) {
        console.error("Failed to send alert emails:", emailError);
      }
    }
  }

  await logActivity(supabase, {
    action: "alert_rules.evaluated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: "batch_evaluation",
    entityType: "alert_rule",
    metadata: { triggeredCount, emailsSent: emailCount, totalRules: rules.length },
    summary: `Evaluated ${rules.length} alert rule(s), triggered ${triggeredCount}.`,
  });

  revalidatePath("/analytics");
  revalidatePath("/settings/alerts");
  redirect(`/settings/alerts?message=Evaluated ${triggeredCount} alert(s). ${emailCount} email(s) sent.`);
}
