import pytest
from datetime import datetime, timedelta
from app.core.short_code import ShortCodeGenerator


class TestShortCodeGenerator:
    def test_init(self):
        generator = ShortCodeGenerator(length=6)
        assert generator.length == 6
    
    def test_base62_encoding(self):
        generator = ShortCodeGenerator()
        
        assert generator.encode_base62(0) == '0'
        assert generator.encode_base62(61) == 'Z'
        assert generator.encode_base62(62) == '10'
        
        result = generator.encode_base62(123456)
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_random_generation(self):
        generator = ShortCodeGenerator(length=6)
        
        codes = set()
        for _ in range(100):
            code = generator.generate_random()
            assert len(code) == 6
            codes.add(code)
        
        assert len(codes) > 90
    
    def test_hash_generation(self):
        generator = ShortCodeGenerator(length=6)
        
        url1 = "https://example.com/page1"
        url2 = "https://example.com/page2"
        
        code1 = generator.generate_from_hash(url1)
        code2 = generator.generate_from_hash(url1)
        code3 = generator.generate_from_hash(url2)
        
        assert len(code1) == 6
        assert code1 == code2
        assert code1 != code3
    
    def test_custom_short_code_validation(self):
        generator = ShortCodeGenerator()
        
        is_valid, msg = generator.validate_custom_short_code("")
        assert is_valid == False
        assert "empty" in msg.lower()
        
        is_valid, msg = generator.validate_custom_short_code("ab")
        assert is_valid == False
        assert "3 and 50" in msg
        
        is_valid, msg = generator.validate_custom_short_code("a" * 51)
        assert is_valid == False
        
        is_valid, msg = generator.validate_custom_short_code("test-123_abc")
        assert is_valid == True
        
        is_valid, msg = generator.validate_custom_short_code("test@123")
        assert is_valid == False
        assert "Invalid character" in msg
        
        is_valid, msg = generator.validate_custom_short_code("validCode123")
        assert is_valid == True
    
    def test_counter_generation(self):
        generator = ShortCodeGenerator(length=6)
        
        codes = []
        for _ in range(10):
            code = generator.generate_from_counter()
            codes.append(code)
            assert len(code) == 6
        
        assert len(set(codes)) == 10
