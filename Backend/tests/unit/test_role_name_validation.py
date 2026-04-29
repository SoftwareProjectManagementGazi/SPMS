"""Phase 15 RBAC-05 / D-2.6 — Role name validation unit tests (Plan 15-05).

Validates Pydantic regex + reserved-name set behavior. Pure Python — no DB.

Coverage matrix (10 tests):
- valid simple Latin name
- valid Turkish characters (Tasarımcı, Müşteri)
- valid mixed-case with space and digits
- valid with underscore + dash
- empty rejected (min_length=1)
- too-long rejected (max_length=50)
- invalid char @ rejected
- special punctuation ! rejected
- RESERVED_ROLE_NAMES set contains canonical lowercase forms
- at-max-length (50 chars) accepted
"""
import pytest
from pydantic import ValidationError

from app.application.dtos.role_dtos import (
    RESERVED_ROLE_NAMES,
    ROLE_NAME_MAX,
    RoleCreateDTO,
)


class TestRoleNameValidation:
    def test_valid_simple_name_accepted(self):
        dto = RoleCreateDTO(name="Designer")
        assert dto.name == "Designer"

    def test_valid_turkish_name_accepted(self):
        dto = RoleCreateDTO(name="Tasarımcı")
        assert dto.name == "Tasarımcı"

    def test_valid_mixed_case_with_space(self):
        dto = RoleCreateDTO(name="Tech Lead 2")
        assert dto.name == "Tech Lead 2"

    def test_valid_with_underscore_and_dash(self):
        dto = RoleCreateDTO(name="Senior_Dev-3")
        assert dto.name == "Senior_Dev-3"

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            RoleCreateDTO(name="")

    def test_too_long_name_rejected(self):
        too_long = "A" * (ROLE_NAME_MAX + 1)
        with pytest.raises(ValidationError):
            RoleCreateDTO(name=too_long)

    def test_invalid_chars_rejected(self):
        with pytest.raises(ValidationError):
            RoleCreateDTO(name="Admin@Sys")  # @ not in regex

    def test_special_punctuation_rejected(self):
        with pytest.raises(ValidationError):
            RoleCreateDTO(name="Role!")

    def test_reserved_names_set_contains_canonical_lowercase_forms(self):
        """Reserved-name set is checked at use case layer (case-insensitive).

        DTO regex permits the literal strings; use case layer enforces rejection.
        """
        assert "admin" in RESERVED_ROLE_NAMES
        assert "project manager" in RESERVED_ROLE_NAMES
        assert "member" in RESERVED_ROLE_NAMES
        assert "guest" in RESERVED_ROLE_NAMES

    def test_at_max_length_accepted(self):
        max_name = "A" * ROLE_NAME_MAX
        dto = RoleCreateDTO(name=max_name)
        assert len(dto.name) == ROLE_NAME_MAX
