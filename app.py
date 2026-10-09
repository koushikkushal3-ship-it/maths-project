"""
Restaurant Customer Behavior Analysis - Python Web Application
Run locally: python app.py
"""

import sys
import os

# Add api directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.index import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Python Flask server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
