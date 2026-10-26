-- AI-Powered Prep Manager - Supabase Multi-Tenant Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Covers: Organizations, Members (RBAC), Rule Sets, Reviews, Images, Checks, Evidence, Overrides, Audit Logs, and Storage

create extension if not exists pgcrypto;

-- Enumerated types
create type public.review_status as enum ('PASS', 'FAIL', 'UNCERTAIN');
create type public.member_role as enum ('operator', 'reviewer', 'manager', 'admin');
create type public.calibration_status as enum ('pending', 'calibrated', 'dismissed');

-- 1. Organizations (Tenants)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- 2. Organization Members & Roles (RBAC)
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'operator',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- 3. Versioned Authoritative Rule Sets
create table public.rule_sets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_set_id text not null,
  version text not null,
  category text not null,
  description text,
  definition jsonb not null,
  is_active boolean not null default false,
  checksum text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, rule_set_id, version)
);

-- 4. Prep Review Sessions
create table public.prep_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null,
  work_order_ref text,
  rule_set_id uuid not null references public.rule_sets(id),
  rule_set_version text not null,
  overall_status public.review_status,
  duration_ms integer,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 5. Multi-Angle Review Images & Quality Metrics
create table public.prep_review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.prep_reviews(id) on delete cascade,
  storage_path text not null,
  image_angle text not null default 'front',
  width integer,
  height integer,
  quality_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. Granular Check Verdicts
create table public.prep_check_results (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.prep_reviews(id) on delete cascade,
  check_id text not null,
  name text not null,
  visually_verifiable boolean not null default true,
  verdict public.review_status not null,
  reason text not null,
  rule_id text not null,
  rule_set_version text not null,
  created_at timestamptz not null default now()
);

-- 7. Perceptual Evidence & Bounding Boxes
create table public.prep_evidence (
  id uuid primary key default gen_random_uuid(),
  check_result_id uuid not null references public.prep_check_results(id) on delete cascade,
  image_id uuid references public.prep_review_images(id) on delete set null,
  evidence_key text not null,
  extracted_value jsonb,
  confidence numeric(5,4) check (confidence >= 0 and confidence <= 1),
  bbox jsonb, -- e.g. {"ymin": 0.25, "xmin": 0.30, "ymax": 0.55, "xmax": 0.70}
  ocr_text text,
  created_at timestamptz not null default now()
);

-- 8. Human Reviewer Overrides & Feedback Loop
create table public.prep_overrides (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.prep_reviews(id) on delete cascade,
  check_result_id uuid references public.prep_check_results(id) on delete cascade,
  original_verdict public.review_status not null,
  corrected_verdict public.review_status not null,
  note text not null,
  reviewer_id uuid not null references auth.users(id),
  calibration_status public.calibration_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 9. Immutable Audit Ledger
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Indexes for fast lookup
create index prep_reviews_org_created_idx on public.prep_reviews (organization_id, created_at desc);
create index prep_check_results_review_idx on public.prep_check_results (review_id);
create index prep_evidence_check_idx on public.prep_evidence (check_result_id);
create index prep_overrides_review_idx on public.prep_overrides (review_id);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index rule_sets_active_cat_idx on public.rule_sets (organization_id, category, is_active);

-- Helper security functions
create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

create or replace function public.get_user_role(target_org uuid)
returns public.member_role language sql stable security definer set search_path = public as $$
  select role from public.organization_members
  where organization_id = target_org and user_id = auth.uid()
  limit 1;
$$;

-- Enable Row Level Security (RLS) on all tables
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.rule_sets enable row level security;
alter table public.prep_reviews enable row level security;
alter table public.prep_review_images enable row level security;
alter table public.prep_check_results enable row level security;
alter table public.prep_evidence enable row level security;
alter table public.prep_overrides enable row level security;
alter table public.audit_logs enable row level security;

-- RLS Policies
create policy organization_member_read on public.organizations
  for select using (public.is_org_member(id));

create policy organization_members_read on public.organization_members
  for select using (public.is_org_member(organization_id));

create policy rule_sets_member_read on public.rule_sets
  for select using (public.is_org_member(organization_id));

create policy rule_sets_manager_manage on public.rule_sets
  for all using (
    public.is_org_member(organization_id) and
    public.get_user_role(organization_id) in ('manager', 'admin')
  ) with check (
    public.is_org_member(organization_id) and
    public.get_user_role(organization_id) in ('manager', 'admin')
  );

create policy reviews_member_access on public.prep_reviews
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy review_images_member_access on public.prep_review_images
  for all using (
    exists (select 1 from public.prep_reviews r where r.id = review_id and public.is_org_member(r.organization_id))
  ) with check (
    exists (select 1 from public.prep_reviews r where r.id = review_id and public.is_org_member(r.organization_id))
  );

create policy check_results_member_access on public.prep_check_results
  for all using (
    exists (select 1 from public.prep_reviews r where r.id = review_id and public.is_org_member(r.organization_id))
  ) with check (
    exists (select 1 from public.prep_reviews r where r.id = review_id and public.is_org_member(r.organization_id))
  );

create policy evidence_member_access on public.prep_evidence
  for all using (
    exists (select 1 from public.prep_check_results c join public.prep_reviews r on r.id = c.review_id where c.id = check_result_id and public.is_org_member(r.organization_id))
  ) with check (
    exists (select 1 from public.prep_check_results c join public.prep_reviews r on r.id = c.review_id where c.id = check_result_id and public.is_org_member(r.organization_id))
  );

create policy overrides_member_read on public.prep_overrides
  for select using (
    exists (select 1 from public.prep_reviews r where r.id = review_id and public.is_org_member(r.organization_id))
  );

create policy overrides_reviewer_insert on public.prep_overrides
  for insert with check (
    exists (
      select 1 from public.prep_reviews r
      where r.id = review_id and
      public.is_org_member(r.organization_id) and
      public.get_user_role(r.organization_id) in ('reviewer', 'manager', 'admin')
    )
  );

create policy audit_logs_read on public.audit_logs
  for select using (
    public.is_org_member(organization_id) and
    public.get_user_role(organization_id) in ('reviewer', 'manager', 'admin')
  );
