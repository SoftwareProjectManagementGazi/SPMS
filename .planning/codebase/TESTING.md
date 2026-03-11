# TESTING

## Overview

Testing exists only in the backend (FastAPI). The frontend has zero test coverage with no framework configured.

---

## Backend Testing

### Framework
- **pytest** with **pytest-asyncio** (asyncio mode enabled)
- **httpx** with `ASGITransport` for async HTTP client integration tests

### Configuration
- Asyncio mode: configured for async test functions
- Fixture scopes: function-scoped for isolation

### Test Structure
```
backend/
└── tests/
    ├── conftest.py       # Shared fixtures, DB setup, auth helpers
    ├── unit/             # Unit tests for domain logic
    └── integration/      # Integration tests via ASGI transport
```

### Isolation Strategy
- Rollback-per-test: each test runs in a transaction that is rolled back after completion
- Ensures clean state without truncating tables

### Mocking
- Manual mock classes implementing domain interfaces (no mocking library)
- Mocks injected via FastAPI dependency overrides

### Integration Test Pattern
```python
async with AsyncClient(
    transport=ASGITransport(app=app),
    base_url="http://test"
) as client:
    response = await client.get("/endpoint")
```

### Auth Test Helper
- JWT helper utility that generates test tokens for authenticated requests
- Used to simulate authenticated users in integration tests

---

## Frontend Testing

**Status: No tests exist.**
- No test framework configured (no Jest, Vitest, Cypress, Playwright, etc.)
- No test files found in the frontend directory
- Testing is an area of concern / technical debt

---

## Coverage

- Backend: partial coverage (integration + some unit tests)
- Frontend: 0%
- No coverage reporting configured
