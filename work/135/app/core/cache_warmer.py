import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from app.models.database import SessionLocal, ShortLink, Click
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import get_elasticsearch_client
from config import settings

logger = logging.getLogger(__name__)


class CacheWarmer:
    def __init__(self):
        self._warmup_task: Optional[asyncio.Task] = None
        self._running = False
        self._es_client = get_elasticsearch_client()
    
    def _get_hot_shortcodes_from_db(self, hours: int, limit: int) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            since_time = datetime.utcnow() - timedelta(hours=hours)
            
            from sqlalchemy import func, desc
            
            results = db.query(
                Click.short_link_id,
                func.count(Click.id).label('click_count')
            ).filter(
                Click.created_at >= since_time
            ).group_by(
                Click.short_link_id
            ).order_by(
                desc('click_count')
            ).limit(limit).all()
            
            short_link_ids = [r.short_link_id for r in results]
            
            if not short_link_ids:
                return []
            
            short_links = db.query(ShortLink).filter(
                ShortLink.id.in_(short_link_ids)
            ).all()
            
            link_map = {sl.id: sl for sl in short_links}
            click_map = {r.short_link_id: r.click_count for r in results}
            
            hot_shortcodes = []
            for r in results:
                if r.short_link_id in link_map:
                    sl = link_map[r.short_link_id]
                    display_code = sl.custom_short_code or sl.short_code
                    hot_shortcodes.append({
                        'id': sl.id,
                        'short_code': sl.short_code,
                        'custom_short_code': sl.custom_short_code,
                        'display_code': display_code,
                        'original_url': sl.original_url,
                        'is_expired': sl.is_expired,
                        'is_active': sl.is_active == 'active',
                        'click_count': click_map.get(r.short_link_id, 0)
                    })
            
            return hot_shortcodes
            
        except Exception as e:
            logger.error(f"Error getting hot shortcodes from DB: {e}")
            return []
        finally:
            db.close()
    
    def _get_hot_shortcodes_from_es(self, hours: int, limit: int) -> List[Dict[str, Any]]:
        if not self._es_client or not self._es_client.is_available():
            return []
        
        try:
            since_time = datetime.utcnow() - timedelta(hours=hours)
            
            query = {
                'bool': {
                    'must': [
                        {'range': {
                            'created_at': {
                                'gte': since_time.isoformat()
                            }
                        }}
                    ]
                }
            }
            
            aggregations = {
                'top_shortcodes': {
                    'terms': {
                        'field': 'short_link_id',
                        'size': limit,
                        'order': {'_count': 'desc'}
                    }
                }
            }
            
            response = self._es_client.search_with_aggregations(
                query=query,
                aggregations=aggregations,
                index=settings.ES_SEARCH_ALIAS
            )
            
            if not response:
                return []
            
            buckets = response.get('aggregations', {}).get('top_shortcodes', {}).get('buckets', [])
            
            if not buckets:
                return []
            
            short_link_ids = [b['key'] for b in buckets]
            
            db = SessionLocal()
            try:
                short_links = db.query(ShortLink).filter(
                    ShortLink.id.in_(short_link_ids)
                ).all()
                
                link_map = {sl.id: sl for sl in short_links}
                click_map = {b['key']: b['doc_count'] for b in buckets}
                
                hot_shortcodes = []
                for b in buckets:
                    link_id = b['key']
                    if link_id in link_map:
                        sl = link_map[link_id]
                        display_code = sl.custom_short_code or sl.short_code
                        hot_shortcodes.append({
                            'id': sl.id,
                            'short_code': sl.short_code,
                            'custom_short_code': sl.custom_short_code,
                            'display_code': display_code,
                            'original_url': sl.original_url,
                            'is_expired': sl.is_expired,
                            'is_active': sl.is_active == 'active',
                            'click_count': click_map.get(link_id, 0)
                        })
                
                return hot_shortcodes
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting hot shortcodes from ES: {e}")
            return []
    
    def warmup_cache(self, hours: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        actual_hours = hours if hours is not None else settings.HOT_HOURS
        actual_limit = limit if limit is not None else settings.HOT_SHORTCODE_LIMIT
        ttl = settings.HOT_CACHE_TTL
        
        logger.info(f"Starting cache warmup: hours={actual_hours}, limit={actual_limit}")
        
        hot_shortcodes = self._get_hot_shortcodes_from_es(actual_hours, actual_limit)
        
        if not hot_shortcodes:
            logger.info("ES not available or no data, falling back to DB")
            hot_shortcodes = self._get_hot_shortcodes_from_db(actual_hours, actual_limit)
        
        if not hot_shortcodes:
            logger.info("No hot shortcodes found for warmup")
            return {
                'success': True,
                'count': 0,
                'message': 'No hot shortcodes found'
            }
        
        cached_count = 0
        skipped_expired = 0
        skipped_inactive = 0
        
        for sc in hot_shortcodes:
            display_code = sc['display_code']
            
            if sc['is_expired']:
                skipped_expired += 1
                redis_client.delete(f"short_code:{display_code}")
                continue
            
            if not sc['is_active']:
                skipped_inactive += 1
                redis_client.delete(f"short_code:{display_code}")
                continue
            
            cache_data = {
                'id': sc['id'],
                'original_url': sc['original_url'],
                'is_expired': False,
                'is_active': 'active',
                'is_hot': True,
                'cached_at': datetime.utcnow().isoformat()
            }
            
            success = redis_client.set(
                f"short_code:{display_code}",
                cache_data,
                ttl=ttl
            )
            
            if success:
                cached_count += 1
                logger.debug(f"Warmed cache for: {display_code} (clicks: {sc['click_count']})")
        
        hot_list_key = "hot:shortcodes:current"
        hot_list_data = {
            'generated_at': datetime.utcnow().isoformat(),
            'hours': actual_hours,
            'limit': actual_limit,
            'shortcodes': [
                {
                    'code': sc['display_code'],
                    'clicks': sc['click_count']
                }
                for sc in hot_shortcodes
                if sc['is_active'] and not sc['is_expired']
            ]
        }
        
        redis_client.set(hot_list_key, hot_list_data, ttl=settings.CACHE_WARMUP_INTERVAL)
        
        result = {
            'success': True,
            'cached_count': cached_count,
            'skipped_expired': skipped_expired,
            'skipped_inactive': skipped_inactive,
            'total_candidates': len(hot_shortcodes),
            'generated_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Cache warmup completed: {result}")
        return result
    
    async def start_background_warmup(self):
        if self._running:
            logger.warning("Cache warmup already running")
            return
        
        self._running = True
        logger.info("Starting background cache warmup task")
        
        async def warmup_loop():
            while self._running:
                try:
                    self.warmup_cache()
                except Exception as e:
                    logger.error(f"Error in background warmup: {e}")
                
                await asyncio.sleep(settings.CACHE_WARMUP_INTERVAL)
        
        self._warmup_task = asyncio.create_task(warmup_loop())
    
    async def stop_background_warmup(self):
        self._running = False
        if self._warmup_task:
            self._warmup_task.cancel()
            try:
                await self._warmup_task
            except asyncio.CancelledError:
                pass
            self._warmup_task = None
        logger.info("Background cache warmup stopped")
    
    def get_hot_list(self) -> Optional[Dict[str, Any]]:
        return redis_client.get("hot:shortcodes:current")


cache_warmer = CacheWarmer()


def get_cache_warmer() -> CacheWarmer:
    return cache_warmer
