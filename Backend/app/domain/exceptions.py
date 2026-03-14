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

class SprintNotFoundError(DomainError):
    def __init__(self, sprint_id: int):
        super().__init__(f"Sprint with id {sprint_id} not found")

class UserNotFoundError(DomainError):
    def __init__(self, user_id: int):
        super().__init__(f"User with id {user_id} not found")

class CommentNotFoundError(DomainError):
    def __init__(self, comment_id: int):
        super().__init__(f"Comment with id {comment_id} not found")

class AttachmentNotFoundError(DomainError):
    def __init__(self, file_id: int):
        super().__init__(f"Attachment with id {file_id} not found")

class DependencyAlreadyExistsError(DomainError):
    def __init__(self, task_id: int, depends_on_id: int):
        super().__init__(f"Dependency between task {task_id} and task {depends_on_id} already exists")
