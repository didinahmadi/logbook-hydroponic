#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

case "${1:-up}" in
  up)
    echo "Starting Supabase local stack..."
    docker compose --env-file .env up -d
    echo ""
    echo "======================================"
    echo " Supabase is starting up!"
    echo "======================================"
    echo " Studio:    http://localhost:8000"
    echo " API:       http://localhost:8000"
    echo " DB (psql): localhost:5432"
    echo ""
    echo " Studio login: supabase / supabase-local-2024"
    echo "======================================"
    ;;
  down)
    echo "Stopping Supabase local stack..."
    docker compose --env-file .env down
    ;;
  reset)
    echo "Resetting Supabase (removes all data)..."
    docker compose --env-file .env down -v
    rm -rf ./volumes/db/data/*
    echo "Done. Run './start.sh up' to start fresh."
    ;;
  logs)
    docker compose --env-file .env logs -f "${2:-}"
    ;;
  ps)
    docker compose --env-file .env ps
    ;;
  *)
    echo "Usage: $0 {up|down|reset|logs [service]|ps}"
    exit 1
    ;;
esac
