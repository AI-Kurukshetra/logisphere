import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: [] as any[],
    errors: [] as string[],
  };

  try {
    const supabase = await createClient();

    // Check 1: Can we authenticate?
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    diagnostics.checks.push({
      name: "Authentication",
      status: authError ? "❌ FAILED" : "✅ OK",
      details: authError ? authError.message : `Logged in as ${user?.email}`,
    });

    if (authError) {
      diagnostics.errors.push(`Auth error: ${authError.message}`);
    }

    // Check 2: Can we access companies table?
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .limit(1);

    diagnostics.checks.push({
      name: "Companies Table",
      status: companiesError ? "❌ FAILED" : "✅ OK",
      details: companiesError
        ? companiesError.message
        : `Found ${companies?.length || 0} companies`,
      error_code: companiesError?.code,
      error_details: companiesError?.details,
    });

    if (companiesError) {
      diagnostics.errors.push(
        `Companies table error: ${companiesError.message} (${companiesError.code})`
      );
    }

    // Check 3: Can we access profiles table?
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    diagnostics.checks.push({
      name: "Profiles Table",
      status: profilesError ? "❌ FAILED" : "✅ OK",
      details: profilesError
        ? profilesError.message
        : `Found ${profiles?.length || 0} profiles`,
      error_code: profilesError?.code,
    });

    if (profilesError) {
      diagnostics.errors.push(
        `Profiles table error: ${profilesError.message} (${profilesError.code})`
      );
    }

    // Check 4: Can we access regions table?
    const { data: regions, error: regionsError } = await supabase
      .from("regions")
      .select("id, name")
      .limit(1);

    diagnostics.checks.push({
      name: "Regions Table",
      status: regionsError ? "❌ FAILED" : "✅ OK",
      details: regionsError
        ? regionsError.message
        : `Found ${regions?.length || 0} regions`,
      error_code: regionsError?.code,
    });

    if (regionsError) {
      diagnostics.errors.push(
        `Regions table error: ${regionsError.message} (${regionsError.code})`
      );
    }

    // Check 5: Can we access business_units table?
    const { data: busUnits, error: busUnitsError } = await supabase
      .from("business_units")
      .select("id, name")
      .limit(1);

    diagnostics.checks.push({
      name: "Business Units Table",
      status: busUnitsError ? "❌ FAILED" : "✅ OK",
      details: busUnitsError
        ? busUnitsError.message
        : `Found ${busUnits?.length || 0} business units`,
      error_code: busUnitsError?.code,
    });

    if (busUnitsError) {
      diagnostics.errors.push(
        `Business units table error: ${busUnitsError.message} (${busUnitsError.code})`
      );
    }

    // Check 6: Can we access facilities table?
    const { data: facilities, error: facilitiesError } = await supabase
      .from("facilities")
      .select("id, name")
      .limit(1);

    diagnostics.checks.push({
      name: "Facilities Table",
      status: facilitiesError ? "❌ FAILED" : "✅ OK",
      details: facilitiesError
        ? facilitiesError.message
        : `Found ${facilities?.length || 0} facilities`,
      error_code: facilitiesError?.code,
    });

    if (facilitiesError) {
      diagnostics.errors.push(
        `Facilities table error: ${facilitiesError.message} (${facilitiesError.code})`
      );
    }

    // Check 7: Can we access activity_logs table?
    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select("id, action")
      .limit(1);

    diagnostics.checks.push({
      name: "Activity Logs Table",
      status: logsError ? "❌ FAILED" : "✅ OK",
      details: logsError
        ? logsError.message
        : `Found ${logs?.length || 0} activity logs`,
      error_code: logsError?.code,
    });

    if (logsError) {
      diagnostics.errors.push(
        `Activity logs table error: ${logsError.message} (${logsError.code})`
      );
    }

    // Summary
    const allChecks = diagnostics.checks.length;
    const passedChecks = diagnostics.checks.filter((c) =>
      c.status.includes("✅")
    ).length;

    diagnostics.checks.push({
      name: "SUMMARY",
      status:
        passedChecks === allChecks
          ? "✅ ALL SYSTEMS OPERATIONAL"
          : `⚠️ ${passedChecks}/${allChecks} checks passed`,
    });

    return Response.json(diagnostics, { status: 200 });
  } catch (error) {
    diagnostics.errors.push(`Unexpected error: ${String(error)}`);
    return Response.json(diagnostics, { status: 500 });
  }
}
