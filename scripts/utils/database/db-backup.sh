#!/bin/bash

# Database backup script
# Creates timestamped backups before major operations

set -e

# Configuration
BACKUP_DIR="supabase/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔒 Starting database backup..."

# Function to backup local database
backup_local() {
  echo "📦 Backing up local database..."

  # Check if Supabase is running
  if ! supabase status 2>/dev/null | grep -q "API URL"; then
    echo "⚠️  Local Supabase not running, skipping local backup"
    return
  fi

  # Dump schema
  supabase db dump --local -f "$BACKUP_DIR/local_schema_$TIMESTAMP.sql" --keep-comments

  # Dump data (optional, can be large)
  if [ "$1" == "--with-data" ]; then
    supabase db dump --local --data-only -f "$BACKUP_DIR/local_data_$TIMESTAMP.sql"
  fi

  echo "✅ Local backup completed"
}

# Function to backup remote database
backup_remote() {
  echo "☁️  Backing up remote database..."

  # Check if linked
  if ! supabase db remote status 2>/dev/null; then
    echo "⚠️  Not linked to remote database, skipping remote backup"
    return
  fi

  # Dump schema
  supabase db dump --linked -f "$BACKUP_DIR/remote_schema_$TIMESTAMP.sql" --keep-comments

  # Dump data (optional, requires confirmation)
  if [ "$1" == "--with-data" ]; then
    echo "⚠️  Remote data backup can be large and slow. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      supabase db dump --linked --data-only -f "$BACKUP_DIR/remote_data_$TIMESTAMP.sql"
    fi
  fi

  echo "✅ Remote backup completed"
}

# Function to clean old backups
cleanup_old_backups() {
  echo "🧹 Cleaning old backups (older than $KEEP_DAYS days)..."

  if [ -d "$BACKUP_DIR" ]; then
    find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$KEEP_DAYS -delete
  fi

  echo "✅ Cleanup completed"
}

# Parse arguments
case "${1:-both}" in
  "local")
    backup_local "$2"
    ;;
  "remote")
    backup_remote "$2"
    ;;
  "both"|*)
    backup_local "$2"
    backup_remote "$2"
    ;;
esac

# Always cleanup old backups
cleanup_old_backups

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lht "$BACKUP_DIR" | head -10

echo ""
echo "✅ Backup process completed!"
echo "📁 Backups stored in: $BACKUP_DIR"
