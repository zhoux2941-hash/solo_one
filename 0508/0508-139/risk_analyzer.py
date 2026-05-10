from datetime import datetime, timedelta
from collections import defaultdict

MATERIAL_RISK_WEIGHTS = {
    '碳钢': 1.5,
    '高碳钢': 1.8,
    '不锈钢': 0.5,
    '大马士革钢': 1.2,
    '花纹钢': 1.3,
    '玉钢': 1.6,
    '其他': 1.0
}

AGING_RISK_THRESHOLDS = {
    50: 1.0,
    100: 1.3,
    200: 1.6,
    500: 2.0
}

DEFAULT_MAINTENANCE_INTERVAL_DAYS = 30

RECENT_RECORDS_WINDOW = 3

class RiskAnalyzer:
    def __init__(self, db):
        self.db = db
    
    def _parse_date(self, date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except (ValueError, TypeError):
            return None
    
    def _get_sorted_records(self, records):
        valid_records = []
        for record in records:
            dt = self._parse_date(record.get('maintenance_date'))
            if dt:
                valid_records.append((dt, record))
        
        valid_records.sort(key=lambda x: x[0], reverse=True)
        return valid_records
    
    def get_aging_factor(self, production_year):
        if not production_year or production_year <= 0:
            return 1.0
        
        current_year = datetime.now().year
        age = current_year - production_year
        
        factor = 1.0
        for threshold, weight in sorted(AGING_RISK_THRESHOLDS.items()):
            if age > threshold:
                factor = weight
        
        return factor
    
    def get_material_factor(self, material):
        return MATERIAL_RISK_WEIGHTS.get(material, MATERIAL_RISK_WEIGHTS['其他'])
    
    def get_maintenance_frequency_factor(self, records):
        if len(records) < 2:
            return 1.2
        
        dates = []
        for record in records:
            dt = self._parse_date(record.get('maintenance_date'))
            if dt:
                dates.append(dt)
        
        if len(dates) < 2:
            return 1.2
        
        dates.sort()
        intervals = []
        for i in range(1, len(dates)):
            delta = (dates[i] - dates[i-1]).days
            intervals.append(delta)
        
        if not intervals:
            return 1.2
        
        avg_interval = sum(intervals) / len(intervals)
        
        if avg_interval <= 20:
            return 0.7
        elif avg_interval <= 45:
            return 1.0
        elif avg_interval <= 90:
            return 1.3
        else:
            return 1.8
    
    def calculate_maintenance_quality_score(self, records):
        if not records:
            return {
                'score': 50,
                'level': '无数据',
                'trend': 'stable',
                'detail': '保养记录不足，无法评估质量'
            }
        
        sorted_records = self._get_sorted_records(records)
        if not sorted_records:
            return {
                'score': 50,
                'level': '无数据',
                'trend': 'stable',
                'detail': '保养记录日期无效'
            }
        
        total_records = len(sorted_records)
        recent = sorted_records[:RECENT_RECORDS_WINDOW]
        early = sorted_records[RECENT_RECORDS_WINDOW:] if total_records > RECENT_RECORDS_WINDOW else []
        
        rust_total = sum(1 for _, r in sorted_records if r.get('rust_removed', 0) == 1)
        rust_ratio_total = rust_total / total_records
        
        rust_recent = sum(1 for _, r in recent if r.get('rust_removed', 0) == 1)
        rust_ratio_recent = rust_recent / len(recent) if recent else 0
        
        score = 100
        
        if rust_ratio_total == 0:
            score = 90
            detail = '历史无除锈记录，保养预防效果良好'
        elif rust_ratio_total < 0.15:
            score = 80
            detail = '除锈记录较少，保养质量较好'
        elif rust_ratio_total < 0.3:
            score = 65
            detail = '有一定除锈记录，需关注保养质量'
        elif rust_ratio_total < 0.5:
            score = 50
            detail = '除锈记录较多，建议调整保养策略'
        else:
            score = 35
            detail = '频繁除锈，保养质量存在问题'
        
        if total_records >= RECENT_RECORDS_WINDOW + 2:
            rust_ratio_early = 0
            if early:
                rust_ratio_early = sum(1 for _, r in early if r.get('rust_removed', 0) == 1) / len(early)
            
            if rust_ratio_recent < rust_ratio_early * 0.7:
                score += 15
                detail += '；近期除锈频率显著下降，保养效果改善中'
            elif rust_ratio_recent > rust_ratio_early * 1.3:
                score -= 10
                detail += '；近期除锈频率上升，情况可能恶化'
        
        if total_records >= 4:
            last_three_rust = [1 if r.get('rust_removed', 0) == 1 else 0 for _, r in recent]
            if len(last_three_rust) >= 3 and sum(last_three_rust) == 0:
                score += 10
                detail += '；连续3次保养无除锈，锈蚀已得到控制'
        
        if total_records >= 2:
            latest_rust = sorted_records[0][1].get('rust_removed', 0) == 1
            prev_rust = sorted_records[1][1].get('rust_removed', 0) == 1
            
            if not latest_rust and prev_rust:
                score += 5
                detail += '；最近一次保养未除锈，情况可能好转'
            elif latest_rust and not prev_rust:
                score -= 8
                detail += '；最新一次出现除锈，需关注'
        
        score = max(5, min(100, score))
        
        if score >= 80:
            level = '优秀'
        elif score >= 65:
            level = '良好'
        elif score >= 50:
            level = '一般'
        elif score >= 35:
            level = '需关注'
        else:
            level = '较差'
        
        if total_records >= 5 and rust_ratio_recent < rust_ratio_total:
            trend = 'improving'
        elif total_records >= 5 and rust_ratio_recent > rust_ratio_total * 1.2:
            trend = 'worsening'
        else:
            trend = 'stable'
        
        return {
            'score': score,
            'level': level,
            'trend': trend,
            'detail': detail,
            'rust_ratio_total': round(rust_ratio_total, 3),
            'rust_ratio_recent': round(rust_ratio_recent, 3),
            'total_records': total_records
        }
    
    def get_maintenance_quality_factor(self, records):
        quality = self.calculate_maintenance_quality_score(records)
        
        if quality['score'] >= 80:
            return 0.85
        elif quality['score'] >= 65:
            return 0.95
        elif quality['score'] >= 50:
            return 1.0
        elif quality['score'] >= 35:
            return 1.15
        else:
            return 1.3
    
    def get_humidity_factor(self, records):
        if not records:
            return 1.0
        
        humidity_values = []
        for record in records:
            if record.get('humidity') is not None and record['humidity'] > 0:
                humidity_values.append((
                    self._parse_date(record.get('maintenance_date')),
                    record['humidity']
                ))
        
        if len(humidity_values) == 0:
            return 1.0
        
        humidity_values = [(dt, h) for dt, h in humidity_values if dt is not None]
        if not humidity_values:
            return 1.0
        
        humidity_values.sort(key=lambda x: x[0], reverse=True)
        
        avg_humidity = sum(h for _, h in humidity_values) / len(humidity_values)
        
        recent = humidity_values[:min(RECENT_RECORDS_WINDOW, len(humidity_values))]
        if recent:
            recent_avg = sum(h for _, h in recent) / len(recent)
        else:
            recent_avg = avg_humidity
        
        effective_avg = (recent_avg * 0.6) + (avg_humidity * 0.4)
        
        if effective_avg < 40:
            base = 0.8
        elif effective_avg < 50:
            base = 1.0
        elif effective_avg < 60:
            base = 1.3
        elif effective_avg < 70:
            base = 1.7
        else:
            base = 2.2
        
        if len(recent) >= 2:
            if recent_avg < avg_humidity * 0.85:
                base *= 0.9
            elif recent_avg > avg_humidity * 1.15:
                base *= 1.1
        
        return round(base, 2)
    
    def get_rust_history_factor(self, records):
        if not records:
            return 1.0
        
        sorted_records = self._get_sorted_records(records)
        if not sorted_records:
            return 1.0
        
        total = len(sorted_records)
        recent_count = min(RECENT_RECORDS_WINDOW, total)
        
        rust_total = sum(1 for _, r in sorted_records if r.get('rust_removed', 0) == 1)
        rust_ratio_total = rust_total / total
        
        recent = sorted_records[:recent_count]
        rust_recent = sum(1 for _, r in recent if r.get('rust_removed', 0) == 1)
        rust_ratio_recent = rust_recent / recent_count
        
        latest_rust = sorted_records[0][1].get('rust_removed', 0) == 1
        
        if rust_ratio_total == 0:
            return 1.0
        
        if total >= 4:
            early = sorted_records[recent_count:] if total > recent_count else []
            if early:
                rust_early = sum(1 for _, r in early if r.get('rust_removed', 0) == 1)
                rust_ratio_early = rust_early / len(early)
                
                if rust_ratio_recent <= rust_ratio_early * 0.5 and not latest_rust:
                    return 1.1 + (rust_ratio_total * 0.3)
                elif rust_ratio_recent <= rust_ratio_early * 0.7:
                    return 1.2 + (rust_ratio_total * 0.4)
        
        if latest_rust:
            return 1.5 + (rust_ratio_recent * 0.8)
        elif rust_ratio_recent < rust_ratio_total * 0.5:
            return 1.1 + (rust_ratio_total * 0.4)
        elif rust_ratio_recent < rust_ratio_total:
            return 1.2 + (rust_ratio_total * 0.5)
        else:
            return 1.3 + (rust_ratio_total * 0.7)
    
    def get_days_since_last_maintenance(self, records):
        if not records:
            return None
        
        latest_date = None
        for record in records:
            dt = self._parse_date(record.get('maintenance_date'))
            if dt and (latest_date is None or dt > latest_date):
                latest_date = dt
        
        if latest_date is None:
            return None
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        delta = (today - latest_date).days
        return max(0, delta)
    
    def calculate_risk_score(self, sword):
        records = self.db.get_maintenance_records(sword['id'])
        
        material_factor = self.get_material_factor(sword.get('material', '其他'))
        aging_factor = self.get_aging_factor(sword.get('production_year'))
        maintenance_freq_factor = self.get_maintenance_frequency_factor(records)
        humidity_factor = self.get_humidity_factor(records)
        rust_history_factor = self.get_rust_history_factor(records)
        maintenance_quality_factor = self.get_maintenance_quality_factor(records)
        maintenance_quality = self.calculate_maintenance_quality_score(records)
        
        base_score = 10.0
        
        score = (base_score 
                 * material_factor 
                 * aging_factor 
                 * maintenance_freq_factor 
                 * humidity_factor 
                 * rust_history_factor 
                 * maintenance_quality_factor)
        
        days_since = self.get_days_since_last_maintenance(records)
        if days_since is not None:
            if days_since > 90:
                score *= 1.5
            elif days_since > 60:
                score *= 1.2
            elif days_since > 30:
                score *= 1.1
        
        if score < 20:
            risk_level = '低'
            rust_probability = '10% - 20%'
        elif score < 40:
            risk_level = '中'
            rust_probability = '30% - 50%'
        else:
            risk_level = '高'
            rust_probability = '60% - 90%'
        
        return {
            'score': round(score, 2),
            'risk_level': risk_level,
            'rust_probability': rust_probability,
            'material_factor': material_factor,
            'aging_factor': aging_factor,
            'maintenance_freq_factor': maintenance_freq_factor,
            'humidity_factor': humidity_factor,
            'rust_history_factor': rust_history_factor,
            'maintenance_quality_factor': maintenance_quality_factor,
            'maintenance_quality': maintenance_quality,
            'days_since_last_maintenance': days_since
        }
    
    def predict_next_maintenance(self, sword):
        records = self.db.get_maintenance_records(sword['id'])
        risk = self.calculate_risk_score(sword)
        
        base_interval = DEFAULT_MAINTENANCE_INTERVAL_DAYS
        
        if records and len(records) >= 2:
            dates = []
            for record in records:
                dt = self._parse_date(record.get('maintenance_date'))
                if dt:
                    dates.append(dt)
            
            if len(dates) >= 2:
                dates.sort()
                intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
                base_interval = sum(intervals) / len(intervals)
        
        quality = risk.get('maintenance_quality', {})
        quality_score = quality.get('score', 50)
        quality_adjustment = 1.0 + (50 - quality_score) * 0.003
        
        if risk['risk_level'] == '高':
            recommended_interval = max(14, base_interval * 0.5 / quality_adjustment)
        elif risk['risk_level'] == '中':
            recommended_interval = max(21, base_interval * 0.75 / quality_adjustment)
        else:
            recommended_interval = base_interval * quality_adjustment
        
        recommended_interval = min(90, recommended_interval)
        
        last_maintenance = None
        if records:
            for record in records:
                dt = self._parse_date(record.get('maintenance_date'))
                if dt and (last_maintenance is None or dt > last_maintenance):
                    last_maintenance = dt
        
        if last_maintenance is None:
            last_maintenance = datetime.now()
        
        next_date = last_maintenance + timedelta(days=recommended_interval)
        
        urgency_message = ''
        days_to_next = (next_date - datetime.now()).days
        
        if days_to_next < 0:
            urgency_message = '已逾期，请立即保养！'
        elif days_to_next <= 7:
            urgency_message = '即将到期，请尽快安排保养。'
        elif days_to_next <= 14:
            urgency_message = '建议两周内安排保养。'
        else:
            urgency_message = '保养周期正常。'
        
        trend_text = {
            'improving': '保养效果呈改善趋势',
            'worsening': '锈蚀风险呈上升趋势，需特别关注',
            'stable': '保养情况稳定'
        }.get(quality.get('trend', 'stable'), '')
        
        if trend_text:
            urgency_message = trend_text + '；' + urgency_message
        
        return {
            'recommended_interval_days': round(recommended_interval),
            'next_maintenance_date': next_date.strftime('%Y-%m-%d'),
            'days_to_next': days_to_next,
            'urgency': urgency_message,
            'maintenance_quality_score': quality.get('score', 50),
            'maintenance_quality_level': quality.get('level', '无数据')
        }
