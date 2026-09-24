from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.db.database import get_db
from app.db.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================
# REGISTRATION
# ============================================================

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterResponse(BaseModel):
    id: int
    name: str
    email: EmailStr


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = User(
        name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(
            payload.password
        ),
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not create user",
        )

    return new_user


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def read_current_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


# ============================================================
# UPDATE PROFILE
# ============================================================

class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr


class UpdateProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    message: str


@router.put(
    "/me",
    response_model=UpdateProfileResponse,
)
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    new_name = payload.name.strip()

    if not new_name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty.",
        )

    # Check whether the email is already
    # being used by another account.
    existing_user = (
        db.query(User)
        .filter(
            User.email == payload.email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered to another account.",
        )

    try:
        current_user.name = new_name
        current_user.email = payload.email

        db.commit()
        db.refresh(current_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="This email is already registered.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not update profile.",
        )

    return UpdateProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        message="Profile updated successfully.",
    )


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1
    )

    new_password: str = Field(
        min_length=8
    )


class ChangePasswordResponse(BaseModel):
    message: str


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    if verify_password(
        payload.new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password.",
        )

    try:
        current_user.password_hash = hash_password(
            payload.new_password
        )

        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not change password.",
        )

    return ChangePasswordResponse(
        message="Password changed successfully."
    )