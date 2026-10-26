import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

if not url or not key:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Real database connection will fail.")

def get_supabase() -> Client:
    # Always create a new client or rely on singleton if you want
    # using service_role key to bypass RLS, OR user's JWT to enforce RLS
    # Since we need to insert records, and right now the backend might not have the user's JWT
    # we should either pass the user's access token, or use the service_role key to write to DB
    # The user provided a PUBLISHABLE_KEY which is usually the 'anon' key.
    # The 'anon' key cannot bypass RLS. Our RLS policies require the user to be an authenticated org member.
    # We will need the Authorization header from the frontend.
    return create_client(url, key)

def get_supabase_with_token(access_token: str) -> Client:
    client = create_client(url, key)
    client.auth.set_session(access_token, "dummy-refresh-token") # The client just needs the JWT
    # Actually supabase-py uses client.options.headers to set auth
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    return client
