import json
import random
from services.groq_service import call_groq

SYSTEM_PROMPT = """You are a cybersecurity training quiz generator for Group SNS, a corporate organization with employees across IT, Finance, HR, Operations, Sales, Customer Support, Legal, and remote teams. You generate scenario-based multiple choice questions for corporate employees.

The course modules are short, usually only 3 slides. The quiz should reinforce learning from those slides, not feel like a hard certification exam. A typical employee should be able to pass within the 1-minute timer if they understood the slides.

Rules:
- Generate exactly 5 questions
- Each question must be a realistic workplace scenario, not a textbook definition question
- Difficulty must be easy-medium: useful for learning, but not tricky
- Use this difficulty mix: 3 easy questions and 2 medium questions
- Each question must be answerable in about 60 seconds
- Keep each question to 1 short scenario paragraph, preferably 18-35 words
- Keep each option short and plain, preferably 5-10 words
- Use one clearly safest answer and three clearly less-safe distractors
- Wrong options should be obviously unsafe, incomplete, or missing verification
- Avoid trick wording, double negatives, vague absolutes, and options that are both partially correct
- Do not make options differ only by tiny wording changes
- Do not ask about details that are not directly taught in the module slides
- Do not require legal, compliance, or technical knowledge beyond the provided slides
- Do not make the employee choose between two policies that both sound reasonable
- Do not combine an attack type and response in the same question unless the slide explicitly teaches both together
- Prefer "what should you do next?" over "what is this called?"
- Make every question feel specific to Group SNS workplace situations, systems, teams, vendors, projects, travel, payroll, customer data, internal tools, or approvals
- Use varied employees, departments, channels, and artifacts across the 5 questions
- Avoid generic consumer-only examples like personal bank alerts unless the module specifically requires financial scam context
- Do not repeat the same scenario setup, wording, sender, department, or correct option pattern across questions
- Do not reuse or lightly rephrase any previous questions listed in the prompt
- Each question has exactly 4 options
- Exactly one option is correct
- correct_answer_index is 0, 1, 2, or 3 (zero-indexed)
- explanation is 1-2 sentences explaining why the correct answer is right
- hint is a short nudge that helps without giving away the answer
- explanation should teach the main lesson in simple language and reassure the learner
- Questions must be based strictly on the module content provided
- Response must be valid JSON only, no extra text, no markdown, no code fences

Output this exact JSON structure:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer_index": 0,
      "explanation": "string",
      "hint": "string"
    }
  ]
}"""

GROUP_SNS_CONTEXTS = [
    "a payroll change request in HR",
    "a vendor invoice update in Finance",
    "a customer data export in Sales",
    "a laptop used during business travel",
    "a Teams message from a manager",
    "a shared document in the company drive",
    "a support ticket from the IT helpdesk",
    "a new supplier onboarding workflow",
    "a remote employee using hotel Wi-Fi",
    "an urgent executive approval request",
    "a USB device found near a Group SNS office",
    "a confidential client presentation",
    "an operations dashboard login",
    "a delivery notification for office equipment",
    "a cloud storage folder with restricted data",
    "a voice call claiming to be from Group SNS IT",
]

QUESTION_FOCUS_TYPES = [
    "ask for the safest first action",
    "ask which obvious detail is the strongest red flag",
    "ask which verification channel should be used",
    "ask what simple policy or principle applies",
    "ask what the employee should report or escalate",
    "ask which action is clearly unsafe",
    "ask how to handle the request without using attacker-provided contact details",
    "ask what evidence should make the employee slow down and verify",
]

MODULE_VARIETY_GUIDANCE = {
    "module_01_phishing": "Focus on Group SNS email, shared docs, fake IT notices, vendor messages, calendar invites, and login pages.",
    "module_02_passwords": "Focus on password reuse, password managers, MFA prompts, shared accounts, admin portals, and credential stuffing.",
    "module_03_malware": "Focus on attachments, downloads, fake utilities, ransomware symptoms, update prompts, and backup choices.",
    "module_04_vishing": "Focus on phone calls, SMS, delivery texts, helpdesk impersonation, caller verification, and callback safety.",
    "module_05_physical_security": "Focus on office desks, travel, public spaces, public Wi-Fi, shoulder surfing, and unattended devices.",
    "module_06_data_handling": "Focus on PII, financial files, client records, need-to-know sharing, approved storage, and secure disposal.",
    "module_07_social_engineering": "Focus on CEO fraud, pretexting, baiting, AI voice cloning, unusual approvals, and second-channel verification.",
    "module_08_financial_scams": "Focus on invoice fraud, payroll diversion, vendor bank changes, crypto scams, investment pressure, and finance approvals.",
}

