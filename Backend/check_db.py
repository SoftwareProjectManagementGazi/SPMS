import asyncio
import asyncpg
from app.infrastructure.config import settings
import os

async def check_db():
    print("--- Database Check Script ---")
    print(f"Current Working Directory: {os.getcwd()}")
    
    # Construct DSN
    dsn = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    print(f"Connecting to: {dsn}")
    
    try:
        conn = await asyncpg.connect(dsn)
        print("Successfully connected to database.")
        
        # List tables
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        print(f"Tables found: {[t['table_name'] for t in tables]}")
        
        # Check projects columns
        columns = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='projects'")
        print("\nColumns in 'projects' table:")
        found = False
        for c in columns:
            print(f" - {c['column_name']} ({c['data_type']})")
            if c['column_name'] == 'custom_fields':
                found = True
        
        if not found:
            print("\n'custom_fields' column is MISSING. Attempting to add...")
            try:
                await conn.execute("ALTER TABLE projects ADD COLUMN custom_fields JSON;")
                print("ALTER TABLE executed successfully.")
            except Exception as e:
                print(f"Failed to add column: {e}")
        else:
            print("\n'custom_fields' column EXISTS.")
            
        await conn.close()
        
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
