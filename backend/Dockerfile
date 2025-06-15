FROM python:3.11-slim

WORKDIR /app

# Debug: Print environment variables during build
RUN echo "Build-time SECRET_KEY: ${SECRET_KEY:-not_set}"
RUN echo "Build-time POSTGRES_USER: ${POSTGRES_USER:-not_set}"
RUN echo "Build-time POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-not_set}"
RUN echo "Build-time INSTANCE: ${INSTANCE:-not_set}"
RUN echo "Build-time DATABASE_URL: ${DATABASE_URL:-not_set}"
RUN echo "Build-time CORS_ORIGINS: ${CORS_ORIGINS:-not_set}"

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