def _pick_contexts(variation_seed: str) -> list:
    rng = random.Random(variation_seed)
    return rng.sample(GROUP_SNS_CONTEXTS, 5)

def _build_blueprint(variation_seed: str) -> str:
    rng = random.Random(f"blueprint-{variation_seed}")
    contexts = rng.sample(GROUP_SNS_CONTEXTS, 5)
    focus_types = rng.sample(QUESTION_FOCUS_TYPES, 5)
    difficulty_levels = ["easy", "easy", "easy", "medium", "medium"]
    rng.shuffle(difficulty_levels)
    correct_indices = [0, 1, 2, 3, rng.choice([0, 1, 2, 3])]
    rng.shuffle(correct_indices)
    rows = []
    for index, (context, focus, difficulty, correct_index) in enumerate(
        zip(contexts, focus_types, difficulty_levels, correct_indices),
        start=1
    ):
        rows.append(
            f"{index}. Scenario anchor: {context}; difficulty: {difficulty}; question focus: {focus}; required correct_answer_index: {correct_index}"
        )
    return "\n".join(rows)

def _normalize_question(text: str) -> str:
    return " ".join(text.lower().split())

def _has_repeated_questions(questions: list, previous_questions: list) -> bool:
    seen = set()
    previous = {_normalize_question(q) for q in previous_questions}
    for question in questions:
        normalized = _normalize_question(question["question_text"])
        if normalized in seen or normalized in previous:
            return True
        seen.add(normalized)
    return False

def _word_count(text: str) -> int:
    return len(str(text).split())

def _has_overly_complex_questions(questions: list) -> bool:
    for question in questions:
        if _word_count(question.get("question_text", "")) > 45:
            return True
        for option in question.get("options", []):
            if _word_count(option) > 14:
                return True
    return False

def generate_quiz_questions(
    module_id: str,
    module_content: str,
    attempt_number: int = 1,
    variation_seed: str = "",
    previous_questions: list = None
) -> list:
    previous_questions = previous_questions or []
    seed = variation_seed or f"{module_id}-{attempt_number}"
    blueprint = _build_blueprint(seed)
    guidance = MODULE_VARIETY_GUIDANCE.get(module_id, "Use varied Group SNS workplace scenarios.")

    previous_block = "\n".join([f"- {question}" for question in previous_questions[:15]]) or "- None"

    prompt = f"""Generate 5 quiz questions for this cybersecurity training module.

Module ID: {module_id}
Attempt Number: {attempt_number}
Variation Seed: {seed}

Company Context:
The employee works at Group SNS. Write questions as if they happen inside Group SNS, using realistic departments, systems, managers, vendors, internal files, and work communication channels.

Difficulty and timing:
- The employee has only 60 seconds per question.
- Assume they just studied a short 3-slide lesson.
- Make the correct answer easy to recognize if they understood the slides.
- Make distractors realistic mistakes, but not so similar that two options feel correct.
- Prefer practical "what should you do next?" scenarios over deep technical edge cases.
- Ask about one idea per question, directly tied to one slide takeaway.
- Prefer everyday workplace language over security terminology.
- Avoid niche security jargon unless the module content explicitly uses it.
- Do not combine multiple concepts into one question.
- For easy questions, test one direct slide takeaway.
- For medium questions, use a simple workplace scenario with one clear red flag or safe action.
- Options should usually follow this pattern: safest action, risky shortcut, passive/delayed action, attacker-trusting action. Shuffle according to required correct_answer_index.
- Keep question text under 45 words.
- Keep every option under 14 words.

Use this exact generation blueprint, one row per question. Respect each required correct_answer_index:
{blueprint}

Module-specific variety guidance:
{guidance}

Previous questions to avoid repeating or rephrasing:
{previous_block}

Module Content:
{module_content}"""
    
    raw = call_groq(prompt, SYSTEM_PROMPT, max_tokens=2200)
    
    # Strip any accidental markdown fences
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()
    
    parsed = json.loads(clean)
    questions = parsed["questions"]
    
    if len(questions) != 5:
        raise Exception("GROQ_FAILURE: Did not return exactly 5 questions")
    
    for i, q in enumerate(questions):
        if len(q["options"]) != 4:
            raise Exception(f"GROQ_FAILURE: Question {i+1} does not have exactly 4 options")
        if q["correct_answer_index"] not in [0, 1, 2, 3]:
            raise Exception(f"GROQ_FAILURE: Question {i+1} has invalid correct_answer_index")

    if _has_repeated_questions(questions, previous_questions):
        raise Exception("GROQ_FAILURE: Generated repeated questions")
    if _has_overly_complex_questions(questions):
        raise Exception("GROQ_FAILURE: Generated overly complex questions")
    
    return questions
