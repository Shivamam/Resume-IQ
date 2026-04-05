from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, cast, Float, func
from typing import Optional
from datetime import date
import redis as redis_lib
import json as json_lib
import os

from .. import models, schemas
from ..database import get_db
from ..utils.auth import get_current_user

router = APIRouter(prefix="/candidates", tags=["candidates"])
score_redis = redis_lib.from_url(os.getenv("REDIS_URL"))

VALID_SORT_FIELDS = {
    "name":         models.ResumeData.full_name,
    "email":        models.ResumeData.email,
    "location":     models.ResumeData.city,
    "experience":   models.ResumeData.total_experience_years,
    "last_role":    models.ResumeData.current_job_title,
    "last_company": models.ResumeData.current_company,
    "education":    models.ResumeData.highest_degree,
    "college":      models.ResumeData.university,
    "uploaded_at":  models.Resume.uploaded_at,
    "status":       models.Resume.status,
}


@router.get("/", response_model=schemas.PaginatedCandidates)
def get_candidates(
    # Pagination
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),

    # Filters
    min_experience: Optional[float] = Query(default=None),
    max_experience: Optional[float] = Query(default=None),
    skills: Optional[str] = Query(default=None, description="Comma separated e.g. Python,React"),
    education: Optional[str] = Query(default=None, description="e.g. Bachelor's, Master's, PhD"),
    location: Optional[str] = Query(default=None, description="City or state"),
    college: Optional[str] = Query(default=None, description="Partial college name search"),
    min_gpa: Optional[float] = Query(default=None),
    max_gpa: Optional[float] = Query(default=None),
    employment_gap: Optional[bool] = Query(default=None, description="true = only gaps, false = no gaps"),
    uploaded_from: Optional[date] = Query(default=None),
    uploaded_to: Optional[date] = Query(default=None),

    # Sorting
    sort_by: Optional[str] = Query(default="uploaded_at"),
    sort_order: Optional[str] = Query(default="desc", pattern="^(asc|desc)$"),

    # JD matching params
    session_id: Optional[str] = Query(default=None),
    min_score: Optional[int] = Query(default=60, ge=0, le=100),

    # CSV export — filter by specific IDs across pages
    resume_ids: Optional[str] = Query(default=None, description="Comma separated resume IDs"),

    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Base query — join Resume + ResumeData, only completed resumes
    query = db.query(models.Resume, models.ResumeData).join(
        models.ResumeData,
        models.Resume.id == models.ResumeData.resume_id
    ).filter(
        models.Resume.status == models.ResumeStatus.completed
    )

    # ---------------------------------------------------------------
    # CROSS-USER ACCESS — uncomment this block when multi-user is ready
    # This restricts candidates to the logged-in user's uploads only.
    # Remove this filter to show ALL candidates across all users.
    #
    # query = query.filter(models.Resume.user_id == current_user.id)
    # ---------------------------------------------------------------

    # --- Filters ---

    # Years of experience
    if min_experience is not None or max_experience is not None:
        experience_numeric = cast(
            func.regexp_substr(models.ResumeData.total_experience_years, r'\d+'),
            Float
        )
        if min_experience is not None:
            query = query.filter(experience_numeric >= min_experience)
        if max_experience is not None:
            query = query.filter(experience_numeric <= max_experience)

    # Skills — check if any of the requested skills appear in the JSON string
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        skill_filters = [
            models.ResumeData.skills.ilike(f"%{skill}%")
            for skill in skill_list
        ]
        query = query.filter(and_(*skill_filters))

    # Education level
    if education:
        query = query.filter(
            models.ResumeData.highest_degree.ilike(f"%{education}%")
        )

    # Location — city or state
    if location:
        query = query.filter(
            or_(
                models.ResumeData.city.ilike(f"%{location}%"),
                models.ResumeData.state.ilike(f"%{location}%")
            )
        )

    # College name — partial text search
    if college:
        query = query.filter(
            models.ResumeData.university.ilike(f"%{college}%")
        )

    # GPA range
    if min_gpa is not None:
        query = query.filter(
            cast(models.ResumeData.gpa, Float) >= min_gpa
        )
    if max_gpa is not None:
        query = query.filter(
            cast(models.ResumeData.gpa, Float) <= max_gpa
        )

    # Employment gap toggle
    if employment_gap is not None:
        query = query.filter(
            models.ResumeData.employment_gap_flag == employment_gap
        )

    # Upload date range
    if uploaded_from:
        query = query.filter(models.Resume.uploaded_at >= uploaded_from)
    if uploaded_to:
        query = query.filter(models.Resume.uploaded_at <= uploaded_to)

    # --- Sorting ---
    # For non-score fields, sort at DB level
    if sort_by != "match_score":
        sort_column = VALID_SORT_FIELDS.get(sort_by, models.Resume.uploaded_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    # --- Pagination ---
    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    # For match_score sort we need all results to sort in memory
    # For other sorts we can paginate at DB level
    if sort_by == "match_score" and session_id:
        results = query.all()
    else:
        results = query.offset((page - 1) * page_size).limit(page_size).all()
    # Fetch scores from Redis if session provided
    scores = {}
    if session_id:
        scores_raw = score_redis.hgetall(f"jd_session:{session_id}:scores")
        scores = {
            int(k): json_lib.loads(v)
            for k, v in scores_raw.items()
        }

    # Build response
    candidates = []
    for resume, resume_data in results:
        score_data = scores.get(resume.id)

        if session_id and score_data:
            if score_data.get("total_score", 0) < min_score:
                continue
        elif session_id and not score_data:
            continue

        candidate = schemas.CandidateOut(
            resume_id=resume.id,
            original_filename=resume.original_filename,
            file_url=resume.file_url,
            uploaded_at=resume.uploaded_at,
            status=resume.status,
            full_name=resume_data.full_name,
            email=resume_data.email,
            phone=resume_data.phone,
            city=resume_data.city,
            state=resume_data.state,
            highest_degree=resume_data.highest_degree,
            university=resume_data.university,
            gpa=resume_data.gpa,
            total_experience_years=resume_data.total_experience_years,
            current_job_title=resume_data.current_job_title,
            current_company=resume_data.current_company,
            employment_gap_flag=resume_data.employment_gap_flag,
            skills=resume_data.skills,
            match_score=score_data.get("total_score") if score_data else None,
            matched_skills=json_lib.dumps(score_data.get("matched_skills", [])) if score_data else None,
            missing_skills=json_lib.dumps(score_data.get("missing_skills", [])) if score_data else None,
            match_summary=score_data.get("summary") if score_data else None,
        )
        candidates.append(candidate)

    # Sort by match score in memory since scores are in Redis not MySQL
    if sort_by == "match_score" and session_id:
        candidates.sort(
            key=lambda x: x.match_score or 0,
            reverse=(sort_order == "desc")
        )
        # Apply pagination manually after sort
        total = len(candidates)
        total_pages = (total + page_size - 1) // page_size
        start = (page - 1) * page_size
        candidates = candidates[start: start + page_size]

    return schemas.PaginatedCandidates(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        results=candidates
    )