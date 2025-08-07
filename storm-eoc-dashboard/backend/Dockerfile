# syntax=docker/dockerfile:1

# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for geospatial libraries and others
RUN apt-get update && apt-get install -y \
    build-essential \
    libgdal-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the application code
COPY ./app /app/app

# Download NLTK data required for sentiment analysis
RUN python -m nltk.downloader vader_lexicon

# The command to run the application (or workers) is defined in docker-compose.yml
# Default command for the main backend service:
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
