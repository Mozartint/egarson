import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_admin():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    existing_admin = await db.users.find_one({"email": "admin@qr-restaurant.com"})
    if existing_admin:
        print("Admin kullanıcısı zaten var.")
        return
    
    admin_user = {
        "id": "admin-001",
        "email": "admin@qr-restaurant.com",
        "password": pwd_context.hash("admin123"),
        "full_name": "Admin User",
        "role": "admin",
        "restaurant_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print("✓ Admin kullanıcısı oluşturuldu:")
    print("  Email: admin@qr-restaurant.com")
    print("  Şifre: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
