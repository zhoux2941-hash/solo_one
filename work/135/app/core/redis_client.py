import redis
from typing import Optional, Any
from config import settings
import json


class RedisClient:
    def __init__(self):
        self.client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
        )
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            if isinstance(value, dict) or isinstance(value, list):
                value = json.dumps(value, ensure_ascii=False)
            if ttl:
                return self.client.setex(key, ttl, value)
            return self.client.set(key, value)
        except Exception:
            return False
    
    def get(self, key: str) -> Optional[Any]:
        try:
            value = self.client.get(key)
            if value:
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            return None
        except Exception:
            return None
    
    def delete(self, key: str) -> bool:
        try:
            return bool(self.client.delete(key))
        except Exception:
            return False
    
    def exists(self, key: str) -> bool:
        try:
            return bool(self.client.exists(key))
        except Exception:
            return False
    
    def incr(self, key: str) -> int:
        try:
            return self.client.incr(key)
        except Exception:
            return 0
    
    def hset(self, name: str, key: str, value: Any) -> bool:
        try:
            if isinstance(value, dict) or isinstance(value, list):
                value = json.dumps(value, ensure_ascii=False)
            return bool(self.client.hset(name, key, value))
        except Exception:
            return False
    
    def hget(self, name: str, key: str) -> Optional[Any]:
        try:
            value = self.client.hget(name, key)
            if value:
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            return None
        except Exception:
            return None
    
    def hgetall(self, name: str) -> dict:
        try:
            result = self.client.hgetall(name)
            parsed = {}
            for k, v in result.items():
                try:
                    parsed[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    parsed[k] = v
            return parsed
        except Exception:
            return {}
    
    def expire(self, key: str, ttl: int) -> bool:
        try:
            return bool(self.client.expire(key, ttl))
        except Exception:
            return False
    
    def ttl(self, key: str) -> int:
        try:
            return self.client.ttl(key)
        except Exception:
            return -1


redis_client = RedisClient()


def get_redis():
    return redis_client
