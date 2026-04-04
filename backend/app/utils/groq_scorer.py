import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SCORING_SYSTEM_PROMPT = """
You are an expert technical recruiter. Your job is to score how well a candidate matches a job description.

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code blocks
- Score each category from 0 to 100
- Be strict but fair — a perfect score means an exact match
- Base your scoring ONLY on the structured data provided, not assumptions
- Scoring weights: skills 50%, experience 30%, education 20%
"""

SCORING_USER_PROMPT = """
Score this candidate against the job description.

Job Description:
{jd_text}

Candidate Profile:
- Skills: {skills}
- Total Experience: {experience}
- Current Title: {current_title}
- Education: {education} in {field_of_study} from {university}
- Work History: {work_history}

Return a JSON object with exactly this structure:
{{
  "skills_score": 0,
  "experience_score": 0,
  "education_score": 0,
  "total_score": 0,
  "matched_skills": [],
  "missing_skills": [],
  "summary": "one sentence explanation of the score"
}}

total_score must equal: (skills_score * 0.5) + (experience_score * 0.3) + (education_score * 0.2)
Round total_score to nearest integer.
"""


def score_candidate(jd_text: str, candidate: dict) -> dict:
    skills_data = json.loads(candidate.get("skills") or "{}")
    all_skills = (
        skills_data.get("programming_languages", []) +
        skills_data.get("frameworks_and_libraries", []) +
        skills_data.get("databases", []) +
        skills_data.get("cloud_platforms", []) +
        skills_data.get("tools", [])
    )

    work_history_data = json.loads(candidate.get("work_history") or "[]")
    work_summary = ", ".join([
        f"{w.get('job_title')} at {w.get('company')}"
        for w in work_history_data[:3] 
        if w.get("job_title")
    ])

    prompt = SCORING_USER_PROMPT.format(
        jd_text=jd_text[:3000], 
        skills=", ".join(all_skills) if all_skills else "Not specified",
        experience=candidate.get("total_experience_years") or "Not specified",
        current_title=candidate.get("current_job_title") or "Not specified",
        education=candidate.get("highest_degree") or "Not specified",
        field_of_study=candidate.get("field_of_study") or "Not specified",
        university=candidate.get("university") or "Not specified",
        work_history=work_summary or "Not specified"
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SCORING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=1024,
        response_format={"type": "json_object"}
    )

    raw = response.choices[0].message.content
    return json.loads(raw)