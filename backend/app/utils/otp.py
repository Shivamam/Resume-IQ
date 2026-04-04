import pyotp
import redis
import os
from dotenv import load_dotenv

load_dotenv()

OTP_EXPIRE_SECONDS = int(os.getenv("OTP_EXPIRE_SECONDS", 300))

r = redis.from_url(os.getenv("REDIS_URL"))

def generate_otp(email: str) -> str:
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=OTP_EXPIRE_SECONDS, digits=6)
    otp = totp.now()

    # Store both secret and otp in Redis with expiry
    r.setex(f"otp:{email}:secret", OTP_EXPIRE_SECONDS, secret)
    r.setex(f"otp:{email}:code", OTP_EXPIRE_SECONDS, otp)

    return otp

def verify_otp(email: str, otp: str) -> bool:
    stored_code = r.get(f"otp:{email}:code")

    if not stored_code:
        return False  # expired or never generated

    is_valid = stored_code.decode() == otp

    if is_valid:
        # Delete immediately after use — prevent reuse
        r.delete(f"otp:{email}:secret")
        r.delete(f"otp:{email}:code")

    return is_valid