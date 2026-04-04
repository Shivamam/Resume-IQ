import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

ws_redis = redis.from_url(os.getenv("WS_REDIS_URL"))


def publish_status(user_id: int, resume_id: int, status: str, extra: dict = {}):
    message = json.dumps({
        "resume_id": resume_id,
        "status": status,
        **extra
    })
    ws_redis.publish(f"user:{user_id}:resumes", message)