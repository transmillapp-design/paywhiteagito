#!/usr/bin/env python3
"""
Check what accounts exist in the database
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_database():
    """Check what accounts exist in the database"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print("🔍 CHECKING DATABASE CONTENTS")
    print("=" * 50)
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {db_name}")
    
    # Check all users
    users = await db.users.find({}).to_list(100)
    
    print(f"\n📊 TOTAL USERS FOUND: {len(users)}")
    print("-" * 30)
    
    demo_accounts = ["cliente@demo.com", "lojista@demo.com", "master@agitocash.com"]
    
    for user in users:
        email = user.get('email', 'N/A')
        full_name = user.get('full_name', 'N/A')
        user_type = user.get('user_type', 'N/A')
        is_master = user.get('is_master_account', False)
        has_password = 'password_hash' in user and user['password_hash'] is not None
        
        status = "🎯 DEMO" if email in demo_accounts else "👤 USER"
        master_flag = "👑 MASTER" if is_master else ""
        password_status = "🔐 HASH" if has_password else "❌ NO HASH"
        
        print(f"{status} {email}")
        print(f"   Name: {full_name}")
        print(f"   Type: {user_type} {master_flag}")
        print(f"   Password: {password_status}")
        
        if email in demo_accounts:
            print(f"   ✅ DEMO ACCOUNT FOUND")
        
        print()
    
    # Check specifically for demo accounts
    print("🎯 DEMO ACCOUNTS STATUS:")
    print("-" * 30)
    
    for demo_email in demo_accounts:
        account = await db.users.find_one({"email": demo_email})
        if account:
            print(f"✅ {demo_email} - EXISTS")
            if account.get('password_hash'):
                print(f"   🔐 Password hash: {account['password_hash'][:20]}...")
            else:
                print(f"   ❌ No password hash")
        else:
            print(f"❌ {demo_email} - NOT FOUND")
    
    # Check collections
    collections = await db.list_collection_names()
    print(f"\n📁 COLLECTIONS: {collections}")

if __name__ == "__main__":
    asyncio.run(check_database())