from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from .schemas import ResumeStatus

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    resumes = relationship("Resume", back_populates="owner")

class Resume(Base):
    __tablename__ = "resumes"

    # id = Column(Integer, primary_key=True, index=True)
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # file_url = Column(String(500), nullable=False)   # Cloudinary URL
    # public_id = Column(String(255), nullable=False)  # Cloudinary public_id (needed for deletion)
    # extracted_text = Column(Text, nullable=True)     # raw text from pdfplumber
    # uploaded_at = Column(DateTime, default=datetime.utcnow)
    # owner = relationship("User", back_populates="resumes")
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=True)
    public_id = Column(String(255), nullable=True)
    extracted_text = Column(Text, nullable=True)
    status = Column(Enum(ResumeStatus), default=ResumeStatus.queued, nullable=False)
    error_message = Column(String(500), nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="resumes")

class ResumeData(Base):
    __tablename__ = "resume_data"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)

    # Personal info
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)

    # Education
    highest_degree = Column(String(100), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    gpa = Column(String(20), nullable=True)
    tenth_percentage = Column(String(20), nullable=True)
    tenth_board = Column(String(100), nullable=True)
    twelfth_percentage = Column(String(20), nullable=True)
    twelfth_board = Column(String(100), nullable=True)

    # Work experience
    total_experience_years = Column(String(50), nullable=True)
    current_job_title = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    employment_gap_flag = Column(Boolean, default=False)

    # Other
    notice_period = Column(String(100), nullable=True)
    expected_salary = Column(String(100), nullable=True)

    # JSON fields for nested/array data
    work_history = Column(Text, nullable=True)       # array
    skills = Column(Text, nullable=True)             # object
    projects = Column(Text, nullable=True)           # array
    education_detail = Column(Text, nullable=True)   # array 

    parsed_at = Column(DateTime, default=datetime.utcnow)
    resume = relationship("Resume", backref="parsed_data")