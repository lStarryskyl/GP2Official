import asyncio
import sys
import uuid
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.debate_service import DebateService
from models.debate import DebateRequest

async def main():
    client = pymongo.MongoClient('mongodb://localhost:27017/')
    db = client['acorn']
    proj_id = str(uuid.uuid4())
    db.projects.insert_one({"_id": proj_id, "name": "Direct Service Test", "description": "Trigger db bug"})
    db.requirements.insert_one({"project_id": proj_id, "title": "Req 1", "description": "Desc", "type": "functional"})
    db.tasks.insert_one({"project_id": proj_id, "title": "Task 1", "description": "Desc"})
    
    motor_client = AsyncIOMotorClient('mongodb://localhost:27017/')
    service = DebateService(db=lambda: motor_client.acorn)
    
    request = DebateRequest(
        topic="Direct Logic Test",
        participating_roles=["architect", "security_auditor", "devex_advocate", "product_strategist"],
        max_rounds=1
    )
    
    try:
        print(f"Starting debate for {proj_id}...")
        sys.stdout.flush()
        session = await service.start_debate(proj_id, "test_user_1", request)
        print("Debate completed successfully:", session.status)
        sys.stdout.flush()
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
