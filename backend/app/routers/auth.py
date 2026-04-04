from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel 

from .. import models, schemas
from ..database import get_db
from ..utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    decode_token 
)
from ..utils.otp import generate_otp, verify_otp
from ..utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user:
        import asyncio
        await asyncio.sleep(0.5)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    otp = generate_otp(user.email)
    await send_otp_email(user.email, otp)

    return {"message": "OTP sent to your email"}

@router.post("/verify-otp", response_model=schemas.TokenResponse)
async def verify_otp_route(
    payload: schemas.VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    is_valid = verify_otp(payload.email, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_verified:
        user.is_verified = True
        db.commit()

    token_data = {"sub": str(user.id), "email": user.email}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )

    current_user.password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_token(payload: RefreshRequest):
    data = decode_token(payload.refresh_token)

    if not data or data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    token_data = {"sub": data["sub"], "email": data["email"]}
    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer"
    }