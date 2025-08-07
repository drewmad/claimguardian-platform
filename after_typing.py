# after_typing.py
"""
A simple module to demonstrate static typing and pre-commit hooks.

This file contains a function to generate a greeting for a user.
"""

from typing import Dict, Any


def get_user_greeting(user: Dict[str, Any]) -> str:
    """
    Generate a personalized greeting for a user.

    Args:
        user: A dictionary containing user data, including 'name'
            and 'is_admin'.

    Returns:
        A formatted greeting string.
    """
    if user["is_admin"]:
        return f"Hello, Admin {user['name']}!"
    else:
        return f"Hello, {user['name']}!"


user_data: Dict[str, Any] = {"name": "Alice", "is_admin": True}
print(get_user_greeting(user_data))

# The following line caused the mypy error and should be removed.
# print(
#     get_user_greeting("not_a_user")
# )
