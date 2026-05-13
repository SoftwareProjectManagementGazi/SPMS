# Group E: Team Unit Test (1 test)

## test_create_team_sets_owner

- **Error:** `AssertionError: expected call not found.`
  - Expected: `create('Dev Team', 'Backend devs', 42)` (3 positional args)
  - Actual: `create(name='Dev Team', description='Backend devs', owner_id=42, color='#3b82f6', department=None, leader_id=None)` (6 kwargs)

- **Production change:** Ayşe's commits (b3085b96, bb422f10, 084c7297) extended `CreateTeamUseCase.execute()` to pass three new fields (`color`, `department`, `leader_id`) from the DTO into the repository, and switched the call style from positional to fully keyword arguments. See `Backend/app/application/use_cases/manage_teams.py:16-23`:

  ```python
  team = await self._team_repo.create(
      name=dto.name,
      description=dto.description,
      owner_id=current_user.id,
      color=dto.color or "#3b82f6",
      department=dto.department,
      leader_id=dto.leader_id,
  )
  ```

  The repository contract now takes 6 parameters; the use case default-fills `color="#3b82f6"` when DTO omits it. `TeamCreateDTO` already supports `color`, `department`, `leader_id`, `member_ids` (defaults), so the DTO instantiated by the test (`TeamCreateDTO(name=..., description=...)`) is still valid input.

- **Verdict:** **Outdated test.** The production change is intentional and consistent (DTO + repo interface + DB model all extended). Behavior under test (owner becomes `team.owner_id`) is preserved — the use case still passes `current_user.id` as `owner_id`. Only the mock assertion is stale.

- **Fix:** Update the mock assertion in `Backend/tests/unit/application/test_manage_teams.py:28` to match the new kwargs-based call:

  ```python
  team_repo.create.assert_called_once_with(
      name="Dev Team",
      description="Backend devs",
      owner_id=42,
      color="#3b82f6",
      department=None,
      leader_id=None,
  )
  ```

  No production change needed. The other tests in the file (`add_member`, `remove_member`, `only_owner_can_add_member`) still pass since their signatures were untouched.
