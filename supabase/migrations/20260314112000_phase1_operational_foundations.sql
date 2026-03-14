create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null,
  source_name text not null,
  file_name text,
  status text not null default 'pending',
  row_count integer not null default 0,
  processed_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null,
  format text not null default 'csv',
  status text not null default 'pending',
  file_name text,
  params jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status public.shipment_status not null,
  description text,
  location jsonb not null default '{}'::jsonb,
  event_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists documents_company_id_idx on public.documents(company_id, created_at desc);
create index if not exists import_jobs_company_id_idx on public.import_jobs(company_id, created_at desc);
create index if not exists export_jobs_company_id_idx on public.export_jobs(company_id, created_at desc);
create index if not exists tracking_events_company_id_idx on public.tracking_events(company_id, event_at desc);
create index if not exists tracking_events_shipment_id_idx on public.tracking_events(shipment_id, event_at desc);

alter table public.documents enable row level security;
alter table public.import_jobs enable row level security;
alter table public.export_jobs enable row level security;
alter table public.tracking_events enable row level security;

create policy documents_select on public.documents
for select
to authenticated
using (public.is_company_member(company_id));

create policy documents_insert on public.documents
for insert
to authenticated
with check (public.has_permission('documents.manage', company_id));

create policy documents_update on public.documents
for update
to authenticated
using (public.has_permission('documents.manage', company_id))
with check (public.has_permission('documents.manage', company_id));

create policy documents_delete on public.documents
for delete
to authenticated
using (public.has_permission('documents.manage', company_id));

create policy import_jobs_select on public.import_jobs
for select
to authenticated
using (public.is_company_member(company_id));

create policy import_jobs_insert on public.import_jobs
for insert
to authenticated
with check (public.has_permission('imports.manage', company_id));

create policy import_jobs_update on public.import_jobs
for update
to authenticated
using (public.has_permission('imports.manage', company_id))
with check (public.has_permission('imports.manage', company_id));

create policy export_jobs_select on public.export_jobs
for select
to authenticated
using (public.is_company_member(company_id));

create policy export_jobs_insert on public.export_jobs
for insert
to authenticated
with check (public.has_permission('imports.manage', company_id));

create policy export_jobs_update on public.export_jobs
for update
to authenticated
using (public.has_permission('imports.manage', company_id))
with check (public.has_permission('imports.manage', company_id));

create policy tracking_events_select on public.tracking_events
for select
to authenticated
using (public.is_company_member(company_id));

create policy tracking_events_insert on public.tracking_events
for insert
to authenticated
with check (public.has_permission('tracking.manage', company_id));

create policy tracking_events_update on public.tracking_events
for update
to authenticated
using (public.has_permission('tracking.manage', company_id))
with check (public.has_permission('tracking.manage', company_id));

insert into public.permissions (key, category, label, description)
values
  ('carriers.manage', 'operations', 'Manage carriers', 'Create and maintain carrier master records.'),
  ('contracts.manage', 'operations', 'Manage contracts', 'Create and maintain carrier contracts.'),
  ('rates.manage', 'operations', 'Manage rates', 'Create and maintain rate tables and validation rules.'),
  ('documents.manage', 'operations', 'Manage documents', 'Register invoice, contract, POD, and compliance documents.'),
  ('imports.manage', 'operations', 'Manage import jobs', 'Create and monitor import and export jobs.'),
  ('shipments.manage', 'operations', 'Manage shipments', 'Create and maintain shipment records.'),
  ('tracking.manage', 'operations', 'Manage tracking', 'Create shipment tracking events and status updates.'),
  ('invoices.manage', 'finance', 'Manage invoices', 'Create and maintain freight invoices.'),
  ('audits.run', 'finance', 'Run audits', 'Execute invoice audit validations and store results.'),
  ('payments.manage', 'finance', 'Manage payments', 'Create payment records and update invoice approval states.')
on conflict (key) do update
set
  category = excluded.category,
  label = excluded.label,
  description = excluded.description;

insert into public.role_permissions (role, permission_key)
values
  ('admin', 'carriers.manage'),
  ('admin', 'contracts.manage'),
  ('admin', 'rates.manage'),
  ('admin', 'documents.manage'),
  ('admin', 'imports.manage'),
  ('admin', 'shipments.manage'),
  ('admin', 'tracking.manage'),
  ('admin', 'invoices.manage'),
  ('admin', 'audits.run'),
  ('admin', 'payments.manage'),
  ('manager', 'carriers.manage'),
  ('manager', 'contracts.manage'),
  ('manager', 'rates.manage'),
  ('manager', 'documents.manage'),
  ('manager', 'imports.manage'),
  ('manager', 'shipments.manage'),
  ('manager', 'tracking.manage'),
  ('manager', 'invoices.manage'),
  ('manager', 'audits.run'),
  ('manager', 'payments.manage')
on conflict (role, permission_key) do nothing;
