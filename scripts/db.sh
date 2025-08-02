#!/bin/bash
#
# Centralized Database Management Script
#
# This script provides a unified and consistent interface for all database operations,
# consolidating dozens of previous one-off scripts into a single, reliable entry point.
# It is designed to be the source of truth for database management tasks, including
# schema migrations, data fixes, validation checks, and more.
#
# For a full list of commands and subcommands, run with --help.
#

# --- Core Setup ---
set -e
source "$(dirname "$0")/utils/common.sh"
check_project_root

# --- Environment Validation ---
if [ -z "$DATABASE_URL" ]; then
  log_error "DATABASE_URL environment variable is not set."
  log_info "Please set it and re-run the script. e.g., DATABASE_URL=\`...your_url...\` ./scripts/db.sh"
  exit 1
fi
export DATABASE_URL



# --- Help Documentation ---
print_help() {
  echo "Usage: ./scripts/db.sh <command> [subcommand] [options]"
  echo ""
  echo "A unified script for all ClaimGuardian database operations."
  echo ""
  echo "Commands:"
  echo "  migrate <command> [name] Apply, revert, or create migrations."
  echo "    -> create <name>      Creates a new, timestamped migration file."
  echo "    -> up [count]         Applies all or a specific number of pending migrations."
  echo "    -> down [count]       Reverts the last or a specific number of applied migrations."
  echo "    -> status             Shows the status of all migrations."
  echo ""
  echo "  check <type> [name]   Run validation and verification checks."
  echo "    -> connection         Verifies the connection to Supabase."
  echo "    -> tables <name>      Verifies integrity of specific tables (e.g., 'auth', 'tracking')."
  echo "    -> rls <name>         Checks Row Level Security policies (e.g., 'legal')."
  echo ""
  echo "  data <type> <name>    Manage seed data and content."
  echo "    -> seed <name>        Creates seed data (e.g., 'test-user')."
  echo "    -> update <name>      Updates specific content (e.g., 'legal-docs')."
  echo ""
  echo "  exec <type> <file>    Execute raw SQL or API scripts."
  echo "    -> sql <file>         Executes a raw SQL file."
  echo "    -> api <script>       Executes a script via Supabase API."
  echo ""
  echo "  schema <command>      Manage database schema (CI-friendly)."
  echo "    -> dump               Dumps current schema from database."
  echo "    -> apply              Applies schema.sql to database."
  echo "    -> diff <base> <new>  Compares two schema files."
  echo "    -> validate [env]     Validates schema against environment."
  echo ""
  echo "  backup                Creates a database backup."
  echo "  sync                  Syncs database state."
  echo "  open                  Opens Supabase SQL editor."
  echo ""
  echo "  help, --help          Show this help message."
  echo ""
}

# --- Command Functions ---

run_migration() {
    local action="$1"
    local option1="$2"
    local option2="$3"
    
    log_info "Running migration: $action $option1 $option2"
    # The DATABASE_URL is now in the environment, so this should just work.
    # We specify the migrations directory and a migrations table name.
    pnpm exec node-pg-migrate --migrations-dir "$MIGRATIONS_DIR" --migrations-table "cg_migrations" "$action" "$option1" "$option2"
}


check_connection() {
  log_info "Checking Supabase connection..."
  # Logic from check-supabase-connection.js
  node "$DB_CHECKS_DIR/connection.js"
}

check_tables() {
    local table_name="$1"
    if [ -z "$table_name" ]; then
        log_error "Table name is required. Usage: ./scripts/db.sh check tables <table_name>"
        return 1
    fi
    local check_script="$DB_CHECKS_DIR/verify-${table_name}-tables.js"
    if [ ! -f "$check_script" ]; then
        log_error "Check script not found for table: $table_name at $check_script"
        return 1
    fi
    log_info "Verifying tables for: $table_name"
    node "$check_script"
}

check_rls() {
    local rls_name="$1"
    if [ -z "$rls_name" ]; then
        log_error "RLS check name is required. Usage: ./scripts/db.sh check rls <rls_name>"
        return 1
    fi
    local check_script="$DB_CHECKS_DIR/check-${rls_name}-rls.ts"
     if [ ! -f "$check_script" ]; then
        log_error "RLS check script not found for: $rls_name at $check_script"
        return 1
    fi
    log_info "Checking RLS for: $rls_name"
    pnpm ts-node "$check_script"
}

