from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from elasticsearch import Elasticsearch, helpers
from elasticsearch.exceptions import NotFoundError, RequestError
import logging

from config import settings

logger = logging.getLogger(__name__)


class ElasticsearchClient:
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        try:
            es_config = {
                'hosts': settings.ELASTICSEARCH_HOSTS,
            }
            
            if settings.ELASTICSEARCH_USERNAME and settings.ELASTICSEARCH_PASSWORD:
                es_config['basic_auth'] = (
                    settings.ELASTICSEARCH_USERNAME,
                    settings.ELASTICSEARCH_PASSWORD
                )
            
            if not settings.ELASTICSEARCH_SSL_VERIFY:
                es_config['verify_certs'] = False
            
            if settings.ELASTICSEARCH_CA_CERTS:
                es_config['ca_certs'] = settings.ELASTICSEARCH_CA_CERTS
            
            self.client = Elasticsearch(**es_config)
            
            if self.client.ping():
                logger.info("Elasticsearch connection established")
                self._ensure_indices_and_aliases()
            else:
                logger.warning("Elasticsearch ping failed, client will be None")
                self.client = None
                
        except Exception as e:
            logger.warning(f"Failed to initialize Elasticsearch: {e}")
            self.client = None
    
    def _ensure_indices_and_aliases(self):
        if not self.client:
            return
        
        try:
            if not self.client.indices.exists_alias(name=settings.ES_WRITE_ALIAS):
                today = datetime.utcnow().strftime("%Y.%m.%d")
                initial_index = f"{settings.ES_INDEX_PREFIX}-{today}"
                
                if not self.client.indices.exists(index=initial_index):
                    index_settings = self._get_index_settings()
                    self.client.indices.create(
                        index=initial_index,
                        body=index_settings
                    )
                    logger.info(f"Created initial index: {initial_index}")
                
                self.client.indices.put_alias(
                    index=initial_index,
                    name=settings.ES_WRITE_ALIAS
                )
                self.client.indices.put_alias(
                    index=initial_index,
                    name=settings.ES_SEARCH_ALIAS
                )
                logger.info(f"Created aliases: {settings.ES_WRITE_ALIAS}, {settings.ES_SEARCH_ALIAS}")
            
        except Exception as e:
            logger.error(f"Error ensuring indices: {e}")
    
    def _get_index_settings(self) -> Dict[str, Any]:
        return {
            "settings": {
                "number_of_shards": 3,
                "number_of_replicas": 1,
                "refresh_interval": "30s",
                "translog": {
                    "durability": "async",
                    "sync_interval": "5s"
                }
            },
            "mappings": {
                "dynamic": "strict",
                "properties": {
                    "id": {"type": "integer"},
                    "short_link_id": {"type": "integer"},
                    "short_code": {"type": "keyword"},
                    "ip_address": {"type": "ip"},
                    "user_agent": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}},
                    "referer": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}},
                    "country": {"type": "keyword"},
                    "city": {"type": "keyword"},
                    "region": {"type": "keyword"},
                    "timezone": {"type": "keyword"},
                    "latitude": {"type": "float"},
                    "longitude": {"type": "float"},
                    "location": {"type": "geo_point"},
                    "device_type": {"type": "keyword"},
                    "browser": {"type": "keyword"},
                    "os": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "click_date": {"type": "date"},
                }
            }
        }
    
    def get_current_write_index(self) -> str:
        today = datetime.utcnow().strftime("%Y.%m.%d")
        return f"{settings.ES_INDEX_PREFIX}-{today}"
    
    def check_and_rollover(self) -> bool:
        if not self.client:
            return False
        
        try:
            today = datetime.utcnow().strftime("%Y.%m.%d")
            target_index = f"{settings.ES_INDEX_PREFIX}-{today}"
            
            aliases = self.client.indices.get_alias(name=settings.ES_WRITE_ALIAS)
            current_indices = list(aliases.keys())
            
            if target_index not in current_indices:
                if not self.client.indices.exists(index=target_index):
                    index_settings = self._get_index_settings()
                    self.client.indices.create(
                        index=target_index,
                        body=index_settings
                    )
                    logger.info(f"Created new index: {target_index}")
                
                for idx in current_indices:
                    self.client.indices.delete_alias(
                        index=idx,
                        name=settings.ES_WRITE_ALIAS
                    )
                
                self.client.indices.put_alias(
                    index=target_index,
                    name=settings.ES_WRITE_ALIAS
                )
                
                if not self.client.indices.exists_alias(
                    name=settings.ES_SEARCH_ALIAS,
                    index=target_index
                ):
                    self.client.indices.put_alias(
                        index=target_index,
                        name=settings.ES_SEARCH_ALIAS
                    )
                
                logger.info(f"Rollover complete. New write index: {target_index}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error during rollover check: {e}")
            return False
    
    def index_click(self, click_doc: Dict[str, Any]) -> bool:
        if not self.client:
            return False
        
        try:
            self.check_and_rollover()
            
            doc = click_doc.copy()
            if doc.get('latitude') and doc.get('longitude'):
                try:
                    doc['location'] = {
                        'lat': float(doc['latitude']),
                        'lon': float(doc['longitude'])
                    }
                except (ValueError, TypeError):
                    pass
            
            self.client.index(
                index=settings.ES_WRITE_ALIAS,
                document=doc,
                id=doc.get('id')
            )
            return True
            
        except Exception as e:
            logger.error(f"Error indexing click: {e}")
            return False
    
    def bulk_index_clicks(self, click_docs: List[Dict[str, Any]]) -> int:
        if not self.client or not click_docs:
            return 0
        
        try:
            self.check_and_rollover()
            
            actions = []
            for doc in click_docs:
                doc_copy = doc.copy()
                if doc_copy.get('latitude') and doc_copy.get('longitude'):
                    try:
                        doc_copy['location'] = {
                            'lat': float(doc_copy['latitude']),
                            'lon': float(doc_copy['longitude'])
                        }
                    except (ValueError, TypeError):
                        pass
                
                action = {
                    '_index': settings.ES_WRITE_ALIAS,
                    '_source': doc_copy
                }
                if doc_copy.get('id'):
                    action['_id'] = doc_copy['id']
                
                actions.append(action)
            
            success, failed = helpers.bulk(
                self.client,
                actions,
                stats_only=True,
                raise_on_error=False
            )
            
            if failed > 0:
                logger.warning(f"Bulk index: {failed} documents failed")
            
            return success
            
        except Exception as e:
            logger.error(f"Error in bulk index: {e}")
            return 0
    
    def search_clicks(
        self,
        query: Dict[str, Any],
        index: Optional[str] = None,
        size: int = 10000,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        
        try:
            search_index = index or settings.ES_SEARCH_ALIAS
            
            response = self.client.search(
                index=search_index,
                query=query,
                size=size,
                track_total_hits=True,
                **kwargs
            )
            
            return response.raw
            
        except Exception as e:
            logger.error(f"Error searching clicks: {e}")
            return None
    
    def search_with_aggregations(
        self,
        query: Dict[str, Any],
        aggregations: Dict[str, Any],
        index: Optional[str] = None,
        size: int = 0
    ) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        
        try:
            search_index = index or settings.ES_SEARCH_ALIAS
            
            body = {
                'query': query,
                'aggs': aggregations,
                'size': size,
                'track_total_hits': True
            }
            
            response = self.client.search(
                index=search_index,
                **body
            )
            
            return response.raw
            
        except Exception as e:
            logger.error(f"Error in aggregation search: {e}")
            return None
    
    def count_clicks(
        self,
        query: Dict[str, Any],
        index: Optional[str] = None
    ) -> int:
        if not self.client:
            return 0
        
        try:
            search_index = index or settings.ES_SEARCH_ALIAS
            
            response = self.client.count(
                index=search_index,
                query=query
            )
            
            return response.raw.get('count', 0)
            
        except Exception as e:
            logger.error(f"Error counting clicks: {e}")
            return 0
    
    def is_available(self) -> bool:
        if not self.client:
            return False
        try:
            return self.client.ping()
        except Exception:
            return False
    
    def close(self):
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass


es_client = ElasticsearchClient()


def get_elasticsearch_client() -> ElasticsearchClient:
    return es_client
