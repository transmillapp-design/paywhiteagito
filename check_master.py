#!/usr/bin/env python3
"""
Check master account data in MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_master_account():
    # Load environment variables
    load_dotenv('/app/backend/.env')
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print("🔍 Checking master account in MongoDB...")
    
    # Find master account
    master_account = await db.users.find_one({"email": "master@agitocash.com"})
    
    if master_account:
        print("✅ Master account found!")
        print(f"   Email: {master_account.get('email')}")
        print(f"   Full name: {master_account.get('full_name')}")
        print(f"   Phone: {master_account.get('phone', 'MISSING!')}")
        print(f"   Is master: {master_account.get('is_master_account')}")
        print(f"   User type: {master_account.get('user_type')}")
        
        # Check if phone field is missing
        if 'phone' not in master_account:
            print("❌ PROBLEM: Phone field is missing!")
            print("🔧 Fixing master account...")
            
            # Update master account with phone field
            result = await db.users.update_one(
                {"email": "master@agitocash.com"},
                {"$set": {"phone": "11999999999"}}
            )
            
            if result.modified_count > 0:
                print("✅ Master account fixed!")
            else:
                print("❌ Failed to fix master account")
        else:
            print("✅ Phone field exists")
    else:
        print("❌ Master account not found!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_master_account())