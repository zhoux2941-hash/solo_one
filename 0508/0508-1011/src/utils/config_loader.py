import yaml
import os


class Config:
    _instance = None
    _config = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._load_config()
        return cls._instance
    
    @classmethod
    def _load_config(cls):
        config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'config',
            'config.yaml'
        )
        with open(config_path, 'r', encoding='utf-8') as f:
            cls._config = yaml.safe_load(f)
    
    @classmethod
    def get(cls, key_path=None):
        if cls._instance is None:
            cls()
        if key_path is None:
            return cls._config
        keys = key_path.split('.')
        value = cls._config
        for key in keys:
            value = value.get(key)
            if value is None:
                return None
        return value
