import os
from typing import Optional, Dict, Any
import geoip2.database
import geoip2.errors
from config import settings


class GeoIPService:
    def __init__(self):
        self.reader = None
        self._initialize_reader()
    
    def _initialize_reader(self):
        try:
            if os.path.exists(settings.GEOIP2_DATABASE_PATH):
                self.reader = geoip2.database.Reader(settings.GEOIP2_DATABASE_PATH)
            else:
                print(f"Warning: GeoIP2 database not found at {settings.GEOIP2_DATABASE_PATH}")
                self.reader = None
        except Exception as e:
            print(f"Warning: Failed to initialize GeoIP2: {e}")
            self.reader = None
    
    def lookup(self, ip_address: str) -> Dict[str, Any]:
        result = {
            'country': None,
            'city': None,
            'region': None,
            'timezone': None,
            'latitude': None,
            'longitude': None,
        }
        
        if not self.reader or not ip_address:
            return result
        
        try:
            response = self.reader.city(ip_address)
            
            if response.country and response.country.name:
                result['country'] = response.country.name
            
            if response.city and response.city.name:
                result['city'] = response.city.name
            
            if response.subdivisions and len(response.subdivisions) > 0:
                result['region'] = response.subdivisions[0].name
            
            if response.location:
                result['timezone'] = response.location.time_zone
                if response.location.latitude is not None:
                    result['latitude'] = str(response.location.latitude)
                if response.location.longitude is not None:
                    result['longitude'] = str(response.location.longitude)
        
        except geoip2.errors.AddressNotFoundError:
            pass
        except Exception as e:
            print(f"GeoIP lookup error: {e}")
        
        return result
    
    def close(self):
        if self.reader:
            self.reader.close()


geoip_service = GeoIPService()


def get_geoip_service():
    return geoip_service
