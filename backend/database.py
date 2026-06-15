import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "eda_forecasting")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_config = Database()

async def connect_to_mongo():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    try:
        # Enforce a short 1000ms timeout to prevent hangs if MongoDB is offline
        if "mongodb+srv" in MONGO_URL:
            db_config.client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=1000)
        else:
            db_config.client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=1000)
            
        # Verify connection immediately
        await db_config.client.admin.command('ping')
        db_config.db = db_config.client[DB_NAME]
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"MongoDB offline or connection failed. Falling back to disk-only mode. Details: {e}")
        db_config.db = None
        db_config.client = None

async def close_mongo_connection():
    if db_config.client is not None:
        db_config.client.close()
        print("MongoDB connection closed.")

def get_database():
    """Dependency injection helper"""
    return db_config.db
