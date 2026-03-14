import pytest


# TASK-06: Recurring Tasks — unit test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_completing_recurring_task_creates_next_instance():
    """Completing a recurring task automatically generates the next task instance in the series."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_end_date_reached_no_next_instance_created():
    """No new task instance is created when the recurrence end date has been reached."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_recurrence_count_exhausted_no_next_instance_created():
    """No new task instance is created when the maximum recurrence count has been exhausted."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_apply_to_all_updates_all_future_instances():
    """Updating a recurring task with apply_to_all propagates the change to all future instances."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_stop_recurring_marks_series_as_ended():
    """StopRecurringUseCase marks the recurrence series as ended so no further instances are generated."""
    assert False, "not implemented"
