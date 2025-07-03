from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Address Model
class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"

# Product Models
class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    BOOKS = "books"
    HOME = "home"
    SPORTS = "sports"
    BEAUTY = "beauty"
    TOYS = "toys"
    OTHER = "other"

class ProductBase(BaseModel):
    name: str
    description: str
    category: ProductCategory
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    images: List[str] = []
    tags: List[str] = []
    is_active: bool = True
    discount_percentage: float = Field(default=0, ge=0, le=100)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)

class Product(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    rating: float = 0.0
    review_count: int = 0

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Cart Models
class CartItem(BaseModel):
    product_id: PyObjectId
    quantity: int = Field(..., gt=0)
    price: float

class CartBase(BaseModel):
    user_id: PyObjectId
    items: List[CartItem] = []
    total_amount: float = 0.0

class Cart(CartBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

# Coupon Models
class CouponType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"

class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=20)
    description: str
    coupon_type: CouponType
    value: float = Field(..., gt=0)
    min_order_amount: float = Field(default=0, ge=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, gt=0)
    expiry_date: datetime
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    value: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, gt=0)
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class Coupon(CouponBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    used_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Order Models
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderItem(BaseModel):
    product_id: PyObjectId
    product_name: str
    quantity: int
    price: float
    total: float

class OrderBase(BaseModel):
    user_id: PyObjectId
    items: List[OrderItem]
    shipping_address: Address
    subtotal: float
    discount_amount: float = 0.0
    total_amount: float
    coupon_code: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING

class OrderCreate(BaseModel):
    shipping_address: Address
    coupon_code: Optional[str] = None

class Order(OrderBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Wishlist Models
class WishlistItem(BaseModel):
    product_id: PyObjectId
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Wishlist(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    items: List[WishlistItem] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Response Models
class ResponseModel(BaseModel):
    message: str
    data: Optional[Dict] = None
    success: bool = True