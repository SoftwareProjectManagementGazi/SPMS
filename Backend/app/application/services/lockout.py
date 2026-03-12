from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class LockoutEntry:
    attempts: int = 0
    locked_until: Optional[datetime] = None

_lockout_store: dict[int, LockoutEntry] = {}
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION_MINUTES = 15

def check_lockout(user_id: int) -> Optional[datetime]:
    """Returns locked_until if currently locked, else None."""
    entry = _lockout_store.get(user_id)
    if entry and entry.locked_until and datetime.utcnow() < entry.locked_until:
        return entry.locked_until
    return None

def record_failed_attempt(user_id: int) -> bool:
    """Increments attempt counter. Returns True if this attempt triggers a lock."""
    entry = _lockout_store.setdefault(user_id, LockoutEntry())
    entry.attempts += 1
    if entry.attempts >= LOCKOUT_THRESHOLD:
        entry.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        return True
    return False

def clear_lockout(user_id: int) -> None:
    _lockout_store.pop(user_id, None)
