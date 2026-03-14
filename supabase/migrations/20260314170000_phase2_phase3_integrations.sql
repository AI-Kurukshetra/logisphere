create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  system_type text not null,
  mode text not null default 'pull',
  status text not null default 'planned',
  endpoint_url text,
  auth_type text,
  config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  integration_id uuid references public.integrations(id) on delete set null,
  direction text not null default 'inbound',
  event_type text not null,
  status text not null default 'pending',
  headers jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integrations_company_id_idx
  on public.integrations(company_id, created_at desc);

create index if not exists webhook_events_company_id_idx
  on public.webhook_events(company_id, received_at desc);

create index if not exists webhook_events_integration_id_idx
  on public.webhook_events(integration_id, received_at desc);

alter table public.integrations enable row level security;
alter table public.webhook_events enable row level security;

create policy integrations_select on public.integrations
for select
to authenticated
using (public.is_company_member(company_id));

create policy integrations_insert on public.integrations
for insert
to authenticated
with check (public.has_permission('imports.manage', company_id));

create policy integrations_update on public.integrations
for update
to authenticated
using (public.has_permission('imports.manage', company_id))
with check (public.has_permission('imports.manage', company_id));

create policy integrations_delete on public.integrations
for delete
to authenticated
using (public.has_permission('imports.manage', company_id));

create policy webhook_events_select on public.webhook_events
for select
to authenticated
using (public.is_company_member(company_id));

create policy webhook_events_insert on public.webhook_events
for insert
to authenticated
with check (public.has_permission('imports.manage', company_id));

create policy webhook_events_update on public.webhook_events
for update
to authenticated
using (public.has_permission('imports.manage', company_id))
with check (public.has_permission('imports.manage', company_id));
