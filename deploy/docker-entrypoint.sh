#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  npx prisma db push --skip-generate 2>/dev/null || npx prisma migrate deploy 2>/dev/null || true
fi

exec node server.js
