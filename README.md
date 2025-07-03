# 🛒 Full-Stack eCommerce Application

A comprehensive eCommerce platform built with React.js, FastAPI, and MongoDB featuring role-based authentication, shopping cart, wishlist, coupon system, and admin panel.

## 🚀 Features

### ✅ Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT-based with role management

### 👤 Authentication System
- **Role-based access control** (Admin & Customer)
- **JWT token authentication**
- **Secure password hashing** with bcrypt
- **Protected routes** and admin-only areas

### 🛍️ Core Features
- **Product Listing** with search and filtering
- **Product Categories** and detailed product views
- **Shopping Cart** with persistent sessions
- **Wishlist** functionality
- **Discount/Coupon System** with validation
- **Order Management** and history
- **Share Products** via social media and links

### 🎛️ Admin Panel
- **Dashboard** with sales analytics
- **Product CRUD** operations
- **User Management** and role assignment
- **Order Status** updates
- **Coupon Management** with expiry and usage limits

### 📱 Responsive Design
- **Mobile-friendly** responsive UI
- **Modern design** with Tailwind CSS
- **Loading states** and error handling
- **Toast notifications** for user feedback

## 🏗️ Project Structure

```
ecommerce-app/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── models.py       # Pydantic models
│   │   ├── database.py     # MongoDB connection
│   │   └── auth.py         # Authentication utilities
│   ├── main.py             # FastAPI application entry
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container config
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React context providers
│   └── App.js             # Main application component
├── public/                # Static assets
├── docker-compose.yml     # Multi-service orchestration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) (v16+ if running locally)
- [Python](https://www.python.org/) (v3.8+ if running locally)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce-app
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Start MongoDB (using Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Run the backend
uvicorn main:app --reload
```

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=ecommerce
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 👥 Default Accounts

### Create Admin User
After starting the backend, create an admin user:

```bash
curl -X POST "http://localhost:8000/api/auth/create-admin" \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@example.com",
  "password": "admin123",
  "full_name": "Admin User",
  "phone": "+1234567890"
}'
```

### Demo Credentials
- **Admin**: admin@example.com / admin123
- **Customer**: user@example.com / user123

## 📊 API Documentation

The backend provides interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (Admin only)

#### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/orders/create` - Create order from cart

#### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `PUT /api/orders/{id}/status` - Update order status

## 🧪 Sample Data

The application includes sample data:
- **5 products** across different categories
- **2 sample coupons** (WELCOME10, SAVE25)
- **Product categories**: Electronics, Clothing, Books, Home, Sports, Beauty, Toys

## 🛠️ Development

### Adding New Features

1. **Backend**: Add new routes in `backend/app/routers/`
2. **Frontend**: Create components in `src/components/`
3. **Database**: Update models in `backend/app/models.py`

### Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
npm test
```

### Building for Production
```bash
# Build frontend
npm run build

# Backend is ready for production with uvicorn
```

## 🚀 Deployment

### Docker Production
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. **Frontend**: Build and serve static files
2. **Backend**: Deploy with gunicorn or uvicorn
3. **Database**: Use MongoDB Atlas or self-hosted MongoDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [API documentation](http://localhost:8000/docs)
2. Review the logs: `docker-compose logs`
3. Open an issue on GitHub

## 🔄 Updates & Roadmap

### Completed Features
- ✅ User authentication and authorization
- ✅ Product catalog with search/filter
- ✅ Shopping cart functionality
- ✅ Order management system
- ✅ Admin dashboard
- ✅ Coupon/discount system
- ✅ Responsive design

### Future Enhancements
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

---

**Happy Shopping! 🛍️**
