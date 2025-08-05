# Remote Schema Consolidated

Date: Thu Jul 31 17:31:09 EDT 2025
Local migrations archived to: supabase/migrations.archive.20250731_173109

## What Happened
1. The remote Supabase database (with all migrations applied) was dumped
2. This dump represents the consolidated schema (no individual migrations needed)
3. Local migrations were archived as they don't match remote
4. The remote schema is now in schema.sql

## Remote Migrations That Were Consolidated
The following migrations were already applied on remote and are now part of schema.sql:
- complete_schema_v1
- user_tracking
- policy_documents
- complete_database_v1_1
- complete_legal_system
- user_tracking_system
- fix_column_names
- create_disaster_events_table
- create_user_checklist_progress_table
- create_tidal_stations_table
- add_enrichment_update_procedure
- add_email_logs_table
- fix_missing_columns_v2
- audit_logging_tables
- fix_auth_security_definer_functions
- compliance_grade_consent_system
- add_phone_to_users_metadata
- ensure_legal_documents_mapped_correct
- And many more...

## Going Forward
- The schema.sql file is your source of truth
- Make changes directly to schema.sql
- Test locally with: supabase db reset
- Apply to remote with: supabase db push
