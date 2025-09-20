FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services ./services

ENV PYTHONPATH=/app
ENV GATEWAY_DRY_RUN=true

CMD ["python", "-m", "services.gateway"]
