import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


from models import SessionSettings, TapInput, TimeoutInput
from session_manager import create_session, get_next_shot, handle_tap, handle_timeout, get_session_status, restart_session

app = FastAPI()

@app.get("")
async def root():
    return {"message": "Hello World"}

'''STORES SESSION INFORMATION(settings, current set, current shot, score, if the game is paused or not)'''
@app.post("/start-session")
def start_session(settings: SessionSettings):
    session_id = create_session(settings)
    return {"session_id": session_id}


@app.get("/next-shot/{session_id}")
def next_shot(session_id: str):
    try:
        result = get_next_shot(session_id)
        return result
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")


@app.post("/tap-shot")
def tap_shot(tap: TapInput):
    try:
        result = handle_tap(tap)
        return result
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

@app.post("/timeout-shot")
def timeout_shot(timeout: TimeoutInput):
    try:
        result = handle_timeout(timeout)
        return result
    except ValueError:
        raise HTTPException(404, "session_not_found")


@app.get("/session-status/{session_id}")
def session_status(session_id: str):
    try:
        return get_session_status(session_id)
    except ValueError:
        raise HTTPException(404, "session_not_found")


@app.post("/restart-session/{session_id}")
def restart(session_id: str):
    try:
        return restart_session(session_id)
    except ValueError:
        raise HTTPException(404, "session_not_found")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)