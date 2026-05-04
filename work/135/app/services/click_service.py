from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from collections import defaultdict
import logging

from app.models.database import ShortLink, Click
from app.core.geoip import geoip_service
from app.core.user_agent_parser import user_agent_parser
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import get_elasticsearch_client, ElasticsearchClient
from app.schemas.short_link import (
    ClickStatistics,
    HourlyTrendItem,
    DailyTrendItem,
    StatisticsResponse,
    ShortLinkResponse
)
from config import settings

logger = logging.getLogger(__name__)


class ClickService:
    def __init__(self, db: Session):
        self.db = db
        self.es_client = get_elasticsearch_client()
    
    def _convert_click_to_es_doc(self, click: Click, short_link: ShortLink) -> Dict[str, Any]:
        display_code = short_link.custom_short_code or short_link.short_code
        
        doc = {
            'id': click.id,
            'short_link_id': click.short_link_id,
            'short_code': display_code,
            'ip_address': click.ip_address,
            'user_agent': click.user_agent,
            'referer': click.referer,
            'country': click.country,
            'city': click.city,
            'region': click.region,
            'timezone': click.timezone,
            'latitude': click.latitude,
            'longitude': click.longitude,
            'device_type': click.device_type,
            'browser': click.browser,
            'os': click.os,
            'created_at': click.created_at.isoformat() if click.created_at else None,
            'click_date': click.click_date.isoformat() if click.click_date else None,
        }
        
        return doc
    
    def record_click(
        self,
        short_link_id: int,
        ip_address: Optional[str],
        user_agent_string: Optional[str],
        referer: Optional[str]
    ) -> Click:
        geo_data = geoip_service.lookup(ip_address) if ip_address else {}
        
        ua_data = user_agent_parser.parse(user_agent_string)
        
        click = Click(
            short_link_id=short_link_id,
            ip_address=ip_address,
            user_agent=user_agent_string,
            referer=referer,
            country=geo_data.get('country'),
            city=geo_data.get('city'),
            region=geo_data.get('region'),
            timezone=geo_data.get('timezone'),
            latitude=geo_data.get('latitude'),
            longitude=geo_data.get('longitude'),
            device_type=ua_data.get('device_type'),
            browser=ua_data.get('browser'),
            os=ua_data.get('os'),
            click_date=datetime.utcnow().date()
        )
        
        self.db.add(click)
        
        short_link = self.db.query(ShortLink).filter(ShortLink.id == short_link_id).first()
        if short_link:
            short_link.total_clicks += 1
        
        self.db.commit()
        self.db.refresh(click)
        
        if self.es_client and self.es_client.is_available():
            try:
                es_doc = self._convert_click_to_es_doc(click, short_link)
                self.es_client.index_click(es_doc)
                logger.debug(f"Indexed click {click.id} to Elasticsearch")
            except Exception as e:
                logger.error(f"Failed to index click to Elasticsearch: {e}")
        
        return click
    
    def _get_stats_from_es(self, short_link_id: int, short_link: ShortLink) -> Optional[StatisticsResponse]:
        if not self.es_client or not self.es_client.is_available():
            return None
        
        try:
            base_query = {
                'term': {'short_link_id': short_link_id}
            }
            
            agg_query = {
                'bool': {
                    'must': [base_query]
                }
            }
            
            aggregations = {
                'device_dist': {
                    'terms': {'field': 'device_type', 'size': 100}
                },
                'browser_dist': {
                    'terms': {'field': 'browser', 'size': 100}
                },
                'country_dist': {
                    'terms': {'field': 'country', 'size': 100}
                },
                'unique_ips': {
                    'cardinality': {'field': 'ip_address', 'precision_threshold': 3000}
                }
            }
            
            response = self.es_client.search_with_aggregations(
                query=agg_query,
                aggregations=aggregations,
                index=settings.ES_SEARCH_ALIAS
            )
            
            if not response:
                return None
            
            total_clicks = response.get('hits', {}).get('total', {}).get('value', 0)
            
            aggs = response.get('aggregations', {})
            
            unique_ips = aggs.get('unique_ips', {}).get('value', 0)
            
            device_dist = {}
            for bucket in aggs.get('device_dist', {}).get('buckets', []):
                device_dist[bucket['key']] = bucket['doc_count']
            
            browser_dist = {}
            for bucket in aggs.get('browser_dist', {}).get('buckets', []):
                browser_dist[bucket['key']] = bucket['doc_count']
            
            country_dist = {}
            for bucket in aggs.get('country_dist', {}).get('buckets', []):
                country_dist[bucket['key']] = bucket['doc_count']
            
            hourly_trend = self._get_hourly_trend_es(short_link_id)
            daily_trend = self._get_daily_trend_es(short_link_id)
            
            display_code = short_link.custom_short_code or short_link.short_code
            short_url = f"{settings.BASE_URL}/{display_code}"
            
            return StatisticsResponse(
                short_link=ShortLinkResponse(
                    id=short_link.id,
                    short_code=short_link.short_code,
                    custom_short_code=short_link.custom_short_code,
                    original_url=short_link.original_url,
                    short_url=short_url,
                    expires_at=short_link.expires_at,
                    created_at=short_link.created_at,
                    total_clicks=short_link.total_clicks,
                    is_active=short_link.is_active,
                    is_expired=short_link.is_expired
                ),
                statistics=ClickStatistics(
                    total_clicks=total_clicks,
                    unique_visitors=unique_ips,
                    device_distribution=device_dist,
                    browser_distribution=browser_dist,
                    country_distribution=country_dist
                ),
                hourly_trend=[HourlyTrendItem(hour=h['hour'], clicks=h['clicks']) for h in hourly_trend],
                daily_trend=[DailyTrendItem(date=d['date'], clicks=d['clicks']) for d in daily_trend]
            )
            
        except Exception as e:
            logger.error(f"Error getting stats from Elasticsearch: {e}")
            return None
    
    def _get_hourly_trend_es(self, short_link_id: int, hours: int = 24) -> List[Dict[str, Any]]:
        if not self.es_client or not self.es_client.is_available():
            return []
        
        try:
            now = datetime.utcnow()
            start_time = now - timedelta(hours=hours)
            
            query = {
                'bool': {
                    'must': [
                        {'term': {'short_link_id': short_link_id}},
                        {'range': {
                            'created_at': {
                                'gte': start_time.isoformat(),
                                'lte': now.isoformat()
                            }
                        }}
                    ]
                }
            }
            
            aggregations = {
                'hourly': {
                    'date_histogram': {
                        'field': 'created_at',
                        'fixed_interval': '1h',
                        'format': 'yyyy-MM-dd HH:00',
                        'time_zone': 'UTC'
                    }
                }
            }
            
            response = self.es_client.search_with_aggregations(
                query=query,
                aggregations=aggregations,
                index=settings.ES_SEARCH_ALIAS
            )
            
            if not response:
                return []
            
            buckets = response.get('aggregations', {}).get('hourly', {}).get('buckets', [])
            
            result_dict = {}
            for bucket in buckets:
                hour_str = bucket.get('key_as_string', '')
                result_dict[hour_str] = bucket.get('doc_count', 0)
            
            trend = []
            current = start_time.replace(minute=0, second=0, microsecond=0)
            while current <= now.replace(minute=0, second=0, microsecond=0):
                hour_key = current.strftime('%Y-%m-%d %H:00')
                trend.append({
                    'hour': hour_key,
                    'clicks': result_dict.get(hour_key, 0)
                })
                current += timedelta(hours=1)
            
            return trend
            
        except Exception as e:
            logger.error(f"Error getting hourly trend from ES: {e}")
            return []
    
    def _get_daily_trend_es(self, short_link_id: int, days: int = 30) -> List[Dict[str, Any]]:
        if not self.es_client or not self.es_client.is_available():
            return []
        
        try:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=days - 1)
            
            query = {
                'bool': {
                    'must': [
                        {'term': {'short_link_id': short_link_id}},
                        {'range': {
                            'click_date': {
                                'gte': start_date.isoformat(),
                                'lte': today.isoformat()
                            }
                        }}
                    ]
                }
            }
            
            aggregations = {
                'daily': {
                    'date_histogram': {
                        'field': 'click_date',
                        'calendar_interval': '1d',
                        'format': 'yyyy-MM-dd',
                        'time_zone': 'UTC'
                    }
                }
            }
            
            response = self.es_client.search_with_aggregations(
                query=query,
                aggregations=aggregations,
                index=settings.ES_SEARCH_ALIAS
            )
            
            if not response:
                return []
            
            buckets = response.get('aggregations', {}).get('daily', {}).get('buckets', [])
            
            result_dict = {}
            for bucket in buckets:
                date_str = bucket.get('key_as_string', '')
                result_dict[date_str] = bucket.get('doc_count', 0)
            
            trend = []
            current = start_date
            while current <= today:
                date_key = current.strftime('%Y-%m-%d')
                trend.append({
                    'date': date_key,
                    'clicks': result_dict.get(date_key, 0)
                })
                current += timedelta(days=1)
            
            return trend
            
        except Exception as e:
            logger.error(f"Error getting daily trend from ES: {e}")
            return []
    
    def _get_stats_from_db(self, short_link_id: int, short_link: ShortLink) -> StatisticsResponse:
        base_query = self.db.query(Click).filter(Click.short_link_id == short_link_id)
        total_clicks = base_query.count()
        
        unique_ips = self.db.query(func.count(func.distinct(Click.ip_address))).filter(
            Click.short_link_id == short_link_id
        ).scalar() or 0
        
        device_dist = defaultdict(int)
        browser_dist = defaultdict(int)
        country_dist = defaultdict(int)
        
        results = self.db.query(
            Click.device_type,
            Click.browser,
            Click.country
        ).filter(
            Click.short_link_id == short_link_id
        ).all()
        
        for device, browser, country in results:
            device_dist[device or 'unknown'] += 1
            browser_dist[browser or 'unknown'] += 1
            country_dist[country or 'unknown'] += 1
        
        hourly_trend = self._get_hourly_trend_db(short_link_id)
        daily_trend = self._get_daily_trend_db(short_link_id)
        
        display_code = short_link.custom_short_code or short_link.short_code
        short_url = f"{settings.BASE_URL}/{display_code}"
        
        return StatisticsResponse(
            short_link=ShortLinkResponse(
                id=short_link.id,
                short_code=short_link.short_code,
                custom_short_code=short_link.custom_short_code,
                original_url=short_link.original_url,
                short_url=short_url,
                expires_at=short_link.expires_at,
                created_at=short_link.created_at,
                total_clicks=short_link.total_clicks,
                is_active=short_link.is_active,
                is_expired=short_link.is_expired
            ),
            statistics=ClickStatistics(
                total_clicks=total_clicks,
                unique_visitors=unique_ips,
                device_distribution=dict(device_dist),
                browser_distribution=dict(browser_dist),
                country_distribution=dict(country_dist)
            ),
            hourly_trend=[HourlyTrendItem(hour=h['hour'], clicks=h['clicks']) for h in hourly_trend],
            daily_trend=[DailyTrendItem(date=d['date'], clicks=d['clicks']) for d in daily_trend]
        )
    
    def _get_hourly_trend_db(self, short_link_id: int, hours: int = 24) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        start_time = now - timedelta(hours=hours)
        
        results = self.db.query(
            func.date_trunc('hour', Click.created_at).label('hour'),
            func.count(Click.id).label('clicks')
        ).filter(
            Click.short_link_id == short_link_id,
            Click.created_at >= start_time
        ).group_by(
            func.date_trunc('hour', Click.created_at)
        ).order_by(
            'hour'
        ).all()
        
        trend = []
        result_dict = {r.hour: r.clicks for r in results}
        
        current = start_time.replace(minute=0, second=0, microsecond=0)
        while current <= now.replace(minute=0, second=0, microsecond=0):
            trend.append({
                'hour': current.strftime('%Y-%m-%d %H:00'),
                'clicks': result_dict.get(current, 0)
            })
            current += timedelta(hours=1)
        
        return trend
    
    def _get_daily_trend_db(self, short_link_id: int, days: int = 30) -> List[Dict[str, Any]]:
        today = date.today()
        start_date = today - timedelta(days=days - 1)
        
        results = self.db.query(
            Click.click_date,
            func.count(Click.id).label('clicks')
        ).filter(
            Click.short_link_id == short_link_id,
            Click.click_date >= start_date
        ).group_by(
            Click.click_date
        ).order_by(
            Click.click_date
        ).all()
        
        trend = []
        result_dict = {r.click_date: r.clicks for r in results}
        
        current = start_date
        while current <= today:
            trend.append({
                'date': current.strftime('%Y-%m-%d'),
                'clicks': result_dict.get(current, 0)
            })
            current += timedelta(days=1)
        
        return trend
    
    def get_statistics(self, short_link_id: int) -> Optional[StatisticsResponse]:
        short_link = self.db.query(ShortLink).filter(ShortLink.id == short_link_id).first()
        
        if not short_link:
            return None
        
        es_stats = self._get_stats_from_es(short_link_id, short_link)
        if es_stats:
            logger.info("Statistics retrieved from Elasticsearch")
            return es_stats
        
        logger.warning("Elasticsearch unavailable, falling back to PostgreSQL")
        return self._get_stats_from_db(short_link_id, short_link)
    
    def _get_overview_from_es(self) -> Optional[Dict[str, Any]]:
        if not self.es_client or not self.es_client.is_available():
            return None
        
        try:
            query = {'match_all': {}}
            
            aggregations = {
                'device_dist': {
                    'terms': {'field': 'device_type', 'size': 100}
                },
                'unique_ips': {
                    'cardinality': {'field': 'ip_address', 'precision_threshold': 10000}
                },
                'top_links': {
                    'terms': {'field': 'short_link_id', 'size': 10}
                }
            }
            
            response = self.es_client.search_with_aggregations(
                query=query,
                aggregations=aggregations,
                index=settings.ES_SEARCH_ALIAS
            )
            
            if not response:
                return None
            
            total_clicks = response.get('hits', {}).get('total', {}).get('value', 0)
            unique_ips = response.get('aggregations', {}).get('unique_ips', {}).get('value', 0)
            
            device_dist = {}
            for bucket in response.get('aggregations', {}).get('device_dist', {}).get('buckets', []):
                device_dist[bucket['key']] = bucket['doc_count']
            
            top_link_buckets = response.get('aggregations', {}).get('top_links', {}).get('buckets', [])
            top_link_ids = [b['key'] for b in top_link_buckets]
            
            top_links_list = []
            if top_link_ids:
                short_links = self.db.query(ShortLink).filter(
                    ShortLink.id.in_(top_link_ids)
                ).all()
                
                link_map = {sl.id: sl for sl in short_links}
                
                for bucket in top_link_buckets:
                    link_id = bucket['key']
                    if link_id in link_map:
                        link = link_map[link_id]
                        display_code = link.custom_short_code or link.short_code
                        top_links_list.append({
                            'id': link.id,
                            'short_code': display_code,
                            'original_url': link.original_url,
                            'total_clicks': bucket['doc_count']
                        })
            
            total_short_links = self.db.query(ShortLink).count()
            active_short_links = self.db.query(ShortLink).filter(
                ShortLink.is_active == 'active'
            ).count()
            
            return {
                'total_short_links': total_short_links,
                'active_short_links': active_short_links,
                'total_clicks': total_clicks,
                'unique_visitors': unique_ips,
                'device_distribution': device_dist,
                'top_links': top_links_list,
                'data_source': 'elasticsearch'
            }
            
        except Exception as e:
            logger.error(f"Error getting overview from Elasticsearch: {e}")
            return None
    
    def get_all_time_statistics(self) -> Dict[str, Any]:
        es_stats = self._get_overview_from_es()
        if es_stats:
            logger.info("Overview statistics retrieved from Elasticsearch")
            return es_stats
        
        logger.warning("Elasticsearch unavailable, falling back to PostgreSQL")
        
        total_short_links = self.db.query(ShortLink).count()
        active_short_links = self.db.query(ShortLink).filter(
            ShortLink.is_active == 'active'
        ).count()
        
        total_clicks = self.db.query(Click).count()
        unique_ips = self.db.query(func.count(func.distinct(Click.ip_address))).scalar() or 0
        
        device_dist = defaultdict(int)
        results = self.db.query(
            Click.device_type,
            func.count(Click.id)
        ).group_by(Click.device_type).all()
        
        for device, count in results:
            device_dist[device or 'unknown'] = count
        
        top_links = self.db.query(
            ShortLink,
            func.count(Click.id).label('click_count')
        ).outerjoin(Click).group_by(ShortLink.id).order_by(
            desc('click_count')
        ).limit(10).all()
        
        top_links_list = []
        for link, count in top_links:
            display_code = link.custom_short_code or link.short_code
            top_links_list.append({
                'id': link.id,
                'short_code': display_code,
                'original_url': link.original_url,
                'total_clicks': count
            })
        
        return {
            'total_short_links': total_short_links,
            'active_short_links': active_short_links,
            'total_clicks': total_clicks,
            'unique_visitors': unique_ips,
            'device_distribution': dict(device_dist),
            'top_links': top_links_list,
            'data_source': 'postgresql'
        }


def get_click_service(db: Session) -> ClickService:
    return ClickService(db)
