import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY environment variable is not set")
        _client = Groq(api_key=api_key)
    return _client

def call_groq(prompt: str, system_prompt: str, max_tokens: int = 1500) -> str:
    client = _get_client()
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            if attempt == 1:
                raise Exception(f"GROQ_FAILURE: {str(e)}")
            continue
