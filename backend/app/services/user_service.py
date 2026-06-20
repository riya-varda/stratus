import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    generate_api_key,
    generate_verification_token,
    get_password_hash,
    hash_api_key,
    verify_password,
)
from app.db.redis import cache_delete, cache_get
from app.models.models import APIKey, User, UserRole
from app.schemas.user import APIKeyCreate, UserCreate, UserUpdate

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        cache_key = f"user:{user_id}"
        cached = await cache_get(cache_key)
        if cached:
            return None  # We don't reconstruct ORM objects from cache; just skip

        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, user_in: UserCreate) -> User:
        existing_email = await self.get_by_email(user_in.email)
        if existing_email:
            raise ValueError("Email already registered")

        existing_username = await self.get_by_username(user_in.username)
        if existing_username:
            raise ValueError("Username already taken")

        verification_token = generate_verification_token()
        user = User(
            email=user_in.email,
            username=user_in.username,
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
            verification_token=verification_token,
            role=UserRole.developer,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> User | None:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        user.last_login_at = datetime.now(UTC)
        await self.db.flush()
        return user

    async def update(self, user: User, update_data: UserUpdate) -> User:
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(user, field, value)
        await self.db.flush()
        await self.db.refresh(user)
        await cache_delete(f"user:{user.id}")
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        if not verify_password(current_password, user.hashed_password):
            return False
        user.hashed_password = get_password_hash(new_password)
        await self.db.flush()
        return True

    async def verify_email(self, token: str) -> User | None:
        result = await self.db.execute(select(User).where(User.verification_token == token))
        user = result.scalar_one_or_none()
        if user:
            user.is_verified = True
            user.verification_token = None
            await self.db.flush()
        return user

    async def create_api_key(self, user: User, key_data: APIKeyCreate) -> tuple[APIKey, str]:
        raw_key = generate_api_key()
        api_key = APIKey(
            user_id=user.id,
            name=key_data.name,
            key_hash=hash_api_key(raw_key),
            key_prefix=raw_key[:10],
        )
        self.db.add(api_key)
        await self.db.flush()
        await self.db.refresh(api_key)
        return api_key, raw_key

    async def list_api_keys(self, user: User) -> list[APIKey]:
        result = await self.db.execute(select(APIKey).where(APIKey.user_id == user.id))
        return list(result.scalars().all())

    async def delete_api_key(self, user: User, key_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id)
        )
        api_key = result.scalar_one_or_none()
        if not api_key:
            return False
        await self.db.delete(api_key)
        return True

    async def get_stats(self) -> dict[str, Any]:
        total = await self.db.execute(select(func.count(User.id)))
        active = await self.db.execute(select(func.count(User.id)).where(User.is_active))
        return {
            "total_users": total.scalar_one(),
            "active_users": active.scalar_one(),
        }
