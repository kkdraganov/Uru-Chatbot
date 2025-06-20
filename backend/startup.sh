#!/bin/bash

# Parse arguments
RELOAD_MODE="false"
if [ "$1" = "--reload" ] || [ "$1" = "dev" ]; then
    RELOAD_MODE="true"
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
cd database && alembic upgrade head && cd ..

# Start the application
if [ "$RELOAD_MODE" = "true" ]; then
    echo "Starting FastAPI application with hot reload (development mode)..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Starting FastAPI application (production mode)..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
