import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from .env")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is missing from .env")



# Server-side client
# Used ONLY for Storage and database operations
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# Separate client for user authentication
# This prevents login from changing the server-side client session
auth_client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)
