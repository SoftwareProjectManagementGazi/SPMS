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

class ProjectNotFoundError(DomainError):
    def __init__(self, project_id: int):
        super().__init__(f"Project with id {project_id} not found")

class TaskNotFoundError(DomainError):
    def __init__(self, task_id: int):
        super().__init__(f"Task with id {task_id} not found")
