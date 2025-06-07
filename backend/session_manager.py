import uuid
import random


from models import SessionSettings, TapInput, TimeoutInput

POINTS_TO_WIN_SET = 5

#Dictonary to store active sessions
sessions = {}


def create_session(settings: SessionSettings):
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "settings": settings,
        "current_set": 1,       #current set(starts at 1st set)
        "current_shot": 0,      #Shot number inside current rally(starts at 0 shots)
        "shots_converted": 0,    #Total shots player has hit in current rally
        "player_points": 0,     #points player has won in current set
        "opponent_points": 0,   #points player has dropped by missing their shots
        "paused": False,
        "awaiting_player_tap": False, #is a target waiting for user tap?
        "current_target": None     #zone Number for validation

    }

    return session_id


def get_next_shot(session_id: str):
    #retrieve the session
    session = sessions.get(session_id)

    if not session:
        raise ValueError("Invalid session id") #exception handling if the session doesn't exist

    #gets settings from the SessionSettings pydantic model in models.py
    settings  = session["settings"]
    total_shots = settings.num_shots
    total_sets = settings.num_sets

    #checks if session is already over
    if session["current_set"] > total_sets:
        return{"status": "completed"}

    #can't send new shot if waiting for user tap
    if session["awaiting_player_tap"]:
        return {"status": "wait_for_tap"}

    #updates shot number
    session["current_shot"] += 1
    shot_number = session["current_shot"]

    #checks if set is completed
    if shot_number > total_shots:
        session["current_set"] += 1
        session["current_shot"] = 0
        return {
            "status": "set_complete",
            "set_number": session["current_set"] - 1,
            "message": "Set finished. Rest time begins."
        }

    #else, returns next shot
    target_zone = random.randint(1, 6)
    session["awaiting_player_tap"] = True
    session["current_target"] = target_zone

    return {
        "status": "ok",
        "target_zone": target_zone,
        "shot_number": shot_number,
        "set_number": session["current_set"]
    }


def handle_tap(tap: TapInput):
    session = sessions.get(tap.session_id)
    if not session:
        raise ValueError("Invalid session id")

    if not session["awaiting_player_tap"]:
        return {"status": "no_active_target"}

    #clear target and mark that there's no more waiting
    session["awaiting_player_tap"] = False
    expected_zone = session["current_target"]
    session["current_target"] = None

    #CASE 1: CORRECT TAP
    if tap.clicked_zone == expected_zone:
        session["rally_successes"] += 1 #Rally Success: Player survives the shot

        if session["rally_successes"] == session["settings"].num_shots:
            #ALL SHOTS COVERED WITHIN RALLY -> PLAYER WINS A POINT
            session["player_points"] += 1
            session["rally_successes"] = 0
            session["current_shot"] = 0

            #checks if the set is now complete
            if session["player_points"] >= POINTS_TO_WIN_SET:
                session["current_set"] += 1
                session["player_points"] = 0
                session["opponent_points"] = 0
                return {"status": "set_won"}

            return {"status": "point_won"}

        return {"status": "correct", "rally_progress": session["rally_successes"]}

    #Case 2: INCORRECT TAP
    session["opponent_points"] += 1
    session["rally_successes"] = 0
    session["current_shot"] = 0

    # Check if opponent just won the set
    if session["opponent_points"] >= POINTS_TO_WIN_SET:
        session["current_set"] += 1
        session["player_points"] = 0
        session["opponent_points"] = 0
        return {"status": "set_lost"}

    return {"status": "mistake", "message": "Incorrect tap. Opponent gains point."}


def handle_timeout(timeout: TimeoutInput):
    print("[DEBUG] All session keys at timeout:", list(sessions.keys()))
    print(f"[DEBUG] Timeout for session_id: {timeout.session_id}")
    session = sessions.get(timeout.session_id)
    if not session:
        raise ValueError("Invalid session ID")

    # No active shot to timeout
    if not session["awaiting_player_tap"]:
        return {"status": "no_active_target"}

    # Reset the target and rally state
    session["awaiting_player_tap"] = False
    session["current_target"] = None
    session["current_shot"] = 0
    session["rally_successes"] = 0

    # Award point to opponent
    session["opponent_points"] += 1

    # Check if opponent wins the set
    if session["opponent_points"] >= POINTS_TO_WIN_SET:
        session["current_set"] += 1
        session["player_points"] = 0
        session["opponent_points"] = 0
        return {"status": "set_lost", "reason": "timeout"}

    return {"status": "rally_failed", "reason": "timeout", "opponent_point": True}


def get_session_status(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise ValueError("Invalid session ID")

    settings = session["settings"]

    # Check if the session is over
    session_complete = session["current_set"] > settings.num_sets

    return {
        "session_id": session_id,
        "current_set": session["current_set"],
        "player_points": session["player_points"],
        "opponent_points": session["opponent_points"],
        "awaiting_player_tap": session["awaiting_player_tap"],
        "current_shot": session["current_shot"],
        "total_shots_per_rally": settings.num_shots,
        "total_sets": settings.num_sets,
        "session_complete": session_complete
    }


def restart_session(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise ValueError("Invalid session ID")

    settings = session["settings"]

    # Reset all session state except settings
    sessions[session_id] = {
        "settings": settings,
        "current_set": 1,
        "current_shot": 0,
        "shots_converted": 0,
        "player_points": 0,
        "opponent_points": 0,
        "paused": False,
        "awaiting_player_tap": False,
        "current_target": None
    }

    return {
        "status": "session_restarted",
        "session_id": session_id
    }
