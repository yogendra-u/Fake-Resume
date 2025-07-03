from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime

from app.models import (
    User, UserUpdate, Wishlist, WishlistItem, 
    Product, ResponseModel
)
from app.auth import get_current_active_user
from app.database import (
    get_users_collection, get_wishlists_collection, 
    get_products_collection
)
from bson import ObjectId

router = APIRouter()

@router.get("/profile", response_model=User)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get user profile"""
    return current_user

@router.put("/profile", response_model=ResponseModel)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update user profile"""
    users_collection = await get_users_collection()
    
    # Update document
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await users_collection.update_one(
            {"_id": ObjectId(str(current_user.id))},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await users_collection.find_one(
        {"_id": ObjectId(str(current_user.id))},
        {"hashed_password": 0}
    )
    
    return ResponseModel(
        message="Profile updated successfully",
        data={"user": User(**updated_user).dict()}
    )

async def get_or_create_wishlist(user_id: str) -> Wishlist:
    """Get existing wishlist or create new one for user"""
    wishlists_collection = await get_wishlists_collection()
    
    wishlist_data = await wishlists_collection.find_one({"user_id": ObjectId(user_id)})
    if wishlist_data:
        return Wishlist(**wishlist_data)
    
    # Create new wishlist
    new_wishlist = Wishlist(user_id=ObjectId(user_id))
    wishlist_dict = new_wishlist.dict()
    wishlist_dict["_id"] = wishlist_dict.pop("id")
    result = await wishlists_collection.insert_one(wishlist_dict)
    
    created_wishlist = await wishlists_collection.find_one({"_id": result.inserted_id})
    return Wishlist(**created_wishlist)

@router.get("/wishlist", response_model=List[Product])
async def get_wishlist(current_user: User = Depends(get_current_active_user)):
    """Get user's wishlist with product details"""
    wishlist = await get_or_create_wishlist(str(current_user.id))
    
    if not wishlist.items:
        return []
    
    # Get product details for wishlist items
    products_collection = await get_products_collection()
    product_ids = [item.product_id for item in wishlist.items]
    
    cursor = products_collection.find({"_id": {"$in": product_ids}, "is_active": True})
    products = await cursor.to_list(length=None)
    
    return [Product(**product) for product in products]

@router.post("/wishlist/{product_id}", response_model=ResponseModel)
async def add_to_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Add product to wishlist"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Validate product exists
    products_collection = await get_products_collection()
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    
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
    
    # Get or create wishlist
    wishlist = await get_or_create_wishlist(str(current_user.id))
    wishlists_collection = await get_wishlists_collection()
    
    # Check if product already in wishlist
    product_id_obj = ObjectId(product_id)
    for item in wishlist.items:
        if item.product_id == product_id_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product already in wishlist"
            )
    
    # Add product to wishlist
    new_item = WishlistItem(product_id=product_id_obj)
    wishlist.items.append(new_item)
    wishlist.updated_at = datetime.utcnow()
    
    # Update in database
    wishlist_dict = wishlist.dict()
    wishlist_dict["_id"] = wishlist_dict.pop("id")
    await wishlists_collection.replace_one(
        {"_id": wishlist_dict["_id"]},
        wishlist_dict
    )
    
    return ResponseModel(
        message="Product added to wishlist successfully",
        data={"product_name": product["name"]}
    )

@router.delete("/wishlist/{product_id}", response_model=ResponseModel)
async def remove_from_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Remove product from wishlist"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Get wishlist
    wishlist = await get_or_create_wishlist(str(current_user.id))
    wishlists_collection = await get_wishlists_collection()
    
    # Remove product from wishlist
    product_id_obj = ObjectId(product_id)
    original_length = len(wishlist.items)
    wishlist.items = [item for item in wishlist.items if item.product_id != product_id_obj]
    
    if len(wishlist.items) == original_length:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in wishlist"
        )
    
    wishlist.updated_at = datetime.utcnow()
    
    # Update in database
    wishlist_dict = wishlist.dict()
    wishlist_dict["_id"] = wishlist_dict.pop("id")
    await wishlists_collection.replace_one(
        {"_id": wishlist_dict["_id"]},
        wishlist_dict
    )
    
    return ResponseModel(message="Product removed from wishlist successfully")

@router.delete("/wishlist/clear", response_model=ResponseModel)
async def clear_wishlist(current_user: User = Depends(get_current_active_user)):
    """Clear all items from wishlist"""
    wishlist = await get_or_create_wishlist(str(current_user.id))
    wishlists_collection = await get_wishlists_collection()
    
    wishlist.items = []
    wishlist.updated_at = datetime.utcnow()
    
    # Update in database
    wishlist_dict = wishlist.dict()
    wishlist_dict["_id"] = wishlist_dict.pop("id")
    await wishlists_collection.replace_one(
        {"_id": wishlist_dict["_id"]},
        wishlist_dict
    )
    
    return ResponseModel(message="Wishlist cleared successfully")

@router.get("/wishlist/check/{product_id}")
async def check_in_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Check if product is in user's wishlist"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    wishlist = await get_or_create_wishlist(str(current_user.id))
    
    product_id_obj = ObjectId(product_id)
    in_wishlist = any(item.product_id == product_id_obj for item in wishlist.items)
    
    return {"in_wishlist": in_wishlist}

@router.post("/share/product/{product_id}")
async def share_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Generate shareable link for a product"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Validate product exists
    products_collection = await get_products_collection()
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    
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
    
    # Generate share URL (in real app, this would be your frontend URL)
    share_url = f"http://localhost:3000/products/{product_id}"
    
    # Generate social media share URLs
    product_name = product["name"]
    encoded_name = product_name.replace(" ", "%20")
    
    social_urls = {
        "facebook": f"https://www.facebook.com/sharer/sharer.php?u={share_url}",
        "twitter": f"https://twitter.com/intent/tweet?url={share_url}&text=Check%20out%20{encoded_name}",
        "whatsapp": f"https://wa.me/?text=Check%20out%20{encoded_name}%20{share_url}",
        "email": f"mailto:?subject={encoded_name}&body=Check%20out%20this%20product:%20{share_url}"
    }
    
    return {
        "product": {
            "id": str(product["_id"]),
            "name": product["name"],
            "price": product["price"]
        },
        "share_url": share_url,
        "social_urls": social_urls
    }