#!/bin/bash

echo "🛒 eCommerce Application Setup Script"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create backend environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "✅ Backend .env file created"
fi

# Start all services
echo "🚀 Starting all services with Docker Compose..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Check if backend is running
echo "🔍 Checking backend health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "⚠️  Backend might be starting up. Please wait a moment."
fi

# Check if frontend is accessible
echo "🔍 Checking frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "⚠️  Frontend might be starting up. Please wait a moment."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Access points:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "👥 Demo accounts (create them via API):"
echo "   Admin:    admin@example.com / admin123"
echo "   Customer: user@example.com / user123"
echo ""
echo "📚 Create admin user:"
echo 'curl -X POST "http://localhost:8000/api/auth/create-admin" \'
echo '-H "Content-Type: application/json" \'
echo '-d '"'"'{"email": "admin@example.com", "password": "admin123", "full_name": "Admin User", "phone": "+1234567890"}'"'"
echo ""
echo "🔧 To stop all services:"
echo "   docker-compose down"
echo ""
echo "📖 For more information, check the README.md file"