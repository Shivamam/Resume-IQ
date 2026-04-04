from app.worker.celery_app import celery_app
from app.database import SessionLocal
from app import models
from app.utils.cloudinary import upload_pdf
from app.utils.pdf import extract_text
from app.utils.redis_ws import publish_status
from app.utils.groq_parser import parse_resume
from app.utils.groq_scorer import score_candidate
import redis as redis_lib
import json
import os

@celery_app.task(bind=True, max_retries=3)
def process_resume(self, resume_id: int, user_id: int, file_bytes: list, filename: str):
    db = SessionLocal()
    try:
        resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
        if not resume:
            return

        resume.status = models.ResumeStatus.processing
        db.commit()
        publish_status(user_id, resume_id, "processing")

        file_bytes_actual = bytes(file_bytes)
        upload_result = upload_pdf(file_bytes_actual, f"{user_id}_{resume_id}_{filename}")
        resume.file_url = upload_result["url"]
        resume.public_id = upload_result["public_id"]
        db.commit()

        text = extract_text(file_bytes_actual)
        resume.extracted_text = text
        db.commit()

        publish_status(user_id, resume_id, "parsing")
        parsed = parse_resume(text)

        resume_data = models.ResumeData(
            resume_id=resume_id,
            full_name=parsed.full_name,
            email=parsed.email,
            phone=parsed.phone,
            age=parsed.age,
            gender=parsed.gender,
            city=parsed.city,
            state=parsed.state,
            linkedin_url=parsed.linkedin_url,
            github_url=parsed.github_url,
            portfolio_url=parsed.portfolio_url,
            highest_degree=parsed.highest_degree,
            field_of_study=parsed.field_of_study,
            university=parsed.university,
            graduation_year=parsed.graduation_year,
            gpa=parsed.gpa,
            tenth_percentage=parsed.tenth_percentage,
            tenth_board=parsed.tenth_board,
            twelfth_percentage=parsed.twelfth_percentage,
            twelfth_board=parsed.twelfth_board,
            total_experience_years=parsed.total_experience_years,
            current_job_title=parsed.current_job_title,
            current_company=parsed.current_company,
            employment_gap_flag=parsed.employment_gap_flag,
            notice_period=parsed.notice_period,
            expected_salary=parsed.expected_salary,
            work_history=json.dumps([e.model_dump() for e in parsed.work_history]),
            skills=json.dumps(parsed.skills.model_dump()),
            projects=json.dumps([p.model_dump() for p in parsed.projects]),
            education_detail=json.dumps(parsed.education_detail),
        )
        db.add(resume_data)

        resume.status = models.ResumeStatus.completed
        db.commit()

        publish_status(user_id, resume_id, "completed", {
            "file_url": upload_result["url"]
        })

    except Exception as exc:
        try:
            resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
            if resume:
                resume.status = models.ResumeStatus.failed
                resume.error_message = str(exc)[:500]
                db.commit()
            publish_status(user_id, resume_id, "failed", {"error": str(exc)})
        except Exception:
            pass

        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    finally:
        db.close()

score_redis = redis_lib.from_url(os.getenv("REDIS_URL"))

@celery_app.task(bind=True)
def score_candidates_task(self, session_id: str, jd_text: str):
    db = SessionLocal()
    try:
        candidates = db.query(models.ResumeData).join(
            models.Resume,
            models.Resume.id == models.ResumeData.resume_id
        ).filter(
            models.Resume.status == models.ResumeStatus.completed
        ).all()

        total = len(candidates)
        scored = 0

        for candidate in candidates:
            try:
                candidate_dict = {
                    "skills": candidate.skills,
                    "work_history": candidate.work_history,
                    "total_experience_years": candidate.total_experience_years,
                    "current_job_title": candidate.current_job_title,
                    "highest_degree": candidate.highest_degree,
                    "field_of_study": candidate.field_of_study,
                    "university": candidate.university,
                }

                result = score_candidate(jd_text, candidate_dict)

                # Save score to Redis under session
                score_redis.hset(
                    f"jd_session:{session_id}:scores",
                    candidate.resume_id,
                    json.dumps(result)
                )

                scored += 1

                # Publish progress via WebSocket
                progress = int((scored / total) * 100)
                score_redis.publish(
                    f"jd_session:{session_id}:progress",
                    json.dumps({
                        "scored": scored,
                        "total": total,
                        "progress": progress,
                        "resume_id": candidate.resume_id,
                        "score": result.get("total_score")
                    })
                )

            except Exception:
                # Skip candidate if scoring fails — don't fail entire batch
                continue

        # Mark session as complete with 2hr TTL
        score_redis.expire(f"jd_session:{session_id}:scores", 7200)
        score_redis.set(f"jd_session:{session_id}:status", "completed", ex=7200)

        # Publish completion
        score_redis.publish(
            f"jd_session:{session_id}:progress",
            json.dumps({"status": "completed", "total": total, "scored": scored})
        )

    finally:
        db.close()