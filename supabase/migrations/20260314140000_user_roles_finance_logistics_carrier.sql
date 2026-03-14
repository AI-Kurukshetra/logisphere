-- Add new user roles: Billing Manager (Finance), Supply Chain Manager (Logistics), Drivers & Carriers (Carrier/Field)
-- Admin remains for company admins (assigned via settings, not signup).

do $$
begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'user_role' and e.enumlabel = 'billing_manager') then
    alter type public.user_role add value 'billing_manager';
  end if;
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'user_role' and e.enumlabel = 'supply_chain_manager') then
    alter type public.user_role add value 'supply_chain_manager';
  end if;
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'user_role' and e.enumlabel = 'drivers_carriers') then
    alter type public.user_role add value 'drivers_carriers';
  end if;
end
$$;

-- Finance — Audit & Payment (Billing Manager)
insert into public.role_permissions (role, permission_key)
values
  ('billing_manager', 'invoices.manage'),
  ('billing_manager', 'audits.run'),
  ('billing_manager', 'payments.manage'),
  ('billing_manager', 'audit.read')
on conflict (role, permission_key) do nothing;

-- Logistics — Visibility & Routing (Supply Chain Manager)
insert into public.role_permissions (role, permission_key)
values
  ('supply_chain_manager', 'carriers.manage'),
  ('supply_chain_manager', 'contracts.manage'),
  ('supply_chain_manager', 'rates.manage'),
  ('supply_chain_manager', 'documents.manage'),
  ('supply_chain_manager', 'imports.manage'),
  ('supply_chain_manager', 'shipments.manage'),
  ('supply_chain_manager', 'tracking.manage'),
  ('supply_chain_manager', 'regions.manage'),
  ('supply_chain_manager', 'business_units.manage'),
  ('supply_chain_manager', 'facilities.manage'),
  ('supply_chain_manager', 'audit.read')
on conflict (role, permission_key) do nothing;

-- Carrier/Field — Execution & Compliance (Drivers & Carriers)
insert into public.role_permissions (role, permission_key)
values
  ('drivers_carriers', 'documents.manage'),
  ('drivers_carriers', 'shipments.manage'),
  ('drivers_carriers', 'tracking.manage'),
  ('drivers_carriers', 'audit.read')
on conflict (role, permission_key) do nothing;
