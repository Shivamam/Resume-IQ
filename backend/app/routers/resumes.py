import hashlib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..utils.auth import get_current_user
from ..utils.cloudinary import delete_pdf
from app.worker.tasks import process_resume

router = APIRouter(prefix="/resumes", tags=["resumes"])

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_FILES = 10


@router.post("/upload", response_model=List[schemas.ResumeOut], status_code=status.HTTP_202_ACCEPTED)
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files allowed per upload"
        )

    created_resumes = []

    for file in files:
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{file.filename} is not a PDF"
            )

        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{file.filename} exceeds 5MB limit"
            )

        file_hash = hashlib.sha256(file_bytes).hexdigest()

        existing = db.query(models.Resume).filter(
            models.Resume.file_hash == file_hash
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": f"Duplicate resume detected — {file.filename} has already been uploaded",
                    "existing_resume_id": existing.id,
                    "existing_filename": existing.original_filename,
                    "uploaded_at": existing.uploaded_at.isoformat()
                }
            )

        resume = models.Resume(
            user_id=current_user.id,
            original_filename=file.filename,
            status=models.ResumeStatus.queued,
            file_hash=file_hash
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        process_resume.delay(
            resume_id=resume.id,
            user_id=current_user.id,
            file_bytes=list(file_bytes),
            filename=file.filename
        )

        created_resumes.append(resume)

    return created_resumes


@router.get("/", response_model=List[schemas.ResumeOut])
def get_my_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).order_by(models.Resume.uploaded_at.desc()).all()


@router.get("/{resume_id}", response_model=schemas.ResumeOut)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        # models.Resume.user_id == current_user.id   ##Removed user filtering for temp
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.public_id:
        delete_pdf(resume.public_id)

    db.delete(resume)
    db.commit()


@router.get("/{resume_id}/parsed", response_model=schemas.ResumeDataOut)
def get_parsed_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        # models.Resume.user_id == current_user.id     ##Removed user filtering for temp
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.status != models.ResumeStatus.completed:
        raise HTTPException(
            status_code=400,
            detail=f"Resume is not fully processed yet. Current status: {resume.status}"
        )

    parsed = db.query(models.ResumeData).filter(
        models.ResumeData.resume_id == resume_id
    ).first()

    if not parsed:
        raise HTTPException(status_code=404, detail="Parsed data not found")

    return parsed