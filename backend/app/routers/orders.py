from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

from app.models import (
    Order, OrderCreate, OrderStatus, OrderItem, 
    User, ResponseModel, Cart
)
from app.auth import get_current_active_user, get_current_admin_user
from app.database import (
    get_orders_collection, get_carts_collection, 
    get_products_collection, get_coupons_collection
)
from app.routers.cart import get_or_create_cart
from app.routers.coupons import validate_coupon_usage, calculate_discount, apply_coupon_usage
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[Order])
async def get_user_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's orders"""
    orders_collection = await get_orders_collection()
    
    query = {"user_id": ObjectId(str(current_user.id))}
    if status:
        query["status"] = status
    
    cursor = orders_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    return [Order(**order) for order in orders]

@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific order"""
    if not ObjectId.is_valid(order_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID"
        )
    
    orders_collection = await get_orders_collection()
    order = await orders_collection.find_one({
        "_id": ObjectId(order_id),
        "user_id": ObjectId(str(current_user.id))
    })
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return Order(**order)

@router.post("/create", response_model=ResponseModel)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create order from cart"""
    # Get user's cart
    cart = await get_or_create_cart(str(current_user.id))
    
    if not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # Validate and prepare order items
    order_items = []
    subtotal = 0.0
    products_collection = await get_products_collection()
    
    for cart_item in cart.items:
        # Get product details
        product = await products_collection.find_one({"_id": cart_item.product_id})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product not found: {cart_item.product_id}"
            )
        
        if not product.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product not available: {product['name']}"
            )
        
        if product.get("stock_quantity", 0) < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for: {product['name']}"
            )
        
        # Calculate item total
        item_total = cart_item.price * cart_item.quantity
        subtotal += item_total
        
        order_items.append(OrderItem(
            product_id=cart_item.product_id,
            product_name=product["name"],
            quantity=cart_item.quantity,
            price=cart_item.price,
            total=item_total
        ))
    
    # Apply coupon if provided
    discount_amount = 0.0
    if order_data.coupon_code:
        coupons_collection = await get_coupons_collection()
        coupon = await coupons_collection.find_one({"code": order_data.coupon_code.upper()})
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coupon code"
            )
        
        from app.models import Coupon
        coupon_obj = Coupon(**coupon)
        
        # Validate coupon
        validation_result = validate_coupon_usage(coupon_obj, subtotal)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_result["error"]
            )
        
        discount_amount = calculate_discount(coupon_obj, subtotal)
    
    # Calculate final total
    total_amount = max(0, subtotal - discount_amount)
    
    # Generate order number
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Create order document
    order_dict = {
        "user_id": ObjectId(str(current_user.id)),
        "order_number": order_number,
        "items": [item.dict() for item in order_items],
        "shipping_address": order_data.shipping_address.dict(),
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total_amount": total_amount,
        "coupon_code": order_data.coupon_code,
        "status": OrderStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    orders_collection = await get_orders_collection()
    result = await orders_collection.insert_one(order_dict)
    
    # Update product stock quantities
    for cart_item in cart.items:
        await products_collection.update_one(
            {"_id": cart_item.product_id},
            {"$inc": {"stock_quantity": -cart_item.quantity}}
        )
    
    # Apply coupon usage if coupon was used
    if order_data.coupon_code:
        await apply_coupon_usage(order_data.coupon_code)
    
    # Clear cart
    carts_collection = await get_carts_collection()
    await carts_collection.update_one(
        {"user_id": ObjectId(str(current_user.id))},
        {
            "$set": {
                "items": [],
                "total_amount": 0.0,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get created order
    created_order = await orders_collection.find_one({"_id": result.inserted_id})
    
    return ResponseModel(
        message="Order created successfully",
        data={"order": Order(**created_order).dict()}
    )

@router.put("/{order_id}/status", response_model=ResponseModel)
async def update_order_status(
    order_id: str,
    new_status: OrderStatus,
    current_user: User = Depends(get_current_admin_user)
):
    """Update order status (Admin only)"""
    if not ObjectId.is_valid(order_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID"
        )
    
    orders_collection = await get_orders_collection()
    
    # Check if order exists
    existing_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update order status
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated order
    updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    
    return ResponseModel(
        message="Order status updated successfully",
        data={"order": Order(**updated_order).dict()}
    )

@router.get("/admin/all", response_model=List[Order])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all orders (Admin only)"""
    orders_collection = await get_orders_collection()
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = orders_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    return [Order(**order) for order in orders]

@router.get("/admin/stats")
async def get_order_stats(current_user: User = Depends(get_current_admin_user)):
    """Get order statistics (Admin only)"""
    orders_collection = await get_orders_collection()
    
    # Total orders
    total_orders = await orders_collection.count_documents({})
    
    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_stats = await orders_collection.aggregate(status_pipeline).to_list(length=None)
    
    # Total revenue
    revenue_pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await orders_collection.aggregate(revenue_pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Recent orders (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_orders = await orders_collection.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    return {
        "total_orders": total_orders,
        "status_breakdown": {stat["_id"]: stat["count"] for stat in status_stats},
        "total_revenue": round(total_revenue, 2),
        "recent_orders": recent_orders
    }