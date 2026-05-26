from services.groq_service import call_groq

SYSTEM_PROMPT = """You are a cybersecurity training coach giving personalized feedback to an employee who failed a quiz.

Rules:
- Write exactly 2-3 sentences
- Name the specific concepts they missed based on the questions provided
- Be encouraging, not harsh
- Do not repeat the questions back
- Do not use bullet points
- Plain text only, no markdown"""

def generate_weak_area_feedback(wrong_questions: list) -> str:
    if not wrong_questions:
        return None
    
    questions_text = "\n".join([
        f"Question {q['question_number']}: {q['question_text']}"
        for q in wrong_questions
    ])
    
    prompt = f"The employee got these questions wrong:\n\n{questions_text}\n\nWrite 2-3 sentences of personalized feedback telling them what concepts to review."
    
    try:
        return call_groq(prompt, SYSTEM_PROMPT, max_tokens=200)
    except:
        return None
