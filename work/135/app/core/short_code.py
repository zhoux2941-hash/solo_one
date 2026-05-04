import string
import random
import hashlib
from typing import Optional
from config import settings
from app.models.database import ShortLink, SessionLocal


class ShortCodeGenerator:
    BASE62_CHARACTERS = string.ascii_letters + string.digits
    BASE62_LENGTH = len(BASE62_CHARACTERS)
    
    def __init__(self, length: int = 6):
        self.length = length
        self._counter = self._initialize_counter()
    
    def _initialize_counter(self) -> int:
        try:
            db = SessionLocal()
            max_id = db.execute("SELECT COALESCE(MAX(id), 0) FROM short_links").scalar()
            db.close()
            return max_id + 1
        except Exception:
            return random.randint(100000, 999999)
    
    def encode_base62(self, number: int) -> str:
        if number == 0:
            return self.BASE62_CHARACTERS[0]
        
        result = []
        while number > 0:
            number, remainder = divmod(number, self.BASE62_LENGTH)
            result.append(self.BASE62_CHARACTERS[remainder])
        
        return ''.join(reversed(result))
    
    def generate_from_counter(self) -> str:
        short_code = self.encode_base62(self._counter)
        self._counter += 1
        
        if len(short_code) < self.length:
            short_code = short_code.rjust(self.length, self.BASE62_CHARACTERS[0])
        
        return short_code[:self.length]
    
    def generate_random(self) -> str:
        return ''.join(
            random.choice(self.BASE62_CHARACTERS)
            for _ in range(self.length)
        )
    
    def generate_from_hash(self, url: str) -> str:
        hash_obj = hashlib.sha256(url.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()
        
        hash_int = int(hash_hex[:16], 16)
        short_code = self.encode_base62(hash_int)
        
        if len(short_code) < self.length:
            short_code = short_code.ljust(self.length, random.choice(self.BASE62_CHARACTERS))
        
        return short_code[:self.length]
    
    def generate_unique(self, db, original_url: Optional[str] = None) -> str:
        max_attempts = 100
        
        for attempt in range(max_attempts):
            if original_url and attempt < 3:
                short_code = self.generate_from_hash(original_url + str(attempt))
            elif attempt < 50:
                short_code = self.generate_from_counter()
            else:
                short_code = self.generate_random()
            
            exists = db.query(ShortLink).filter(
                (ShortLink.short_code == short_code) | 
                (ShortLink.custom_short_code == short_code)
            ).first()
            
            if not exists:
                return short_code
        
        raise ValueError("Unable to generate unique short code after multiple attempts")
    
    def validate_custom_short_code(self, short_code: str) -> tuple[bool, str]:
        if not short_code:
            return False, "Short code cannot be empty"
        
        if len(short_code) < 3 or len(short_code) > 50:
            return False, "Short code must be between 3 and 50 characters"
        
        for char in short_code:
            if char not in self.BASE62_CHARACTERS + '-_':
                return False, f"Invalid character '{char}'. Only alphanumeric, '-' and '_' are allowed"
        
        return True, "Valid"


short_code_generator = ShortCodeGenerator(length=settings.SHORT_CODE_LENGTH)


def get_short_code_generator():
    return short_code_generator
