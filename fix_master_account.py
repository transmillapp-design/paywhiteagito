#!/usr/bin/env python3
"""
Fix master account bcrypt hash issue
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt

async def fix_master_account():
    """Fix the master account bcrypt hash"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print("🔧 FIXING MASTER ACCOUNT BCRYPT HASH")
    print("=" * 50)
    
    # Check if master account exists
    master_account = await db.users.find_one({"email": "master@agitocash.com"})
    
    if not master_account:
        print("❌ Master account not found in database")
        return False
    
    print(f"✅ Master account found: {master_account.get('full_name', 'N/A')}")
    print(f"   Email: {master_account.get('email')}")
    print(f"   Current hash: {master_account.get('password_hash', 'N/A')[:20]}...")
    
    # Generate new bcrypt hash for "master123"
    new_password_hash = bcrypt.hash("master123")
    print(f"   New hash: {new_password_hash[:20]}...")
    
    # Update the master account with correct hash
    result = await db.users.update_one(
        {"email": "master@agitocash.com"},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    if result.modified_count > 0:
        print("✅ Master account password hash updated successfully")
        
        # Verify the fix by checking if bcrypt.verify works
        updated_account = await db.users.find_one({"email": "master@agitocash.com"})
        if bcrypt.verify("master123", updated_account.get('password_hash', '')):
            print("✅ Password verification test PASSED")
            return True
        else:
            print("❌ Password verification test FAILED")
            return False
    else:
        print("❌ Failed to update master account")
        return False

if __name__ == "__main__":
    result = asyncio.run(fix_master_account())
    if result:
        print("\n🎯 MASTER ACCOUNT FIXED - Ready for testing")
    else:
        print("\n❌ MASTER ACCOUNT FIX FAILED")