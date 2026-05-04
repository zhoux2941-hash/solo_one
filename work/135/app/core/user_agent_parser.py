from typing import Dict, Any, Optional
from user_agents import parse as parse_user_agent


class UserAgentParser:
    @staticmethod
    def parse(user_agent_string: Optional[str]) -> Dict[str, Any]:
        result = {
            'device_type': 'unknown',
            'browser': None,
            'os': None,
            'is_mobile': False,
            'is_tablet': False,
            'is_pc': False,
            'is_bot': False,
        }
        
        if not user_agent_string:
            return result
        
        try:
            ua = parse_user_agent(user_agent_string)
            
            result['is_mobile'] = ua.is_mobile
            result['is_tablet'] = ua.is_tablet
            result['is_pc'] = ua.is_pc
            result['is_bot'] = ua.is_bot
            
            if ua.is_mobile:
                result['device_type'] = 'mobile'
            elif ua.is_tablet:
                result['device_type'] = 'tablet'
            elif ua.is_pc:
                result['device_type'] = 'desktop'
            elif ua.is_bot:
                result['device_type'] = 'bot'
            else:
                result['device_type'] = 'other'
            
            if ua.browser.family:
                browser_parts = [ua.browser.family]
                if ua.browser.version_string:
                    browser_parts.append(ua.browser.version_string)
                result['browser'] = ' '.join(browser_parts)
            
            if ua.os.family:
                os_parts = [ua.os.family]
                if ua.os.version_string:
                    os_parts.append(ua.os.version_string)
                result['os'] = ' '.join(os_parts)
        
        except Exception as e:
            print(f"User agent parsing error: {e}")
        
        return result
    
    @staticmethod
    def get_device_type(user_agent_string: Optional[str]) -> str:
        parsed = UserAgentParser.parse(user_agent_string)
        return parsed['device_type']


user_agent_parser = UserAgentParser()


def get_user_agent_parser():
    return user_agent_parser
