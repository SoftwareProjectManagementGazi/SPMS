# Dependency Injection Container
# This file will map interfaces to implementations
from app.infrastructure.database.database import get_db_session

# Re-export the database dependency
get_db = get_db_session
