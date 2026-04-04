from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class ResumeStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_verified: bool

    class Config:
        from_attributes = True 

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResumeOut(BaseModel):
    id: int
    original_filename: str
    file_url: str | None
    extracted_text: str | None
    status: ResumeStatus
    error_message: str | None
    uploaded_at: datetime

from typing import List, Optional


class WorkEntry(BaseModel):
    company: str | None = None
    job_title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class Project(BaseModel):
    name: str | None = None
    description: str | None = None
    technologies: List[str] = []
    project_type: str | None = None  # "professional" or "personal/academic"


class Skills(BaseModel):
    programming_languages: List[str] = []
    frameworks_and_libraries: List[str] = []
    databases: List[str] = []
    cloud_platforms: List[str] = []
    tools: List[str] = []
    languages_spoken: List[str] = []


class ParsedResume(BaseModel):
    # Personal
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    age: int | None = None
    gender: str | None = None
    city: str | None = None
    state: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None

    # Education
    highest_degree: str | None = None
    field_of_study: str | None = None
    university: str | None = None
    graduation_year: int | None = None
    gpa: str | None = None
    tenth_percentage: str | None = None
    tenth_board: str | None = None
    twelfth_percentage: str | None = None
    twelfth_board: str | None = None
    education_detail: List[dict] = []

    # Work
    total_experience_years: str | None = None
    current_job_title: str | None = None
    current_company: str | None = None
    employment_gap_flag: bool = False
    work_history: List[WorkEntry] = []

    # Skills
    skills: Skills = Skills()

    # Projects
    projects: List[Project] = []

    # Other
    notice_period: str | None = None
    expected_salary: str | None = None


class ResumeDataOut(BaseModel):
    id: int
    resume_id: int
    full_name: str | None
    email: str | None
    phone: str | None
    age: int | None
    gender: str | None
    city: str | None
    state: str | None
    linkedin_url: str | None
    github_url: str | None
    portfolio_url: str | None
    highest_degree: str | None
    field_of_study: str | None
    university: str | None
    graduation_year: int | None
    gpa: str | None
    tenth_percentage: str | None
    tenth_board: str | None
    twelfth_percentage: str | None
    twelfth_board: str | None
    total_experience_years: str | None
    current_job_title: str | None
    current_company: str | None
    employment_gap_flag: bool
    notice_period: str | None
    expected_salary: str | None
    work_history: str | None
    skills: str | None
    projects: str | None
    education_detail: str | None
    parsed_at: datetime

class CandidateOut(BaseModel):
    resume_id: int
    original_filename: str
    file_url: str | None
    uploaded_at: datetime
    status: ResumeStatus
    full_name: str | None
    email: str | None
    phone: str | None
    city: str | None
    state: str | None
    highest_degree: str | None
    university: str | None
    gpa: str | None
    total_experience_years: str | None
    current_job_title: str | None
    current_company: str | None
    employment_gap_flag: bool | None
    skills: str | None
    match_score: int | None = None
    matched_skills: str | None = None
    missing_skills: str | None = None
    match_summary: str | None = None

class PaginatedCandidates(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    results: List[CandidateOut]

class RefreshRequest(BaseModel):
    refresh_token: str
    class Config:
        from_attributes = True