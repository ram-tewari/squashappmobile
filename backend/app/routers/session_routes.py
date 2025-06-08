from fastapi import APIRouter, HTTPException
from backend.app.schemas.session_models import SessionSettings, TapInput, TimeoutInput
from backend.app.services.session_service import (
    create_session,
    get_next_shot,
    handle_tap,
    handle_timeout,
    get_session_status,
    restart_session
)

router = APIRouter()

#Starts the Squash Training Session
@router.post("/start-session")
def start_session(settings: SessionSettings):
    session_id = create_session(settings)
    return {"session_id": session_id}

#adds next shot(either to start the game, or after next shot is played)
@router.get("/next-shot/{session_id}")
def next_shot(session_id: str):
    try:
        return get_next_shot(session_id)
    except ValueError:
        raise HTTPException(404, "session_not_found")

#gives points based on whether shot was tapped or not
@router.post("/tap-shot")
def tap_shot(tap: TapInput):
    try:
        return handle_tap(tap)
    except ValueError:
        raise HTTPException(404, "session_not_found")

#gives point to opponent if nothing is clicked within alloted time
@router.post("/timeout-shot")
def timeout_shot(timeout: TimeoutInput):
    try:
        return handle_timeout(timeout)
    except ValueError:
        raise HTTPException(404, "session_not_found")


#finds the session status
@router.get("/session-status/{session_id}")
def session_status(session_id: str):
    try:
        return get_session_status(session_id)
    except ValueError:
        raise HTTPException(404, "session_not_found")


#restarts the session based on the same parameters
@router.post("/restart-session/{session_id}")
def restart(session_id: str):
    try:
        return restart_session(session_id)
    except ValueError:
        raise HTTPException(404, "session_not_found")
