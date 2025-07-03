from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.models import (
    Product, ProductCreate, ProductUpdate, ProductCategory, 
    User, ResponseModel
)
from app.auth import get_current_admin_user, get_current_active_user
from app.database import get_products_collection
from bson import ObjectId
import re

router = APIRouter()

@router.get("/", response_model=List[Product])
async def get_products(
    skip: int = Query(0, ge=0, description="Number of products to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of products to return"),
    category: Optional[ProductCategory] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)")
):
    """Get products with filtering, searching, and pagination"""
    products_collection = await get_products_collection()
    
    # Build query
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    
    if search:
        # Case-insensitive search in name, description, and tags
        search_regex = re.compile(search, re.IGNORECASE)
        query["$or"] = [
            {"name": search_regex},
            {"description": search_regex},
            {"tags": {"$in": [search_regex]}}
        ]
    
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["price"] = price_query
    
    # Sort configuration
    sort_direction = 1 if sort_order == "asc" else -1
    sort_config = [(sort_by, sort_direction)]
    
    # Execute query
    cursor = products_collection.find(query).sort(sort_config).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    return [Product(**product) for product in products]

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a specific product by ID"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    products_collection = await get_products_collection()
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return Product(**product)

@router.post("/", response_model=ResponseModel)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new product (Admin only)"""
    products_collection = await get_products_collection()
    
    # Create product document
    product_dict = product.dict()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    
    # Insert product
    result = await products_collection.insert_one(product_dict)
    
    # Get created product
    created_product = await products_collection.find_one({"_id": result.inserted_id})
    
    return ResponseModel(
        message="Product created successfully",
        data={"product": Product(**created_product).dict()}
    )

@router.put("/{product_id}", response_model=ResponseModel)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_admin_user)
):
    """Update a product (Admin only)"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    products_collection = await get_products_collection()
    
    # Check if product exists
    existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update document
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
    
    # Get updated product
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    
    return ResponseModel(
        message="Product updated successfully",
        data={"product": Product(**updated_product).dict()}
    )

@router.delete("/{product_id}", response_model=ResponseModel)
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a product (Admin only)"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    products_collection = await get_products_collection()
    
    # Check if product exists
    existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Soft delete by setting is_active to False
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return ResponseModel(message="Product deleted successfully")

@router.get("/categories/list", response_model=List[str])
async def get_categories():
    """Get all available product categories"""
    return [category.value for category in ProductCategory]

@router.get("/search/suggestions")
async def get_search_suggestions(q: str = Query(..., min_length=2)):
    """Get search suggestions based on product names"""
    products_collection = await get_products_collection()
    
    # Create regex for case-insensitive search
    search_regex = re.compile(f"^{re.escape(q)}", re.IGNORECASE)
    
    # Find matching product names
    cursor = products_collection.find(
        {"name": search_regex, "is_active": True},
        {"name": 1}
    ).limit(10)
    
    products = await cursor.to_list(length=10)
    suggestions = [product["name"] for product in products]
    
    return {"suggestions": suggestions}