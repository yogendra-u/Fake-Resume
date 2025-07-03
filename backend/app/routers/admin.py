from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta

from app.models import User, ResponseModel, UserRole
from app.auth import get_current_admin_user
from app.database import (
    get_users_collection, get_products_collection, 
    get_orders_collection, get_coupons_collection
)
from bson import ObjectId

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(current_user: User = Depends(get_current_admin_user)):
    """Get dashboard statistics (Admin only)"""
    
    # Collections
    users_collection = await get_users_collection()
    products_collection = await get_products_collection()
    orders_collection = await get_orders_collection()
    coupons_collection = await get_coupons_collection()
    
    # User statistics
    total_users = await users_collection.count_documents({"role": "customer"})
    total_admins = await users_collection.count_documents({"role": "admin"})
    active_users = await users_collection.count_documents({"role": "customer", "is_active": True})
    
    # Product statistics
    total_products = await products_collection.count_documents({})
    active_products = await products_collection.count_documents({"is_active": True})
    low_stock_products = await products_collection.count_documents({"stock_quantity": {"$lt": 10}})
    
    # Order statistics
    total_orders = await orders_collection.count_documents({})
    pending_orders = await orders_collection.count_documents({"status": "pending"})
    completed_orders = await orders_collection.count_documents({"status": "delivered"})
    
    # Revenue statistics
    revenue_pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await orders_collection.aggregate(revenue_pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Monthly revenue (last 12 months)
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    monthly_revenue_pipeline = [
        {"$match": {"created_at": {"$gte": twelve_months_ago}}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "revenue": {"$sum": "$total_amount"},
                "orders": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_revenue = await orders_collection.aggregate(monthly_revenue_pipeline).to_list(length=None)
    
    # Recent orders (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_orders = await orders_collection.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Coupon statistics
    total_coupons = await coupons_collection.count_documents({})
    active_coupons = await coupons_collection.count_documents({"is_active": True})
    expired_coupons = await coupons_collection.count_documents({
        "expiry_date": {"$lt": datetime.utcnow()}
    })
    
    # Top selling products
    top_products_pipeline = [
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "total_sold": {"$sum": "$items.quantity"},
                "total_revenue": {"$sum": "$items.total"}
            }
        },
        {"$sort": {"total_sold": -1}},
        {"$limit": 10}
    ]
    top_products = await orders_collection.aggregate(top_products_pipeline).to_list(length=10)
    
    return {
        "users": {
            "total_users": total_users,
            "total_admins": total_admins,
            "active_users": active_users
        },
        "products": {
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_products": low_stock_products
        },
        "orders": {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "recent_orders": recent_orders
        },
        "revenue": {
            "total_revenue": round(total_revenue, 2),
            "monthly_breakdown": [
                {
                    "month": f"{item['_id']['year']}-{item['_id']['month']:02d}",
                    "revenue": round(item["revenue"], 2),
                    "orders": item["orders"]
                }
                for item in monthly_revenue
            ]
        },
        "coupons": {
            "total_coupons": total_coupons,
            "active_coupons": active_coupons,
            "expired_coupons": expired_coupons
        },
        "top_products": [
            {
                "product_id": str(item["_id"]),
                "product_name": item["product_name"],
                "total_sold": item["total_sold"],
                "total_revenue": round(item["total_revenue"], 2)
            }
            for item in top_products
        ]
    }

@router.get("/users", response_model=List[User])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all users (Admin only)"""
    users_collection = await get_users_collection()
    
    query = {}
    if role:
        query["role"] = role
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = users_collection.find(query, {"hashed_password": 0}).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return [User(**user) for user in users]

@router.put("/users/{user_id}/status", response_model=ResponseModel)
async def update_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(get_current_admin_user)
):
    """Update user status (Admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    users_collection = await get_users_collection()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    if str(existing_user["_id"]) == str(current_user.id) and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Update user status
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": is_active,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return ResponseModel(
        message=f"User {'activated' if is_active else 'deactivated'} successfully"
    )

@router.put("/users/{user_id}/role", response_model=ResponseModel)
async def update_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: User = Depends(get_current_admin_user)
):
    """Update user role (Admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    users_collection = await get_users_collection()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from changing their own role
    if str(existing_user["_id"]) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Update user role
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "role": new_role,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return ResponseModel(
        message=f"User role updated to {new_role} successfully"
    )

@router.delete("/users/{user_id}", response_model=ResponseModel)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Delete user account (Admin only)"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    users_collection = await get_users_collection()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if str(existing_user["_id"]) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Soft delete by deactivating the user
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return ResponseModel(message="User account deactivated successfully")

@router.get("/analytics/sales")
async def get_sales_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user)
):
    """Get sales analytics for specified period (Admin only)"""
    orders_collection = await get_orders_collection()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily sales for the period
    daily_sales_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at"
                    }
                },
                "orders": {"$sum": 1},
                "revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_sales = await orders_collection.aggregate(daily_sales_pipeline).to_list(length=None)
    
    # Category-wise sales
    category_sales_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$unwind": "$items"},
        {
            "$lookup": {
                "from": "products",
                "localField": "items.product_id",
                "foreignField": "_id",
                "as": "product"
            }
        },
        {"$unwind": "$product"},
        {
            "$group": {
                "_id": "$product.category",
                "orders": {"$sum": 1},
                "revenue": {"$sum": "$items.total"},
                "quantity": {"$sum": "$items.quantity"}
            }
        },
        {"$sort": {"revenue": -1}}
    ]
    category_sales = await orders_collection.aggregate(category_sales_pipeline).to_list(length=None)
    
    return {
        "period_days": days,
        "daily_sales": [
            {
                "date": item["_id"],
                "orders": item["orders"],
                "revenue": round(item["revenue"], 2)
            }
            for item in daily_sales
        ],
        "category_breakdown": [
            {
                "category": item["_id"],
                "orders": item["orders"],
                "revenue": round(item["revenue"], 2),
                "quantity": item["quantity"]
            }
            for item in category_sales
        ]
    }