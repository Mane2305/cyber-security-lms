from services.groq_service import call_groq

def generate_assistant_response(module_id: str, module_content: str, employee_question: str) -> str:
    system_prompt = f"""You are a cybersecurity training assistant helping an employee understand the current lesson.

You must only answer questions related to the module content provided.
If the question is unrelated to the module content, say: "That question is outside the scope of this module. Please focus on the current lesson."

Be conversational, clear, and concise. Maximum 3 sentences in your response.

Module content:
{module_content}"""

    try:
        return call_groq(employee_question, system_prompt, max_tokens=300)
    except:
        return "I am having trouble answering right now. Please try again in a moment."
