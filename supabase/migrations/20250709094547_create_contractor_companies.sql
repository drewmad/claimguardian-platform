CREATE SCHEMA IF NOT EXISTS contractor_connection;

CREATE TABLE IF NOT EXISTS contractor_connection.contractor_companies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        text            NOT NULL,
  license_number      text            NOT NULL UNIQUE,
  license_type        text,
  license_status      text,
  license_issued      date,
  license_expires     date,
  address_line1       text,
  address_line2       text,
  city                text,
  state               text,
  postal_code         text,
  phone               text,
  email               text,
  website             text,
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  contractor_connection.contractor_companies IS
'Master record for every contractor company we track. Updated weekly by merge_license_into_contractor().';

CREATE UNIQUE INDEX IF NOT EXISTS contractor_companies_license_idx
  ON contractor_connection.contractor_companies (license_number);
