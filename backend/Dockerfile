FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi==0.110.1 \
    uvicorn==0.25.0 \
    motor==3.3.1 \
    pymongo==4.5.0 \
    python-dotenv==1.2.1 \
    pydantic==2.12.5 \
    passlib[bcrypt]==1.7.4 \
    python-jose[cryptography]==3.5.0 \
    python-multipart==0.0.22 \
    bcrypt==4.1.3 \
    qrcode==8.2 \
    email-validator==2.3.0 \
    stripe==14.3.0

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
