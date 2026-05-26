import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def call_groq(prompt: str, system_prompt: str, max_tokens: int = 1500) -> str:
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
