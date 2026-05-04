import asyncio
import logging
from typing import Dict, Any, Optional, Tuple, Callable, TypeVar
from dataclasses import dataclass, field
import time
from concurrent.futures import Future
import threading

from app.core.redis_client import redis_client
from config import settings

T = TypeVar('T')
logger = logging.getLogger(__name__)


@dataclass
class InFlightResult:
    future: asyncio.Future = field(default_factory=asyncio.Future)
    lock_time: float = field(default_factory=time.time)
    waiters: int = 0


class SingleFlight:
    def __init__(self):
        self._async_in_flight: Dict[str, InFlightResult] = {}
        self._sync_in_flight: Dict[str, Tuple[Future, float, int]] = {}
        self._async_lock = asyncio.Lock()
        self._sync_lock = threading.Lock()
    
    async def execute_async(
        self,
        key: str,
        fn: Callable[[], Any],
        timeout: Optional[float] = None
    ) -> Tuple[Any, bool]:
        actual_timeout = timeout if timeout is not None else settings.SINGLEFLIGHT_TIMEOUT
        
        async with self._async_lock:
            if key in self._async_in_flight:
                flight = self._async_in_flight[key]
                flight.waiters += 1
                logger.debug(f"SingleFlight: key={key}, waiting for in-flight request (waiters={flight.waiters})")
                
                try:
                    result = await asyncio.wait_for(
                        flight.future,
                        timeout=actual_timeout
                    )
                    return result, False
                except asyncio.TimeoutError:
                    logger.warning(f"SingleFlight: key={key}, timeout waiting for in-flight request")
                    raise
            
            flight = InFlightResult()
            self._async_in_flight[key] = flight
        
        try:
            logger.debug(f"SingleFlight: key={key}, executing primary request")
            loop = asyncio.get_running_loop()
            
            if asyncio.iscoroutinefunction(fn):
                result = await asyncio.wait_for(fn(), timeout=actual_timeout)
            else:
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, fn),
                    timeout=actual_timeout
                )
            
            flight.future.set_result(result)
            return result, True
            
        except asyncio.CancelledError:
            flight.future.cancel()
            raise
        except Exception as e:
            flight.future.set_exception(e)
            raise
        finally:
            async with self._async_lock:
                if key in self._async_in_flight:
                    del self._async_in_flight[key]
    
    def execute_sync(
        self,
        key: str,
        fn: Callable[[], T],
        timeout: Optional[float] = None
    ) -> Tuple[T, bool]:
        actual_timeout = timeout if timeout is not None else settings.SINGLEFLIGHT_TIMEOUT
        
        with self._sync_lock:
            if key in self._sync_in_flight:
                future, lock_time, waiters = self._sync_in_flight[key]
                self._sync_in_flight[key] = (future, lock_time, waiters + 1)
                logger.debug(f"SingleFlight sync: key={key}, waiting for in-flight request (waiters={waiters + 1})")
                
                try:
                    result = future.result(timeout=actual_timeout)
                    return result, False
                except TimeoutError:
                    logger.warning(f"SingleFlight sync: key={key}, timeout waiting for in-flight request")
                    raise
            
            future = Future()
            self._sync_in_flight[key] = (future, time.time(), 0)
        
        try:
            logger.debug(f"SingleFlight sync: key={key}, executing primary request")
            result = fn()
            future.set_result(result)
            return result, True
            
        except Exception as e:
            future.set_exception(e)
            raise
        finally:
            with self._sync_lock:
                if key in self._sync_in_flight:
                    del self._sync_in_flight[key]


class RedisSingleFlight:
    def __init__(self):
        self._local_singleflight = SingleFlight()
    
    def _get_lock_key(self, key: str) -> str:
        return f"singleflight:lock:{key}"
    
    def _get_result_key(self, key: str) -> str:
        return f"singleflight:result:{key}"
    
    async def execute_async(
        self,
        key: str,
        fn: Callable[[], Any],
        timeout: Optional[float] = None
    ) -> Tuple[Any, bool]:
        lock_key = self._get_lock_key(key)
        result_key = self._get_result_key(key)
        actual_timeout = timeout if timeout is not None else settings.SINGLEFLIGHT_TIMEOUT
        lock_ttl = settings.SINGLEFLIGHT_LOCK_TTL
        
        cached_result = redis_client.get(result_key)
        if cached_result is not None:
            logger.debug(f"RedisSingleFlight: key={key}, found cached result")
            return cached_result, False
        
        local_result, is_primary = await self._local_singleflight.execute_async(
            f"redis:{key}",
            lambda: self._try_acquire_lock_and_execute(key, lock_key, result_key, fn, lock_ttl),
            timeout=actual_timeout
        )
        
        return local_result, is_primary
    
    def _try_acquire_lock_and_execute(
        self,
        key: str,
        lock_key: str,
        result_key: str,
        fn: Callable[[], Any],
        lock_ttl: int
    ) -> Any:
        lock_acquired = redis_client.client.set(
            lock_key,
            "1",
            nx=True,
            ex=lock_ttl
        )
        
        if lock_acquired:
            logger.debug(f"RedisSingleFlight: key={key}, acquired Redis lock, executing primary")
            try:
                result = fn()
                
                redis_client.set(result_key, result, ttl=lock_ttl)
                
                return result
            except Exception as e:
                redis_client.delete(lock_key)
                raise
        else:
            logger.debug(f"RedisSingleFlight: key={key}, lock held, polling for result")
            
            import time
            start_time = time.time()
            poll_interval = 0.1
            max_wait = settings.SINGLEFLIGHT_TIMEOUT
            
            while time.time() - start_time < max_wait:
                result = redis_client.get(result_key)
                if result is not None:
                    return result
                time.sleep(poll_interval)
            
            raise TimeoutError(f"RedisSingleFlight: key={key}, timeout waiting for result")


singleflight = SingleFlight()
redis_singleflight = RedisSingleFlight()


def get_singleflight() -> SingleFlight:
    return singleflight


def get_redis_singleflight() -> RedisSingleFlight:
    return redis_singleflight
