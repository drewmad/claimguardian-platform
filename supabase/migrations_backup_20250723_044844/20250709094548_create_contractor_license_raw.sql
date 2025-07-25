create table if not exists contractor_license_raw (
  license_number  text primary key,
  board           text,
  license_type    text,
  rank            text,
  qualifier_name  text,
  dba_name        text,
  city            text,
  county_name     text,
  status_primary  text,
  status_secondary text,
  issue_date      date,
  expiry_date     date,
  bond_ind        boolean,
  wc_exempt       boolean,
  liability_ins   boolean,
  discipline_flag boolean,
  updated_at      timestamptz default now()
);

alter table contractor_connection.contractor_companies
  add column if not exists last_sync_at timestamptz;

create or replace function merge_license_into_contractor() returns void as $$
insert into contractor_connection.contractor_companies (
    license_number,
    company_name,
    license_type,
    license_status,
    license_issued,
    license_expires,
    last_sync_at
)
select
    raw.license_number,
    coalesce(raw.dba_name, raw.qualifier_name),
    raw.license_type,
    raw.status_primary,
    raw.issue_date,
    raw.expiry_date,
    now()
from contractor_license_raw as raw
on conflict (license_number)
do update set
  company_name      = excluded.company_name,
  license_type      = excluded.license_type,
  license_status    = excluded.license_status,
  license_issued    = excluded.license_issued,
  license_expires   = excluded.license_expires,
  last_sync_at      = excluded.last_sync_at;
$$ language sql;
