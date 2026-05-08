#!/usr/bin/env python3
"""
Check master account exact details
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt

async def check_master_exact():
    """Check master account exact details"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print("🔍 CHECKING MASTER ACCOUNT EXACT DETAILS")
    print("=" * 50)
    
    # Find all accounts with master in email or is_master_account = true
    master_accounts = await db.users.find({
        "$or": [
            {"email": {"$regex": "master", "$options": "i"}},
            {"is_master_account": True},
            {"user_type": "master"}
        ]
    }).to_list(10)
    
    print(f"📊 MASTER-RELATED ACCOUNTS FOUND: {len(master_accounts)}")
    print("-" * 40)
    
    for account in master_accounts:
        print(f"📧 Email: {account.get('email')}")
        print(f"👤 Name: {account.get('full_name')}")
        print(f"🏷️ Type: {account.get('user_type')}")
        print(f"👑 Is Master: {account.get('is_master_account', False)}")
        print(f"🔐 Has Password: {'password_hash' in account}")
        
        if 'password_hash' in account:
            password_hash = account['password_hash']
            print(f"🔐 Hash: {password_hash[:30]}...")
            
            # Test password verification
            try:
                if bcrypt.verify("master123", password_hash):
                    print("✅ Password 'master123' VERIFIED")
                else:
                    print("❌ Password 'master123' FAILED")
            except Exception as e:
                print(f"❌ Password verification error: {e}")
        
        print("-" * 40)
    
    # Try exact email search
    print("\n🎯 EXACT EMAIL SEARCHES:")
    test_emails = [
        "master@agitocash.com",
        "Master@agitocash.com", 
        "MASTER@AGITOCASH.COM"
    ]
    
    for email in test_emails:
        account = await db.users.find_one({"email": email})
        if account:
            print(f"✅ Found with email: {email}")
        else:
            print(f"❌ Not found with email: {email}")

if __name__ == "__main__":
    asyncio.run(check_master_exact())