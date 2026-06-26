# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install build dependencies for C-extensions (like psutil)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies list
COPY backend/requirements.txt /app/backend/requirements.txt

# Upgrade pip and install requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt && \
    pip install --no-cache-dir psutil

# Copy project code
COPY . /app

# Expose application port
EXPOSE 8000

# Run backend api server
CMD ["python", "-m", "backend.api.app"]
