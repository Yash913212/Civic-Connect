# CivicConnect Auth API (FastAPI)

## Prerequisites
- Python 3.10+
- PostgreSQL server running locally or externally.

## Setup Instructions

1. **Database**
   Ensure PostgreSQL is running and you have created a database called `civicconnect`.
   You can change the `DATABASE_URL` in `app/core/config.py` to match your DB credentials.

2. **Virtual Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Seed Database (Initial Admin & Officer)**
   ```bash
   export PYTHONPATH=.
   python seeder.py
   ```

5. **Run the API**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   
The frontend is already configured to point to `http://localhost:8000/api`!
