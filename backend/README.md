# TULI Backend (FastAPI)

## Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sellers/register | Register a new seller |
| POST | /sellers/login | Seller login |
| GET | /products | Get all products (filter by seller_id or category) |
| POST | /products | Add a new product |
| DELETE | /products/{id} | Remove a product |

## Database
Uses SQLite locally (`tuli.db`). When ready to deploy, swap SQLite for Supabase (PostgreSQL) or Firebase.

## Deploy
- Backend: Railway.app or Render.com (free tier)
- Database: Supabase (free tier — 500MB)
- Images: Cloudinary (free tier — 25GB)
