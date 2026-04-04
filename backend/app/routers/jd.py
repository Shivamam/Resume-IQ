from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
from sqlalchemy.orm import Session
import uuid
import redis
import os
import json

from ..database import get_db
from ..utils.auth import get_current_user
from ..utils import jd_extractor
from ..models import User
from app.worker.tasks import score_candidates_task

router = APIRouter(prefix="/jd", tags=["job description"])

r = redis.from_url(os.getenv("REDIS_URL"))


@router.post("/match", status_code=status.HTTP_202_ACCEPTED)
async def match_jd(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not text and not file:
        raise HTTPException(
            status_code=400,
            detail="Provide either a JD text or a file (PDF or DOCX)"
        )

    if file:
        file_bytes = await file.read()
        try:
            jd_text = jd_extractor.extract_jd_text(file_bytes, file.content_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        jd_text = text.strip()

    if not jd_text:
        raise HTTPException(status_code=400, detail="JD text is empty")

    session_id = uuid.uuid4().hex

    r.set(f"jd_session:{session_id}:text", jd_text, ex=7200)
    r.set(f"jd_session:{session_id}:status", "scoring", ex=7200)

    score_candidates_task.delay(session_id=session_id, jd_text=jd_text)

    return {
        "session_id": session_id,
        "message": "Scoring started. Connect to WebSocket for progress updates."
    }


@router.get("/session/{session_id}/status")
def get_session_status(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    status_val = r.get(f"jd_session:{session_id}:status")
    if not status_val:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    scores_raw = r.hgetall(f"jd_session:{session_id}:scores")
    scores = {
        int(k): json.loads(v)
        for k, v in scores_raw.items()
    }

    return {
        "session_id": session_id,
        "status": status_val.decode(),
        "scored_count": len(scores)
    }