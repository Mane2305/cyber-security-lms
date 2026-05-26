from pydantic import BaseModel
from typing import Optional, List

class QuizStartRequest(BaseModel):
    module_id: str

class AnswerSubmitRequest(BaseModel):
    attempt_id: str
    answers: List[int]  # exactly 5 integers, each 0-3

class QuestionResponse(BaseModel):
    question_number: int
    question_text: str
    options: List[str]  # exactly 4 options
    hint: Optional[str] = None

class QuizStartResponse(BaseModel):
    attempt_id: str
    module_id: str
    questions: List[QuestionResponse]

class QuestionResult(BaseModel):
    question_number: int
    correct: bool
    correct_option_index: int
    explanation: str

class QuizSubmitResponse(BaseModel):
    attempt_id: str
    module_id: str
    score: int
    passed: bool
    pass_threshold: int
    correct_count: int
    total_questions: int
    results: List[QuestionResult]
    weak_area_feedback: Optional[str] = None
    badge_unlocked: bool
    next_module_unlocked: Optional[str] = None
    certificate_eligible: bool
