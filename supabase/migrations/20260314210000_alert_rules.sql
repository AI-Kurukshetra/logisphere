create table if not exists public.alert_rules (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('cost_overrun','service_failure','invoice_exception','payment_delay','carrier_sla')),
  threshold  numeric(12,4) not null,
  condition  jsonb not null default '{}',
  channels   text[] not null default array['in_app'],
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alert_rules_company_id_idx on public.alert_rules(company_id);
create index if not exists alert_rules_enabled_idx on public.alert_rules(company_id, enabled);

alter table public.alert_rules enable row level security;

-- Use the existing is_company_member() and has_permission() helpers
create policy alert_rules_select on public.alert_rules for select to authenticated
  using (public.is_company_member(company_id));
create policy alert_rules_insert on public.alert_rules for insert to authenticated
  with check (public.has_permission('alerts.manage', company_id));
create policy alert_rules_update on public.alert_rules for update to authenticated
  using (public.has_permission('alerts.manage', company_id))
  with check (public.has_permission('alerts.manage', company_id));
create policy alert_rules_delete on public.alert_rules for delete to authenticated
  using (public.has_permission('alerts.manage', company_id));

-- Seed permission for alerts
insert into public.permissions (key, category, label, description)
values ('alerts.manage', 'alerts', 'Manage alert rules', 'Create, update, and delete alert rules for the company.')
on conflict (key) do update
set
  category = excluded.category,
  label = excluded.label,
  description = excluded.description;

-- Assign permission to admin and manager
insert into public.role_permissions (role, permission_key)
values ('admin', 'alerts.manage'), ('manager', 'alerts.manage')
on conflict (role, permission_key) do nothing;
