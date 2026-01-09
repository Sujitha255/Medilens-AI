from dotenv import load_dotenv
import os
import google.generativeai as genai

print("--- DIAGNOSTIC START ---")

# 1. Test Dotenv
load_dotenv()
key = os.environ.get("GEMINI_API_KEY")

if not key:
    print("❌ ERROR: GEMINI_API_KEY could not be loaded from .env")
    print(f"Current Directory: {os.getcwd()}")
    print("Files in dir:", os.listdir())
else:
    print(f"✅ Success: Found API Key (starts with {key[:5]}...)")

    # 2. Test Gemini API
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say 'Gemini is working' if you hear me.")
        print(f"✅ API Response: {response.text.strip()}")
    except Exception as e:
        print(f"❌ API Connection Failed: {e}")

print("--- DIAGNOSTIC END ---")
