# LegalMate - AI-Powered Legal Consultation Platform

A comprehensive legal consultation platform focused on Punjab laws in Pakistan, featuring AI chatbot assistance, lawyer search and booking, real-time consultations, and role-based authentication.

## 🚀 Features

- **AI Legal Assistant**: NLP-powered chatbot for instant legal guidance
- **Lawyer Search & Booking**: Find and book verified lawyers
- **Real-time Consultations**: Video calls and chat with lawyers
- **Role-based Authentication**: Client, Lawyer, and Admin roles
- **Secure Platform**: JWT authentication and data encryption
- **Modern UI**: Responsive design with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **Axios** for API calls
- **Socket.io** for real-time features

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Multer** for file uploads
- **Bcrypt** for password hashing

### AI Backend
- **Flask** with Python
- **NLTK** and **scikit-learn** for NLP
- **Punjab Legal Knowledge Base**
- **Similarity scoring** for responses

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (v4.4 or higher)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LegalMate
```

### 2. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

#### AI Backend
```bash
cd ../ai-backend
pip install -r requirements.txt
```

### 3. Environment Setup

#### Backend Environment (.env)
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legalmate
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### Frontend Environment (.env)
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:5001
```

### 4. Database Setup

#### Start MongoDB
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

#### Seed Database
```bash
cd backend
node seed-data.js
```

### 5. Start All Services

#### Terminal 1: AI Backend
```bash
cd ai-backend
python app.py
```
AI Backend will run on: http://localhost:5001

#### Terminal 2: Node.js Backend
```bash
cd backend
npm start
```
Backend will run on: http://localhost:5000

#### Terminal 3: React Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:3000

## 🧪 Testing the Setup

1. **Visit the Test Page**: http://localhost:3000/test
2. **Check API Health**: http://localhost:5000/api/health
3. **Test AI Chatbot**: http://localhost:5001/chat

## 📁 Project Structure

```
LegalMate/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # State management
│   │   └── App.jsx         # Main app component
│   └── package.json
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js           # Main server file
├── ai-backend/             # Flask AI backend
│   ├── app.py              # Main Flask app
│   ├── chatbot.py          # AI chatbot logic
│   └── requirements.txt    # Python dependencies
└── README.md
```

## 🔐 Authentication & Roles

### User Roles
- **Client**: Can search lawyers, book consultations, use AI chatbot
- **Lawyer**: Can manage profile, appointments, consultations
- **Admin**: Can verify lawyers, moderate content, view analytics

### Sample Users
After running the seed script, you can login with:

**Client:**
- Email: client@example.com
- Password: password123

**Lawyer:**
- Email: lawyer@example.com
- Password: password123

**Admin:**
- Email: admin@example.com
- Password: password123

## 🚀 Key Features Implementation

### 1. AI Chatbot
- NLP processing with NLTK
- Punjab legal knowledge base
- Confidence scoring
- Lawyer referral system

### 2. Lawyer Search
- Advanced filtering (specialization, location, price)
- Real-time search results
- Lawyer profiles with ratings

### 3. Booking System
- Appointment scheduling
- Video consultation setup
- Payment integration ready

### 4. Real-time Features
- Socket.io for live chat
- WebRTC for video calls
- Real-time notifications

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh
# If not running, start it:
mongod
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
```

#### 3. Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. AI Backend Issues
```bash
# Install Python dependencies
pip install -r requirements.txt
# Check Python version
python --version
```

### Debug Mode

Visit http://localhost:3000/test for comprehensive system diagnostics.

## 🔧 Development

### Adding New Features

1. **Frontend Components**: Add to `frontend/src/components/`
2. **Pages**: Add to `frontend/src/pages/`
3. **API Routes**: Add to `backend/routes/`
4. **Database Models**: Add to `backend/models/`

### Code Style

- Use ESLint and Prettier for code formatting
- Follow React best practices
- Use TypeScript for better type safety (optional)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Lawyers
- `GET /api/lawyers/search` - Search lawyers
- `GET /api/lawyers/:id` - Get lawyer profile
- `PUT /api/lawyers/:id` - Update lawyer profile

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - List appointments
- `PUT /api/appointments/:id` - Update appointment

### AI Chatbot
- `POST /ai/chat` - Send message to AI
- `GET /ai/health` - AI service health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the test page for diagnostics
- Review the troubleshooting section

---

**LegalMate** - Making legal consultation accessible and intelligent. 