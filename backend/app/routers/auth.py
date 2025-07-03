from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from datetime import timedelta

from app.models import UserCreate, User, UserInDB, LoginRequest, Token, ResponseModel, UserRole
from app.auth import (
    get_password_hash, 
    authenticate_user, 
    create_access_token, 
    get_current_active_user,
    get_user_by_email
)
from app.database import get_users_collection
from bson import ObjectId

router = APIRouter()

@router.post("/register", response_model=ResponseModel)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    users_collection = await get_users_collection()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    
    # Insert user
    result = await users_collection.insert_one(user_dict)
    
    # Get created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    user = User(**created_user)
    
    return ResponseModel(
        message="User registered successfully",
        data={"user": user.dict()}
    )

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: LoginRequest):
    """Login user and return access token"""
    user = await authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_response = User(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@router.post("/create-admin", response_model=ResponseModel)
async def create_admin_user(admin_data: UserCreate):
    """Create an admin user (for development/setup purposes)"""
    users_collection = await get_users_collection()
    
    # Check if admin already exists
    existing_admin = await users_collection.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists"
        )
    
    # Check if user email already exists
    existing_user = await users_collection.find_one({"email": admin_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(admin_data.password)
    
    # Create admin user document
    admin_dict = admin_data.dict()
    del admin_dict["password"]
    admin_dict["hashed_password"] = hashed_password
    admin_dict["role"] = UserRole.ADMIN
    
    # Insert admin user
    result = await users_collection.insert_one(admin_dict)
    
    # Get created user
    created_admin = await users_collection.find_one({"_id": result.inserted_id})
    admin_user = User(**created_admin)
    
    return ResponseModel(
        message="Admin user created successfully",
        data={"user": admin_user.dict()}
    )