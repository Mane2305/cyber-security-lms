from pydantic import BaseModel
from typing import List, Optional

class SlideModel(BaseModel):
    slide_number: int
    heading: str
    body: str
    key_points: List[str]

class ModuleListItem(BaseModel):
    id: str
    title: str
    description: str
    slide_count: int
    status: str
    badge_earned: bool
    quiz_best_score: Optional[int] = None
    order: int

class ModuleDetail(BaseModel):
    id: str
    title: str
    order: int
    slides: List[SlideModel]
