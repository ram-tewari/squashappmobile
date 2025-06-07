from pydantic import BaseModel

class SessionSettings(BaseModel):
    num_shots: int
    time_between_shots: float
    num_sets: int
    time_between_sets: float

class TapInput(BaseModel):
    session_id: str
    clicked_zone: int

class TimeoutInput(BaseModel):
    session_id: str
