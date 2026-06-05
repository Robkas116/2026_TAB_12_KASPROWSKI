from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import os
import secrets
from typing import Any
from jose import jwt
import bcrypt

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in the environment")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30


@dataclass
class PasswordResetTokenData:
    user_id: int
    expires_at: datetime


PASSWORD_RESET_TOKENS: dict[str, PasswordResetTokenData] = {}

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_password_reset_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    expires_delta = expires_delta or timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    token = secrets.token_urlsafe(32)
    PASSWORD_RESET_TOKENS[token] = PasswordResetTokenData(
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + expires_delta,
    )
    return token


def consume_password_reset_token(token: str) -> int | None:
    token_data = PASSWORD_RESET_TOKENS.pop(token, None)
    if not token_data:
        return None

    if token_data.expires_at < datetime.now(timezone.utc):
        return None

    return token_data.user_id
