import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database() -> AsyncIOMotorClient:
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    # Use environment variable or default to local MongoDB
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ecommerce")
    
    db.client = AsyncIOMotorClient(mongo_url)
    db.database = db.client[db_name]
    
    # Test connection
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB!")

# Collections
async def get_users_collection():
    database = await get_database()
    return database.users

async def get_products_collection():
    database = await get_database()
    return database.products

async def get_orders_collection():
    database = await get_database()
    return database.orders

async def get_carts_collection():
    database = await get_database()
    return database.carts

async def get_coupons_collection():
    database = await get_database()
    return database.coupons

async def get_wishlists_collection():
    database = await get_database()
    return database.wishlists