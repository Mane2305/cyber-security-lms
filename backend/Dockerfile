FROM python:3.11-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI app with dynamic port for Railway
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
