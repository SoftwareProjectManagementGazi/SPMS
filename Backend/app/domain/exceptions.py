class DomainError(Exception):
    """Base class for domain exceptions"""
    pass

class UserAlreadyExistsError(DomainError):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"User with email {email} already exists")

class InvalidCredentialsError(DomainError):
    def __init__(self):
        super().__init__("Invalid email or password")
