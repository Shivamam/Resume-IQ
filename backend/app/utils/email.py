from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME="apikey",                        # SendGrid requires this literally
    MAIL_PASSWORD=os.getenv("SENDGRID_API_KEY"),   # your actual API key goes here
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.sendgrid.net",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    VALIDATE_CERTS=False,
)

async def send_otp_email(email: str, otp: str):
    message = MessageSchema(
        subject="Your login OTP",
        recipients=[email],
        body=f"""
        Your verification code
        Use the code below to complete your login. It expires in 5 minutes.
        {otp}
        If you didn't request this, ignore this email.
        """,
        subtype=MessageType.html
    )
    print("=== EMAIL DEBUG ===")
    print("To:", email)
    print("Subject:", message.subject)
    print("Body (HTML):")
    print(message.body)
    print("===================")
    fm = FastMail(conf)
    await fm.send_message(message)