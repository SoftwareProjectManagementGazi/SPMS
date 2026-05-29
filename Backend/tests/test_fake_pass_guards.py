"""Fake-pass guardrail (P1) — fails if any test reintroduces the stub patterns the
test-integrity audit removed.

Two patterns are banned across ``tests/``:

  1. ``assert False`` — a test body that can never pass for the right reason. The
     classic fake-pass stub was ``@pytest.mark.xfail(strict=False)`` wrapping
     ``assert False, "not implemented"``: green forever, verifying nothing.
  2. ``@pytest.mark.xfail(..., strict=False)`` — a non-strict xfail hides an
     unexpected PASS. Bare ``xfail`` is allowed (pytest.ini sets
     ``xfail_strict=true``, so an xpass fails loudly); only the explicit
     ``strict=False`` override is forbidden.

Detection is AST-based, so docstrings/comments that merely *mention* these
patterns (e.g. "Replaces the previous xfail(strict=False) + assert False stubs")
do NOT trip the guard — only real statements/calls do.
"""
import ast
from pathlib import Path

_TESTS_ROOT = Path(__file__).resolve().parent
_SELF = Path(__file__).resolve()


def _iter_test_files():
    for path in sorted(_TESTS_ROOT.rglob("*.py")):
        if "__pycache__" in path.parts:
            continue
        if path.resolve() == _SELF:
            continue  # never scan this guard file itself
        yield path


def _find_violations(tree: ast.AST):
    assert_false: list[int] = []
    nonstrict_xfail: list[int] = []
    for node in ast.walk(tree):
        # 1. `assert False` (a Constant False as the assertion's condition)
        if isinstance(node, ast.Assert):
            test = node.test
            if isinstance(test, ast.Constant) and test.value is False:
                assert_false.append(node.lineno)
        # 2. `<...>.xfail(..., strict=False)`
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "xfail":
                for kw in node.keywords:
                    if (
                        kw.arg == "strict"
                        and isinstance(kw.value, ast.Constant)
                        and kw.value.value is False
                    ):
                        nonstrict_xfail.append(node.lineno)
    return assert_false, nonstrict_xfail


def test_no_assert_false_in_tests():
    """No test may use `assert False` — it's the canonical fake-pass stub body."""
    offenders: list[str] = []
    for path in _iter_test_files():
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        assert_false, _ = _find_violations(tree)
        offenders.extend(
            f"{path.relative_to(_TESTS_ROOT).as_posix()}:{lineno}" for lineno in assert_false
        )
    assert not offenders, (
        "Fake-pass guard: `assert False` is banned in tests (it passes for the "
        "wrong reason / never verifies real behaviour). Implement the test or "
        "delete it. Found:\n  " + "\n  ".join(offenders)
    )


def test_no_nonstrict_xfail_in_tests():
    """No test may use `xfail(strict=False)` — an unexpected pass would be hidden."""
    offenders: list[str] = []
    for path in _iter_test_files():
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        _, nonstrict_xfail = _find_violations(tree)
        offenders.extend(
            f"{path.relative_to(_TESTS_ROOT).as_posix()}:{lineno}" for lineno in nonstrict_xfail
        )
    assert not offenders, (
        "Fake-pass guard: `xfail(strict=False)` is banned. Use a bare `xfail` "
        "(xfail_strict=true makes it strict, so an unexpected pass fails) or "
        "delete the stub. Found:\n  " + "\n  ".join(offenders)
    )
