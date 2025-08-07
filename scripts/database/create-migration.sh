#!/bin/bash
# Create a new Supabase migration with proper naming

NAME=$1
if [ -z "$NAME" ]; then
  echo "Usage: ./create-migration.sh migration_name"
  echo "Example: ./create-migration.sh add_user_profiles"
  exit 1
fi

# Navigate to web app where supabase is configured
cd apps/web && supabase migration new $NAME

echo "Migration created! Check apps/web/supabase/migrations/"
