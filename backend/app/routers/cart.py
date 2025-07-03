from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime

from app.models import (
    Cart, CartItem, AddToCartRequest, User, ResponseModel, Product
)
from app.auth import get_current_active_user
from app.database import get_carts_collection, get_products_collection
from bson import ObjectId

router = APIRouter()

async def get_or_create_cart(user_id: str) -> Cart:
    """Get existing cart or create new one for user"""
    carts_collection = await get_carts_collection()
    
    cart_data = await carts_collection.find_one({"user_id": ObjectId(user_id)})
    if cart_data:
        return Cart(**cart_data)
    
    # Create new cart
    new_cart = Cart(user_id=ObjectId(user_id))
    cart_dict = new_cart.dict()
    cart_dict["_id"] = cart_dict.pop("id")
    result = await carts_collection.insert_one(cart_dict)
    
    created_cart = await carts_collection.find_one({"_id": result.inserted_id})
    return Cart(**created_cart)

async def calculate_cart_total(cart: Cart) -> float:
    """Calculate total amount for cart"""
    total = 0.0
    for item in cart.items:
        total += item.price * item.quantity
    return round(total, 2)

@router.get("/", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_active_user)):
    """Get user's cart"""
    cart = await get_or_create_cart(str(current_user.id))
    return cart

@router.post("/add", response_model=ResponseModel)
async def add_to_cart(
    request: AddToCartRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Add item to cart"""
    # Validate product exists
    if not ObjectId.is_valid(request.product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    products_collection = await get_products_collection()
    product = await products_collection.find_one({"_id": ObjectId(request.product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if not product.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not available"
        )
    
    if product.get("stock_quantity", 0) < request.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock"
        )
    
    # Get or create cart
    cart = await get_or_create_cart(str(current_user.id))
    carts_collection = await get_carts_collection()
    
    # Check if item already exists in cart
    product_id_obj = ObjectId(request.product_id)
    existing_item_index = None
    for i, item in enumerate(cart.items):
        if item.product_id == product_id_obj:
            existing_item_index = i
            break
    
    # Calculate discounted price
    price = product["price"]
    if product.get("discount_percentage", 0) > 0:
        price = price * (1 - product["discount_percentage"] / 100)
    
    if existing_item_index is not None:
        # Update existing item
        new_quantity = cart.items[existing_item_index].quantity + request.quantity
        if product.get("stock_quantity", 0) < new_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock for requested quantity"
            )
        cart.items[existing_item_index].quantity = new_quantity
    else:
        # Add new item
        new_item = CartItem(
            product_id=product_id_obj,
            quantity=request.quantity,
            price=price
        )
        cart.items.append(new_item)
    
    # Update total
    cart.total_amount = await calculate_cart_total(cart)
    cart.updated_at = datetime.utcnow()
    
    # Update in database
    cart_dict = cart.dict()
    cart_dict["_id"] = cart_dict.pop("id")
    await carts_collection.replace_one(
        {"_id": cart_dict["_id"]},
        cart_dict
    )
    
    return ResponseModel(
        message="Item added to cart successfully",
        data={"cart": cart.dict()}
    )

@router.put("/update/{product_id}", response_model=ResponseModel)
async def update_cart_item(
    product_id: str,
    quantity: int,
    current_user: User = Depends(get_current_active_user)
):
    """Update quantity of item in cart"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    if quantity <= 0:
        # Remove item if quantity is 0 or less
        return await remove_from_cart(product_id, current_user)
    
    # Get cart
    cart = await get_or_create_cart(str(current_user.id))
    carts_collection = await get_carts_collection()
    
    # Find item in cart
    product_id_obj = ObjectId(product_id)
    item_found = False
    for item in cart.items:
        if item.product_id == product_id_obj:
            # Check stock
            products_collection = await get_products_collection()
            product = await products_collection.find_one({"_id": product_id_obj})
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            if product.get("stock_quantity", 0) < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient stock"
                )
            
            item.quantity = quantity
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in cart"
        )
    
    # Update total
    cart.total_amount = await calculate_cart_total(cart)
    cart.updated_at = datetime.utcnow()
    
    # Update in database
    cart_dict = cart.dict()
    cart_dict["_id"] = cart_dict.pop("id")
    await carts_collection.replace_one(
        {"_id": cart_dict["_id"]},
        cart_dict
    )
    
    return ResponseModel(
        message="Cart item updated successfully",
        data={"cart": cart.dict()}
    )

@router.delete("/remove/{product_id}", response_model=ResponseModel)
async def remove_from_cart(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Remove item from cart"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Get cart
    cart = await get_or_create_cart(str(current_user.id))
    carts_collection = await get_carts_collection()
    
    # Remove item from cart
    product_id_obj = ObjectId(product_id)
    original_length = len(cart.items)
    cart.items = [item for item in cart.items if item.product_id != product_id_obj]
    
    if len(cart.items) == original_length:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in cart"
        )
    
    # Update total
    cart.total_amount = await calculate_cart_total(cart)
    cart.updated_at = datetime.utcnow()
    
    # Update in database
    cart_dict = cart.dict()
    cart_dict["_id"] = cart_dict.pop("id")
    await carts_collection.replace_one(
        {"_id": cart_dict["_id"]},
        cart_dict
    )
    
    return ResponseModel(
        message="Item removed from cart successfully",
        data={"cart": cart.dict()}
    )

@router.delete("/clear", response_model=ResponseModel)
async def clear_cart(current_user: User = Depends(get_current_active_user)):
    """Clear all items from cart"""
    cart = await get_or_create_cart(str(current_user.id))
    carts_collection = await get_carts_collection()
    
    cart.items = []
    cart.total_amount = 0.0
    cart.updated_at = datetime.utcnow()
    
    # Update in database
    cart_dict = cart.dict()
    cart_dict["_id"] = cart_dict.pop("id")
    await carts_collection.replace_one(
        {"_id": cart_dict["_id"]},
        cart_dict
    )
    
    return ResponseModel(
        message="Cart cleared successfully",
        data={"cart": cart.dict()}
    )