import sys
import os

# Ensure backend path is configured for Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir) if os.path.basename(current_dir) == "api" else current_dir
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
