"""D-13: Team.leader_id field."""
from app.domain.entities.team import Team


def test_leader_id_default_is_none():
    t = Team(name="Team", owner_id=1)
    assert t.leader_id is None


def test_leader_id_accepts_int():
    t = Team(name="Team", owner_id=1, leader_id=42)
    assert t.leader_id == 42
