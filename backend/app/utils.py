"""
Utility functions for authentication and validation
"""

import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt
    
    Note: bcrypt has a 72-byte limitation. Passwords longer than 72 bytes
    will be truncated automatically.
    """
    # Ensure password is a string and truncate to 72 bytes if needed
    if isinstance(password, bytes):
        password = password.decode('utf-8')
    
    password_str = str(password)[:72]
    # Encode to bytes for bcrypt
    password_bytes = password_str.encode('utf-8')
    
    # Hash with bcrypt
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    # Truncate to 72 bytes to match hash_password behavior
    if isinstance(plain_password, bytes):
        plain_password = plain_password.decode('utf-8')
    
    plain_password_str = str(plain_password)[:72]
    plain_bytes = plain_password_str.encode('utf-8')
    
    # Ensure hashed password is bytes
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(plain_bytes, hashed_password)
