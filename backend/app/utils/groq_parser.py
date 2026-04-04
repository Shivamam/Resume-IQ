import os
import json
from groq import Groq
from dotenv import load_dotenv
from app.schemas import ParsedResume

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """
You are a professional resume parser. Your job is to extract structured information from resume text.

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code blocks
- If a field is not present in the resume, set it to null
- Do NOT guess or infer missing information
- For arrays, return empty array [] if nothing found
- For employment_gap_flag, set to true only if there is a gap of 6 or more months between any two jobs
- For project_type, use exactly "professional" or "personal/academic"
- Dates should be in "Month Year" format e.g. "Jan 2022" or "2022" if only year is available
- For total_experience_years, return a string like "3 years" or "6 months" or "3 years 6 months"
"""

USER_PROMPT_TEMPLATE = """
Extract all available information from the following resume text and return a JSON object with exactly this structure:

{{
  "full_name": null,
  "email": null,
  "phone": null,
  "age": null,
  "gender": null,
  "city": null,
  "state": null,
  "linkedin_url": null,
  "github_url": null,
  "portfolio_url": null,
  "highest_degree": null,
  "field_of_study": null,
  "university": null,
  "graduation_year": null,
  "gpa": null,
  "tenth_percentage": null,
  "tenth_board": null,
  "twelfth_percentage": null,
  "twelfth_board": null,
  "education_detail": [],
  "total_experience_years": null,
  "current_job_title": null,
  "current_company": null,
  "employment_gap_flag": false,
  "work_history": [
    {{
      "company": null,
      "job_title": null,
      "start_date": null,
      "end_date": null,
      "description": null
    }}
  ],
  "skills": {{
    "programming_languages": [],
    "frameworks_and_libraries": [],
    "databases": [],
    "cloud_platforms": [],
    "tools": [],
    "languages_spoken": []
  }},
  "projects": [
    {{
      "name": null,
      "description": null,
      "technologies": [],
      "project_type": null
    }}
  ],
  "notice_period": null,
  "expected_salary": null
}}

Resume text:
{resume_text}
"""


def parse_resume(extracted_text: str) -> ParsedResume:
    truncated_text = extracted_text[:12000]

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
                resume_text=truncated_text
            )}
        ],
        temperature=0,
        max_tokens=4096,
        response_format={"type": "json_object"}
    )

    raw = response.choices[0].message.content

    try:
        data = json.loads(raw)
        return ParsedResume(**data)
    except Exception as e:
        raise ValueError(f"Failed to parse Groq response: {str(e)}\nRaw: {raw[:500]}")