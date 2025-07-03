from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.models import (
    Coupon, CouponCreate, CouponUpdate, CouponType,
    User, ResponseModel
)
from app.auth import get_current_admin_user, get_current_active_user
from app.database import get_coupons_collection
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[Coupon])
async def get_coupons(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all coupons (Admin only)"""
    coupons_collection = await get_coupons_collection()
    
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = coupons_collection.find(query).skip(skip).limit(limit)
    coupons = await cursor.to_list(length=limit)
    
    return [Coupon(**coupon) for coupon in coupons]

@router.get("/{coupon_id}", response_model=Coupon)
async def get_coupon(
    coupon_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Get a specific coupon by ID (Admin only)"""
    if not ObjectId.is_valid(coupon_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coupon ID"
        )
    
    coupons_collection = await get_coupons_collection()
    coupon = await coupons_collection.find_one({"_id": ObjectId(coupon_id)})
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    return Coupon(**coupon)

@router.post("/", response_model=ResponseModel)
async def create_coupon(
    coupon: CouponCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new coupon (Admin only)"""
    coupons_collection = await get_coupons_collection()
    
    # Check if coupon code already exists
    existing_coupon = await coupons_collection.find_one({"code": coupon.code.upper()})
    if existing_coupon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code already exists"
        )
    
    # Validate expiry date
    if coupon.expiry_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry date must be in the future"
        )
    
    # Create coupon document
    coupon_dict = coupon.dict()
    coupon_dict["code"] = coupon_dict["code"].upper()  # Store codes in uppercase
    coupon_dict["used_count"] = 0
    coupon_dict["created_at"] = datetime.utcnow()
    coupon_dict["updated_at"] = datetime.utcnow()
    
    # Insert coupon
    result = await coupons_collection.insert_one(coupon_dict)
    
    # Get created coupon
    created_coupon = await coupons_collection.find_one({"_id": result.inserted_id})
    
    return ResponseModel(
        message="Coupon created successfully",
        data={"coupon": Coupon(**created_coupon).dict()}
    )

@router.put("/{coupon_id}", response_model=ResponseModel)
async def update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    current_user: User = Depends(get_current_admin_user)
):
    """Update a coupon (Admin only)"""
    if not ObjectId.is_valid(coupon_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coupon ID"
        )
    
    coupons_collection = await get_coupons_collection()
    
    # Check if coupon exists
    existing_coupon = await coupons_collection.find_one({"_id": ObjectId(coupon_id)})
    if not existing_coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Validate expiry date if provided
    if coupon_update.expiry_date and coupon_update.expiry_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry date must be in the future"
        )
    
    # Update document
    update_data = {k: v for k, v in coupon_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await coupons_collection.update_one(
            {"_id": ObjectId(coupon_id)},
            {"$set": update_data}
        )
    
    # Get updated coupon
    updated_coupon = await coupons_collection.find_one({"_id": ObjectId(coupon_id)})
    
    return ResponseModel(
        message="Coupon updated successfully",
        data={"coupon": Coupon(**updated_coupon).dict()}
    )

@router.delete("/{coupon_id}", response_model=ResponseModel)
async def delete_coupon(
    coupon_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Delete/deactivate a coupon (Admin only)"""
    if not ObjectId.is_valid(coupon_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coupon ID"
        )
    
    coupons_collection = await get_coupons_collection()
    
    # Check if coupon exists
    existing_coupon = await coupons_collection.find_one({"_id": ObjectId(coupon_id)})
    if not existing_coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Deactivate coupon instead of hard delete
    await coupons_collection.update_one(
        {"_id": ObjectId(coupon_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return ResponseModel(message="Coupon deactivated successfully")

@router.post("/validate/{coupon_code}")
async def validate_coupon(
    coupon_code: str,
    order_amount: float = Query(..., gt=0),
    current_user: User = Depends(get_current_active_user)
):
    """Validate a coupon code and return discount information"""
    coupons_collection = await get_coupons_collection()
    
    # Find coupon by code (case-insensitive)
    coupon = await coupons_collection.find_one({"code": coupon_code.upper()})
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid coupon code"
        )
    
    coupon_obj = Coupon(**coupon)
    
    # Validate coupon
    validation_result = validate_coupon_usage(coupon_obj, order_amount)
    
    if not validation_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result["error"]
        )
    
    discount_amount = calculate_discount(coupon_obj, order_amount)
    
    return {
        "valid": True,
        "coupon": coupon_obj.dict(),
        "discount_amount": discount_amount,
        "final_amount": max(0, order_amount - discount_amount)
    }

def validate_coupon_usage(coupon: Coupon, order_amount: float) -> dict:
    """Validate if coupon can be used"""
    
    # Check if coupon is active
    if not coupon.is_active:
        return {"valid": False, "error": "Coupon is not active"}
    
    # Check expiry date
    if coupon.expiry_date <= datetime.utcnow():
        return {"valid": False, "error": "Coupon has expired"}
    
    # Check minimum order amount
    if order_amount < coupon.min_order_amount:
        return {
            "valid": False, 
            "error": f"Minimum order amount is ${coupon.min_order_amount}"
        }
    
    # Check usage limit
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        return {"valid": False, "error": "Coupon usage limit reached"}
    
    return {"valid": True}

def calculate_discount(coupon: Coupon, order_amount: float) -> float:
    """Calculate discount amount based on coupon type"""
    
    if coupon.coupon_type == CouponType.PERCENTAGE:
        discount = order_amount * (coupon.value / 100)
        # Apply max discount limit if specified
        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)
    else:  # FIXED_AMOUNT
        discount = min(coupon.value, order_amount)
    
    return round(discount, 2)

async def apply_coupon_usage(coupon_code: str):
    """Increment coupon usage count"""
    coupons_collection = await get_coupons_collection()
    
    await coupons_collection.update_one(
        {"code": coupon_code.upper()},
        {
            "$inc": {"used_count": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )