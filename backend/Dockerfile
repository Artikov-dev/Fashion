FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    FLASK_CONFIG=production \
    FLASK_APP=app.py

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# DB migration ishga tushiradi, keyin gunicorn
CMD ["sh", "-c", "python3 -c 'from app import create_app; from extensions import db; app = create_app(\"production\"); app.app_context().push(); db.create_all()' && gunicorn wsgi:app -b 0.0.0.0:8000 --workers 4 --timeout 120 --access-logfile - --error-logfile -"]
