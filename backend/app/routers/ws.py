import os
import json
import asyncio
import redis as redis_lib
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..utils.auth import decode_token
from ..utils.redis_ws import ws_redis

router = APIRouter() 
jd_redis = redis_lib.from_url(os.getenv("REDIS_URL"))

async def get_user_id_from_token(token: str) -> int:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    return int(payload["sub"])


@router.websocket("/ws/resumes")
async def resume_status_ws(
    websocket: WebSocket,
    token: str = Query(...)
):
    user_id = await get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    pubsub = jd_redis.pubsub()
    pubsub.subscribe(f"user:{user_id}:resumes")

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message and message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        pubsub.unsubscribe(f"user:{user_id}:resumes")
        pubsub.close()

@router.websocket("/ws/jd/{session_id}")
async def jd_scoring_ws(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...)
):
    user_id = await get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    status_val = jd_redis.get(f"jd_session:{session_id}:status")

    if not status_val:
        await websocket.send_json({"status": "not_found"})
        await websocket.close()
        return

    if status_val.decode() == "completed":
        scores_raw = jd_redis.hgetall(f"jd_session:{session_id}:scores")
        scores = {
            int(k): json.loads(v)
            for k, v in scores_raw.items()
        }
        await websocket.send_json({
            "status": "completed",
            "total": len(scores),
            "scored": len(scores),
            "scores": {
                str(k): v.get("total_score")
                for k, v in scores.items()
            }
        })
        await websocket.close()
        return

    pubsub = jd_redis.pubsub()
    pubsub.subscribe(f"jd_session:{session_id}:progress")

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message and message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
                if data.get("status") == "completed":
                    break
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        pass
    finally:
        pubsub.unsubscribe(f"jd_session:{session_id}:progress")
        pubsub.close()