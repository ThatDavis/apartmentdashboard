#!/bin/sh
set -e

echo "Running database migrations..."
node dist/server/migrate.js

echo "Starting server..."
exec node dist/server/index.js
