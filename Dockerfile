FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/base.txt requirements/base.txt
RUN python -m pip install --upgrade pip \
    && pip install -r requirements/base.txt

COPY src src
COPY pyproject.toml ruff.toml ./

EXPOSE 8000

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
