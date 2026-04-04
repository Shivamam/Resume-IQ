from fastapi import FastAPI
from .database import Base, engine
from .routers import users, auth, resumes, ws, candidates, jd  # ← both imported here
import time
import sqlalchemy
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(auth.router)  # ← auth registered first
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(ws.router)
app.include_router(candidates.router)
app.include_router(jd.router)


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app = FastAPI(redirect_slashes=False)

@app.on_event("startup")
async def startup():
    # Retry DB connection — MySQL container may not be ready immediately
    retries = 10
    for i in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("Database tables created successfully")
            break
        except sqlalchemy.exc.OperationalError:
            if i < retries - 1:
                print(f"DB not ready, retrying in 3s... ({i+1}/{retries})")
                time.sleep(3)
            else:
                raise


@app.get("/")
def root():
    return {"message": "FastAPI + MySQL + Redis is running"}