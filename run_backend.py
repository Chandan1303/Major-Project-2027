"""
Sugarcane Decision Support System — Python Flask Backend Server Runner
Usage: python run_backend.py
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🌾 Starting AI-Based Sugarcane Decision Support Flask API on http://127.0.0.1:{port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
