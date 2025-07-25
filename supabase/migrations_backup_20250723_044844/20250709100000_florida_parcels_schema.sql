-- Florida Parcels ETL Schema
-- Creates tables and functions for ingesting parcel data from FGIO, FDOT, FGDL, and DOR

-- Enable required extensions
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Create external schema for raw data
create schema if not exists external;

-- Staging table for raw parcel data
create table if not exists external.fl_parcels_raw (
  pk               uuid primary key default gen_random_uuid(),
  source           text not null check (source in ('fgio', 'fdot', 'fgdl', 'dor')),
  source_url       text not null,
  download_ts      timestamptz not null default now(),
  county_fips      varchar(3) not null,
  parcel_id        text not null,
  geom             geometry(Polygon, 4326) not null,
  attrs            jsonb not null,
  ingest_batch_id  uuid not null,
  created_at       timestamptz not null default now(),
  
  -- Add index for efficient lookups
  constraint unique_source_parcel unique (source, parcel_id)
);

-- Indexes for performance
create index idx_fl_parcels_raw_county_fips on external.fl_parcels_raw(county_fips);
create index idx_fl_parcels_raw_parcel_id on external.fl_parcels_raw(parcel_id);
create index idx_fl_parcels_raw_source on external.fl_parcels_raw(source);
create index idx_fl_parcels_raw_geom on external.fl_parcels_raw using gist(geom);
create index idx_fl_parcels_raw_attrs on external.fl_parcels_raw using gin(attrs);

-- Event log for tracking ingests
create table if not exists external.fl_parcel_ingest_events (
  id               uuid primary key default gen_random_uuid(),
  ingest_batch_id  uuid not null unique,
  source           text not null,
  status           text not null check (status in ('started', 'completed', 'failed')),
  record_count     integer,
  error_message    text,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  metadata         jsonb
);

-- Materialized view for query-ready parcel data
create materialized view if not exists public.parcels as
select
  parcel_id,
  county_fips,
  (attrs->>'situs_addr')::text as situs_address,
  (attrs->>'landuse_code')::text as landuse_code,
  (attrs->>'just_value')::numeric as just_value,
  (attrs->>'year_built')::integer as year_built,
  (attrs->>'owner_name')::text as owner_name,
  (attrs->>'living_area')::numeric as living_area,
  (attrs->>'total_area')::numeric as total_area,
  (attrs->>'bedroom_count')::integer as bedroom_count,
  (attrs->>'bathroom_count')::numeric as bathroom_count,
  geom,
  source,
  download_ts
from external.fl_parcels_raw
where source in ('fgio', 'fdot'); -- Exclude DOR if privacy needed

-- Create unique index for refresh concurrently
create unique index on public.parcels(parcel_id);

-- Additional indexes for common queries
create index idx_parcels_county on public.parcels(county_fips);
create index idx_parcels_landuse on public.parcels(landuse_code);
create index idx_parcels_value on public.parcels(just_value);
create index idx_parcels_geom on public.parcels using gist(geom);

-- Note: Cannot enable RLS on materialized views, skipping
-- alter table public.parcels enable row level security;

-- Note: Cannot create policies on materialized views without RLS, skipping
-- create policy "Read-only access for authenticated users" on public.parcels
--   for select
--   to authenticated
--   using (true);

-- Helper function to get max ObjectID for FDOT delta sync
create or replace function public.max_objectid_for_county(cnty_layer int)
returns table(max int) 
language plpgsql 
stable as $$
begin
  return query
  select max((attrs->>'objectid')::int)
  from external.fl_parcels_raw
  where source = 'fdot'
    and (attrs->>'layerid')::int = cnty_layer;
end $$;

-- Function to refresh materialized view
create or replace function public.refresh_parcels_view()
returns void
language plpgsql as $$
begin
  refresh materialized view concurrently public.parcels;
end $$;

-- Grant permissions
grant select on public.parcels to authenticated;
grant select on external.fl_parcels_raw to service_role;
grant insert on external.fl_parcels_raw to service_role;
grant select, insert, update on external.fl_parcel_ingest_events to service_role;