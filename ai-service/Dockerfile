# 운영 배포용 이미지. 실행: 루트에서 docker compose -f docker-compose.prod.yml up -d --build
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 컨테이너 밖(backend)에서 접근할 수 있게 모든 주소에서 받는다. 외부 포트는 compose에서 열지 않는다
ENV HOST=0.0.0.0 \
    PORT=8000
EXPOSE 8000
CMD ["python", "app.py"]
