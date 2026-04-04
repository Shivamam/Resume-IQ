"""
Run this once to seed 15 pre-parsed candidate records.
Called automatically by docker-compose via entrypoint.
"""
import sys
import os
import json
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, Resume, ResumeData, ResumeStatus
from app.utils.auth import hash_password

SEED_USER_EMAIL = "admin@resumeiq.com"
SEED_USER_PASSWORD = "Admin@1234"

CANDIDATES = [
    {
        "filename": "arjun_sharma_resume.pdf",
        "full_name": "Arjun Sharma", "email": "arjun.sharma@email.com", "phone": "+91 9876543210",
        "city": "Mumbai", "state": "Maharashtra", "highest_degree": "Bachelor's",
        "field_of_study": "Computer Science", "university": "IIT Bombay", "graduation_year": 2019,
        "gpa": "8.7", "total_experience_years": "5 years", "current_job_title": "Senior Software Engineer",
        "current_company": "Infosys", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "Java", "Go"], "frameworks_and_libraries": ["FastAPI", "Spring Boot", "React"], "databases": ["MySQL", "PostgreSQL", "Redis"], "cloud_platforms": ["AWS", "GCP"], "tools": ["Docker", "Kubernetes", "Git"]},
        "work_history": [{"company": "Infosys", "job_title": "Senior Software Engineer", "start_date": "Jan 2022", "end_date": "Present", "description": "Led backend development for microservices platform"}, {"company": "TCS", "job_title": "Software Engineer", "start_date": "Jul 2019", "end_date": "Dec 2021", "description": "Developed REST APIs for banking application"}],
        "projects": [{"name": "Microservices Platform", "description": "Built scalable microservices", "technologies": ["Go", "Docker", "Kubernetes"], "project_type": "professional"}],
    },
    {
        "filename": "priya_patel_resume.pdf",
        "full_name": "Priya Patel", "email": "priya.patel@email.com", "phone": "+91 9123456789",
        "city": "Bangalore", "state": "Karnataka", "highest_degree": "Master's",
        "field_of_study": "Data Science", "university": "IISc Bangalore", "graduation_year": 2020,
        "gpa": "9.1", "total_experience_years": "4 years", "current_job_title": "Data Scientist",
        "current_company": "Flipkart", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "R", "SQL"], "frameworks_and_libraries": ["TensorFlow", "PyTorch", "Pandas", "Scikit-learn"], "databases": ["MySQL", "MongoDB"], "cloud_platforms": ["AWS", "Azure"], "tools": ["Jupyter", "Docker", "Git"]},
        "work_history": [{"company": "Flipkart", "job_title": "Data Scientist", "start_date": "Mar 2021", "end_date": "Present", "description": "Built recommendation engine serving 10M users"}, {"company": "Wipro", "job_title": "ML Engineer", "start_date": "Jun 2020", "end_date": "Feb 2021", "description": "Developed NLP models for document classification"}],
        "projects": [{"name": "Recommendation Engine", "description": "Collaborative filtering based product recommendations", "technologies": ["Python", "TensorFlow", "Redis"], "project_type": "professional"}],
    },
    {
        "filename": "rahul_verma_resume.pdf",
        "full_name": "Rahul Verma", "email": "rahul.verma@email.com", "phone": "+91 9988776655",
        "city": "Delhi", "state": "Delhi", "highest_degree": "Bachelor's",
        "field_of_study": "Information Technology", "university": "Delhi University", "graduation_year": 2018,
        "gpa": "7.8", "total_experience_years": "6 years", "current_job_title": "Full Stack Developer",
        "current_company": "Zomato", "employment_gap_flag": True,
        "skills": {"programming_languages": ["JavaScript", "TypeScript", "Python"], "frameworks_and_libraries": ["React", "Node.js", "Express", "FastAPI"], "databases": ["PostgreSQL", "MongoDB", "Redis"], "cloud_platforms": ["AWS"], "tools": ["Docker", "Git", "Jira"]},
        "work_history": [{"company": "Zomato", "job_title": "Full Stack Developer", "start_date": "Jan 2022", "end_date": "Present", "description": "Built customer-facing web application"}, {"company": "Freelance", "job_title": "Web Developer", "start_date": "Jul 2021", "end_date": "Dec 2021", "description": "Built web apps for small businesses"}, {"company": "OYO", "job_title": "Frontend Developer", "start_date": "Jun 2018", "end_date": "Dec 2020", "description": "Developed React components for hotel booking platform"}],
        "projects": [{"name": "Food Delivery App", "description": "Real-time order tracking system", "technologies": ["React", "Node.js", "WebSocket"], "project_type": "professional"}],
    },
    {
        "filename": "sneha_reddy_resume.pdf",
        "full_name": "Sneha Reddy", "email": "sneha.reddy@email.com", "phone": "+91 8765432109",
        "city": "Hyderabad", "state": "Telangana", "highest_degree": "Bachelor's",
        "field_of_study": "Electronics and Communication", "university": "JNTU Hyderabad", "graduation_year": 2021,
        "gpa": "8.2", "total_experience_years": "3 years", "current_job_title": "Backend Developer",
        "current_company": "PayU", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Java", "Python", "Kotlin"], "frameworks_and_libraries": ["Spring Boot", "Django", "Hibernate"], "databases": ["MySQL", "Cassandra"], "cloud_platforms": ["AWS", "GCP"], "tools": ["Docker", "Jenkins", "Git"]},
        "work_history": [{"company": "PayU", "job_title": "Backend Developer", "start_date": "Aug 2022", "end_date": "Present", "description": "Built payment processing microservices handling 1M txns/day"}, {"company": "Mindtree", "job_title": "Associate Developer", "start_date": "Jul 2021", "end_date": "Jul 2022", "description": "Developed backend services for e-commerce platform"}],
        "projects": [{"name": "Payment Gateway", "description": "High-throughput payment processing system", "technologies": ["Java", "Spring Boot", "Kafka"], "project_type": "professional"}],
    },
    {
        "filename": "amit_kumar_resume.pdf",
        "full_name": "Amit Kumar", "email": "amit.kumar@email.com", "phone": "+91 7654321098",
        "city": "Pune", "state": "Maharashtra", "highest_degree": "Bachelor's",
        "field_of_study": "Computer Engineering", "university": "COEP Pune", "graduation_year": 2020,
        "gpa": "7.5", "total_experience_years": "4 years", "current_job_title": "DevOps Engineer",
        "current_company": "Persistent Systems", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "Bash", "Go"], "frameworks_and_libraries": ["FastAPI", "Flask"], "databases": ["PostgreSQL", "Redis"], "cloud_platforms": ["AWS", "Azure", "GCP"], "tools": ["Docker", "Kubernetes", "Terraform", "Jenkins", "Git"]},
        "work_history": [{"company": "Persistent Systems", "job_title": "DevOps Engineer", "start_date": "Feb 2022", "end_date": "Present", "description": "Managed CI/CD pipelines and cloud infrastructure"}, {"company": "Tech Mahindra", "job_title": "Junior DevOps", "start_date": "Aug 2020", "end_date": "Jan 2022", "description": "Automated deployments using Jenkins and Docker"}],
        "projects": [{"name": "CI/CD Pipeline", "description": "Automated deployment pipeline for microservices", "technologies": ["Jenkins", "Docker", "Kubernetes", "Terraform"], "project_type": "professional"}],
    },
    {
        "filename": "kavya_nair_resume.pdf",
        "full_name": "Kavya Nair", "email": "kavya.nair@email.com", "phone": "+91 6543210987",
        "city": "Kochi", "state": "Kerala", "highest_degree": "Master's",
        "field_of_study": "Software Engineering", "university": "NIT Calicut", "graduation_year": 2019,
        "gpa": "8.9", "total_experience_years": "5 years", "current_job_title": "Product Engineer",
        "current_company": "Razorpay", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "JavaScript", "Ruby"], "frameworks_and_libraries": ["Django", "React", "Rails"], "databases": ["PostgreSQL", "Redis", "Elasticsearch"], "cloud_platforms": ["AWS"], "tools": ["Docker", "Git", "Datadog"]},
        "work_history": [{"company": "Razorpay", "job_title": "Product Engineer", "start_date": "Apr 2021", "end_date": "Present", "description": "Built payment infrastructure features"}, {"company": "Freshworks", "job_title": "Software Engineer", "start_date": "Jul 2019", "end_date": "Mar 2021", "description": "Developed CRM product features"}],
        "projects": [{"name": "Payment Dashboard", "description": "Analytics dashboard for merchants", "technologies": ["React", "Django", "PostgreSQL"], "project_type": "professional"}],
    },
    {
        "filename": "vikram_singh_resume.pdf",
        "full_name": "Vikram Singh", "email": "vikram.singh@email.com", "phone": "+91 5432109876",
        "city": "Chennai", "state": "Tamil Nadu", "highest_degree": "Bachelor's",
        "field_of_study": "Computer Science", "university": "Anna University", "graduation_year": 2017,
        "gpa": "7.2", "total_experience_years": "7 years", "current_job_title": "Engineering Manager",
        "current_company": "Swiggy", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Java", "Python", "Scala"], "frameworks_and_libraries": ["Spring Boot", "Spark", "Kafka"], "databases": ["MySQL", "Cassandra", "MongoDB"], "cloud_platforms": ["AWS", "GCP"], "tools": ["Docker", "Kubernetes", "Git", "Jira"]},
        "work_history": [{"company": "Swiggy", "job_title": "Engineering Manager", "start_date": "Jan 2022", "end_date": "Present", "description": "Leading team of 8 engineers for logistics platform"}, {"company": "Amazon", "job_title": "SDE-II", "start_date": "Jun 2019", "end_date": "Dec 2021", "description": "Built distributed systems for order management"}, {"company": "Cognizant", "job_title": "Programmer Analyst", "start_date": "Jul 2017", "end_date": "May 2019", "description": "Developed Java applications for banking client"}],
        "projects": [{"name": "Logistics Platform", "description": "Real-time delivery tracking and routing", "technologies": ["Java", "Kafka", "Redis"], "project_type": "professional"}],
    },
    {
        "filename": "pooja_mehta_resume.pdf",
        "full_name": "Pooja Mehta", "email": "pooja.mehta@email.com", "phone": "+91 4321098765",
        "city": "Ahmedabad", "state": "Gujarat", "highest_degree": "Bachelor's",
        "field_of_study": "Information Science", "university": "Gujarat University", "graduation_year": 2022,
        "gpa": "8.4", "total_experience_years": "2 years", "current_job_title": "Frontend Developer",
        "current_company": "Jio Platforms", "employment_gap_flag": False,
        "skills": {"programming_languages": ["JavaScript", "TypeScript", "HTML", "CSS"], "frameworks_and_libraries": ["React", "Next.js", "Vue.js", "Tailwind CSS"], "databases": ["MongoDB", "Firebase"], "cloud_platforms": ["Firebase", "AWS"], "tools": ["Git", "Figma", "Jest"]},
        "work_history": [{"company": "Jio Platforms", "job_title": "Frontend Developer", "start_date": "Aug 2022", "end_date": "Present", "description": "Built responsive web applications for JioMart"}, {"company": "Internship at Tata Digital", "job_title": "Frontend Intern", "start_date": "Jan 2022", "end_date": "Jun 2022", "description": "Developed UI components using React"}],
        "projects": [{"name": "E-commerce UI", "description": "Responsive shopping interface with cart and checkout", "technologies": ["React", "Next.js", "Tailwind CSS"], "project_type": "professional"}],
    },
    {
        "filename": "karan_joshi_resume.pdf",
        "full_name": "Karan Joshi", "email": "karan.joshi@email.com", "phone": "+91 3210987654",
        "city": "Jaipur", "state": "Rajasthan", "highest_degree": "Bachelor's",
        "field_of_study": "Mechanical Engineering", "university": "Rajasthan Technical University", "graduation_year": 2019,
        "gpa": "6.8", "total_experience_years": "5 years", "current_job_title": "Business Analyst",
        "current_company": "Deloitte", "employment_gap_flag": True,
        "skills": {"programming_languages": ["Python", "SQL"], "frameworks_and_libraries": ["Pandas", "Matplotlib"], "databases": ["MySQL", "Oracle"], "cloud_platforms": [], "tools": ["Excel", "Power BI", "Jira", "Tableau"]},
        "work_history": [{"company": "Deloitte", "job_title": "Business Analyst", "start_date": "Mar 2022", "end_date": "Present", "description": "Analyzed business processes and created data reports"}, {"company": "Career break", "job_title": None, "start_date": "Jul 2021", "end_date": "Feb 2022", "description": "Personal reasons"}, {"company": "Accenture", "job_title": "Analyst", "start_date": "Aug 2019", "end_date": "Jun 2021", "description": "Delivered IT consulting projects"}],
        "projects": [{"name": "Sales Dashboard", "description": "Power BI dashboard for sales analytics", "technologies": ["Power BI", "SQL", "Python"], "project_type": "professional"}],
    },
    {
        "filename": "ananya_iyer_resume.pdf",
        "full_name": "Ananya Iyer", "email": "ananya.iyer@email.com", "phone": "+91 2109876543",
        "city": "Mysore", "state": "Karnataka", "highest_degree": "PhD",
        "field_of_study": "Artificial Intelligence", "university": "IIT Madras", "graduation_year": 2021,
        "gpa": "9.4", "total_experience_years": "3 years", "current_job_title": "AI Research Engineer",
        "current_company": "Microsoft Research India", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "C++", "Julia"], "frameworks_and_libraries": ["PyTorch", "TensorFlow", "Hugging Face", "LangChain"], "databases": ["PostgreSQL", "MongoDB"], "cloud_platforms": ["Azure", "AWS"], "tools": ["Git", "Docker", "Jupyter", "CUDA"]},
        "work_history": [{"company": "Microsoft Research India", "job_title": "AI Research Engineer", "start_date": "Sep 2021", "end_date": "Present", "description": "Researching large language model fine-tuning techniques"}],
        "projects": [{"name": "LLM Fine-tuning Framework", "description": "Framework for efficient fine-tuning of large language models", "technologies": ["Python", "PyTorch", "CUDA", "Hugging Face"], "project_type": "professional"}],
    },
    {
        "filename": "rohit_malhotra_resume.pdf",
        "full_name": "Rohit Malhotra", "email": "rohit.malhotra@email.com", "phone": "+91 1098765432",
        "city": "Noida", "state": "Uttar Pradesh", "highest_degree": "Bachelor's",
        "field_of_study": "Computer Applications", "university": "Amity University", "graduation_year": 2020,
        "gpa": "7.0", "total_experience_years": "4 years", "current_job_title": "QA Engineer",
        "current_company": "HCL Technologies", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "JavaScript", "Java"], "frameworks_and_libraries": ["Selenium", "Cypress", "Jest", "Pytest"], "databases": ["MySQL", "MongoDB"], "cloud_platforms": ["AWS"], "tools": ["Jira", "Postman", "Git", "Jenkins"]},
        "work_history": [{"company": "HCL Technologies", "job_title": "QA Engineer", "start_date": "Jun 2021", "end_date": "Present", "description": "Automated testing for enterprise web applications"}, {"company": "Sapient", "job_title": "Junior QA", "start_date": "Aug 2020", "end_date": "May 2021", "description": "Manual and automated testing for banking portal"}],
        "projects": [{"name": "Test Automation Framework", "description": "End-to-end automation framework using Selenium", "technologies": ["Python", "Selenium", "Jenkins"], "project_type": "professional"}],
    },
    {
        "filename": "divya_krishnan_resume.pdf",
        "full_name": "Divya Krishnan", "email": "divya.krishnan@email.com", "phone": "+91 9087654321",
        "city": "Coimbatore", "state": "Tamil Nadu", "highest_degree": "Bachelor's",
        "field_of_study": "Electronics and Instrumentation", "university": "PSG College of Technology", "graduation_year": 2021,
        "gpa": "8.0", "total_experience_years": "3 years", "current_job_title": "Cloud Engineer",
        "current_company": "Wipro", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "Bash", "PowerShell"], "frameworks_and_libraries": ["Flask", "FastAPI"], "databases": ["MySQL", "DynamoDB"], "cloud_platforms": ["AWS", "Azure"], "tools": ["Terraform", "Ansible", "Docker", "Git"]},
        "work_history": [{"company": "Wipro", "job_title": "Cloud Engineer", "start_date": "Jul 2022", "end_date": "Present", "description": "Managed AWS infrastructure for enterprise clients"}, {"company": "Capgemini", "job_title": "Associate Consultant", "start_date": "Sep 2021", "end_date": "Jun 2022", "description": "Cloud migration projects for European clients"}],
        "projects": [{"name": "Cloud Migration", "description": "Migrated on-premise infrastructure to AWS", "technologies": ["AWS", "Terraform", "Docker"], "project_type": "professional"}],
    },
    {
        "filename": "nikhil_desai_resume.pdf",
        "full_name": "Nikhil Desai", "email": "nikhil.desai@email.com", "phone": "+91 8976543210",
        "city": "Nagpur", "state": "Maharashtra", "highest_degree": "Diploma",
        "field_of_study": "Computer Technology", "university": "Government Polytechnic Nagpur", "graduation_year": 2018,
        "gpa": None, "total_experience_years": "6 years", "current_job_title": "WordPress Developer",
        "current_company": "Freelance", "employment_gap_flag": False,
        "skills": {"programming_languages": ["PHP", "JavaScript", "HTML", "CSS"], "frameworks_and_libraries": ["WordPress", "WooCommerce", "jQuery", "Bootstrap"], "databases": ["MySQL"], "cloud_platforms": ["AWS", "DigitalOcean"], "tools": ["Git", "Elementor", "Figma"]},
        "work_history": [{"company": "Freelance", "job_title": "WordPress Developer", "start_date": "Jan 2020", "end_date": "Present", "description": "Building custom WordPress themes and plugins for clients"}, {"company": "WebSolutions Nagpur", "job_title": "Junior Web Developer", "start_date": "Jun 2018", "end_date": "Dec 2019", "description": "Developed and maintained client websites"}],
        "projects": [{"name": "E-commerce Store", "description": "Custom WooCommerce store with payment integration", "technologies": ["WordPress", "WooCommerce", "PHP"], "project_type": "professional"}],
    },
    {
        "filename": "meera_pillai_resume.pdf",
        "full_name": "Meera Pillai", "email": "meera.pillai@email.com", "phone": "+91 7865432109",
        "city": "Trivandrum", "state": "Kerala", "highest_degree": "Master's",
        "field_of_study": "Computer Science", "university": "University of Kerala", "graduation_year": 2020,
        "gpa": "8.6", "total_experience_years": "4 years", "current_job_title": "Security Engineer",
        "current_company": "Tata Consultancy Services", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "C", "Bash"], "frameworks_and_libraries": ["Django", "Flask"], "databases": ["PostgreSQL", "Redis"], "cloud_platforms": ["AWS", "Azure"], "tools": ["Burp Suite", "Metasploit", "Wireshark", "Docker", "Git"]},
        "work_history": [{"company": "TCS", "job_title": "Security Engineer", "start_date": "Aug 2021", "end_date": "Present", "description": "Conducted penetration testing and security audits"}, {"company": "Infosys", "job_title": "Associate Engineer", "start_date": "Jul 2020", "end_date": "Jul 2021", "description": "Developed secure backend APIs"}],
        "projects": [{"name": "Vulnerability Scanner", "description": "Automated web vulnerability detection tool", "technologies": ["Python", "Burp Suite API", "Django"], "project_type": "professional"}],
    },
    {
        "filename": "aditya_bose_resume.pdf",
        "full_name": "Aditya Bose", "email": "aditya.bose@email.com", "phone": "+91 6754321098",
        "city": "Kolkata", "state": "West Bengal", "highest_degree": "Bachelor's",
        "field_of_study": "Information Technology", "university": "Jadavpur University", "graduation_year": 2023,
        "gpa": "8.1", "total_experience_years": "1 year", "current_job_title": "Junior Developer",
        "current_company": "Mphasis", "employment_gap_flag": False,
        "skills": {"programming_languages": ["Python", "Java", "C++"], "frameworks_and_libraries": ["Spring Boot", "FastAPI", "React"], "databases": ["MySQL", "MongoDB"], "cloud_platforms": ["AWS"], "tools": ["Git", "Docker", "Postman"]},
        "work_history": [{"company": "Mphasis", "job_title": "Junior Developer", "start_date": "Aug 2023", "end_date": "Present", "description": "Developing backend services for fintech client"}],
        "projects": [{"name": "Student Portal", "description": "College management system with attendance tracking", "technologies": ["Java", "Spring Boot", "MySQL", "React"], "project_type": "personal/academic"}],
    },
]


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(User).filter(User.email == SEED_USER_EMAIL).first()
        if existing:
            print("Seed data already exists, skipping...")
            return

        print("Seeding database with 15 candidate records...")

        # Create seed user
        user = User(
            name="Admin HR",
            email=SEED_USER_EMAIL,
            password=hash_password(SEED_USER_PASSWORD),
            is_verified=True
        )
        db.add(user)
        db.flush()

        for i, c in enumerate(CANDIDATES):
            # Create resume record
            resume = Resume(
                user_id=user.id,
                original_filename=c["filename"],
                file_url=f"https://res.cloudinary.com/demo/raw/upload/sample_resume_{i+1}.pdf",
                public_id=f"resumes/sample_{i+1}",
                extracted_text=f"Sample extracted text for {c['full_name']}",
                status=ResumeStatus.completed,
                file_hash=f"seeded_hash_{i+1}_{c['email']}",
                uploaded_at=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            db.add(resume)
            db.flush()

            # Create parsed data
            resume_data = ResumeData(
                resume_id=resume.id,
                full_name=c["full_name"],
                email=c["email"],
                phone=c["phone"],
                city=c["city"],
                state=c["state"],
                highest_degree=c["highest_degree"],
                field_of_study=c["field_of_study"],
                university=c["university"],
                graduation_year=c["graduation_year"],
                gpa=c["gpa"],
                total_experience_years=c["total_experience_years"],
                current_job_title=c["current_job_title"],
                current_company=c["current_company"],
                employment_gap_flag=c["employment_gap_flag"],
                skills=json.dumps(c["skills"]),
                work_history=json.dumps(c["work_history"]),
                projects=json.dumps(c["projects"]),
                education_detail=json.dumps([]),
            )
            db.add(resume_data)

        db.commit()
        print(f"Successfully seeded {len(CANDIDATES)} candidates!")
        print(f"Login with: {SEED_USER_EMAIL} / {SEED_USER_PASSWORD}")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()