seed_data() {
    local seed_name="$1"
    if [ -z "$seed_name" ]; then
        log_error "Seed name is required. Usage: ./scripts/db.sh data seed <seed_name>"
        return 1
    fi
    local seed_script="$DB_SEED_DIR/${seed_name}.js"
    if [ ! -f "$seed_script" ]; then
        log_error "Seed script not found: $seed_script"
        return 1
    fi
    log_info "Seeding data for: $seed_name"
    node "$seed_script"
}

update_content() {
    local content_name="$1"
    if [ -z "$content_name" ]; then
        log_error "Content name is required. Usage: ./scripts/db.sh data update <content_name>"
        return 1
    fi
    local update_script="$DB_CONTENT_DIR/update-${content_name}.ts"
    if [ ! -f "$update_script" ]; then
        log_error "Update script not found: $update_script"
        return 1
    fi
    log_info "Updating content for: $content_name"
    pnpm ts-node "$update_script"
}

exec_sql() {
  local sql_file="$1"
  if [ -z "$sql_file" ] || [ ! -f "$sql_file" ]; then
    log_error "SQL file not found or not specified. Usage: ./scripts/db.sh exec sql <path_to_file.sql>"
    return 1
  fi
  log_info "Executing raw SQL file: $sql_file"
  # Logic from execute-sql-direct.sh
  "$DB_UTILS_DIR/execute-sql.sh" "$sql_file"
}

exec_api() {
    local api_script="$1"
    if [ -z "$api_script" ] || [ ! -f "$api_script" ]; then
        log_error "API script not found or not specified. Usage: ./scripts/db.sh exec api <path_to_script>"
        return 1
    fi
    log_info "Executing script via Supabase API: $api_script"
    # Logic from execute-sql-via-api.mjs
    node "$api_script"
}

sync_db() {
    log_info "Syncing database state..."
    # Logic from db-sync.sh
    "$DB_UTILS_DIR/sync.sh"
}

open_sql_editor() {
    log_info "Opening Supabase SQL editor..."
    # Logic from open-supabase-sql.sh
    "$DB_UTILS_DIR/open-sql-editor.sh"
}

# --- Main Command Router ---
main() {
  local command="$1"
  local subcommand="$2"
  local option="$3"

  if [[ "$command" == "help" || "$command" == "--help" || -z "$command" ]]; then
    print_help
    exit 0
  fi

  case "$command" in
    migrate)
      case "$subcommand" in
        create) run_migration "create" "$option" ;;
        up) run_migration "up" "$option" ;;
        down) run_migration "down" "$option" ;;
        # A dry run of 'up' is the official way to check migration status.
        status) run_migration "up" "--dry-run" ;;
        *) log_error "Invalid 'migrate' command. See --help for options." && exit 1 ;;
      esac
      ;;
    check)
      case "$subcommand" in
        connection) check_connection ;;
        tables) check_tables "$option" ;;
        rls) check_rls "$option" ;;
        *) log_error "Invalid 'check' command. See --help for options." && exit 1 ;;
      esac
      ;;
    data)
        case "$subcommand" in
            seed) seed_data "$option" ;;
            update) update_content "$option" ;;
            *) log_error "Invalid 'data' command. See --help for options." && exit 1 ;;
        esac
        ;;
    exec)
        case "$subcommand" in
            sql) exec_sql "$option" ;;
            api) exec_api "$option" ;;
            *) log_error "Invalid 'exec' command. See --help for options." && exit 1 ;;
        esac
        ;;
    sync)
        sync_db
        ;;
    open)
        open_sql_editor
        ;;
    schema)
      "$DB_UTILS_DIR/schema.sh" "$subcommand"
      ;;
    backup)
      "$DB_UTILS_DIR/backup.sh"
      ;;
    *)
      log_error "Unknown command: $command"
      print_help
      exit 1
      ;;
  esac

  log_success "Database operation '$command $subcommand' completed successfully."
}

# --- Script Execution ---
main "$@"
