
import os
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="ErrorBuddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq() if os.getenv("GROQ_API_KEY") else None


class ErrorRequest(BaseModel):
    language: str
    source_code: str = ""
    error_message: str = ""


@app.get("/")
def home():
    return {"message": "Welcome to ErrorBuddy API!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze")
def analyze(request: ErrorRequest):
    language = request.language.strip()
    source_code = request.source_code.strip()
    error = request.error_message.strip()

    if not source_code and not error:
        return {
            "error_type": "Invalid input",
            "explanation": "Please provide source code or an error message.",
            "possible_causes": ["Both input fields are empty."],
            "suggested_fix": "Paste your source code or error message and try again.",
            "corrected_example": "",
        }

    if client:
        try:
            completion = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {
                        "role": "system",
                        "content": """

You are ErrorBuddy, a friendly programming tutor.

Analyze the user's source code and error message.
Explain programming errors simply for beginners.

Return ONLY valid JSON with these keys:
error_type: string
explanation: string
possible_causes: array of strings
suggested_fix: string
corrected_example: string

Instructions:
- Use the programming language selected by the user.
- Analyze the complete source code when provided.
- Use the error message along with the code when available.
- If only code is provided, look for likely syntax, runtime,
  and logical errors.
- If multiple errors exist, explain the most important ones.
- Do not invent errors or unsupported details.
- If no obvious error is found, use exactly:
  error_type: "No obvious error found"
- When no obvious error is found, explain that the code
  appears syntactically correct based on the provided information.
- In that case, use a possible_causes array containing:
  "No obvious error was detected in the provided code."
- In that case, use suggested_fix:
  "No changes are needed based on the available information."
- In that case, set corrected_example to an empty string.
- Do not assume the intended output when checking logic.
- If more context is needed, clearly mention it.
- Provide corrected code when an error is identified.
- Do not claim that code was executed or tested.
"""
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Programming language: {language}\n\n"
                            f"Source code:\n{source_code or 'Not provided'}\n\n"
                            f"Error message:\n{error or 'Not provided'}"
                        ),
                    },
                ],
                temperature=0.2,
                max_completion_tokens=1200,
                response_format={"type": "json_object"},
            )

            content = completion.choices[0].message.content
            result = json.loads(content)

            required_keys = [
                "error_type",
                "explanation",
                "possible_causes",
                "suggested_fix",
                "corrected_example",
            ]

            if all(key in result for key in required_keys):
                return result

        except Exception as exc:
            print(f"Groq AI request failed: {exc}")

    return {
        "error_type": "AI temporarily unavailable",
        "explanation": (
            "ErrorBuddy could not get an AI response. "
            "Please try again shortly."
        ),
        "possible_causes": [
            "The AI service may be temporarily unavailable.",
            "The API key or usage limit may need checking.",
        ],
        "suggested_fix": (
            "Check your backend terminal and Groq API status, "
            "then try again."
        ),
        "corrected_example": "",
    }
