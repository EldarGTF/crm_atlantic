#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  if ! npx prisma db push; then
    echo "WARN: prisma db push failed — check DATABASE_URL and postgres container"
  fi
fi

exec node server.js
