from datetime import datetime


FIBER_DURABILITY = {
    '楮皮': {'durability': 1.0, 'half_life_years': 800, 'description': '最优，纤维长而强韧'},
    '三桠': {'durability': 0.95, 'half_life_years': 750, 'description': '优秀，仅次于楮皮'},
    '雁皮': {'durability': 0.9, 'half_life_years': 700, 'description': '优秀，常用于精细修复'},
    '桑皮': {'durability': 0.85, 'half_life_years': 650, 'description': '良好，纤维适中'},
    '皮纸': {'durability': 0.85, 'half_life_years': 650, 'description': '良好，泛指皮纸类'},
    '竹纸': {'durability': 0.6, 'half_life_years': 400, 'description': '一般，纤维较短'},
    '麻纸': {'durability': 0.75, 'half_life_years': 550, 'description': '中等，古老纸种'},
    '稻草纸': {'durability': 0.4, 'half_life_years': 250, 'description': '较差，寿命最短'},
    '混合纤维': {'durability': 0.7, 'half_life_years': 500, 'description': '取决于配比'}
}


ENVIRONMENT_FACTORS = {
    'optimal': {'name': '理想环境', 'factor': 1.0, 'description': '恒温恒湿(18-22°C, 45-55%RH), 避光'},
    'good': {'name': '良好环境', 'factor': 0.85, 'description': '一般博物馆条件'},
    'normal': {'name': '普通环境', 'factor': 0.7, 'description': '普通图书馆条件'},
    'poor': {'name': '恶劣环境', 'factor': 0.5, 'description': '潮湿、高温、光照强烈'}
}


FRAGILITY_LEVELS = [
    {'level': 'A', 'name': '完美', 'min_score': 0.9, 'color': '#2ECC71', 'description': '几乎全新，可正常使用'},
    {'level': 'B', 'name': '良好', 'min_score': 0.75, 'color': '#27AE60', 'description': '轻微老化，可正常翻阅'},
    {'level': 'C', 'name': '一般', 'min_score': 0.6, 'color': '#F1C40F', 'description': '明显老化，需谨慎处理'},
    {'level': 'D', 'name': '脆弱', 'min_score': 0.4, 'color': '#E67E22', 'description': '纸张脆弱，需要修复'},
    {'level': 'E', 'name': '严重脆弱', 'min_score': 0.2, 'color': '#E74C3C', 'description': '极易碎裂，紧急修复'},
    {'level': 'F', 'name': '濒危', 'min_score': 0, 'color': '#8E44AD', 'description': '濒临毁坏，仅可观赏'}
]


class PaperAgingSimulator:
    @staticmethod
    def get_fiber_info(fiber_type):
        return FIBER_DURABILITY.get(fiber_type, FIBER_DURABILITY['混合纤维'])

    @staticmethod
    def get_environment_info(environment_key):
        return ENVIRONMENT_FACTORS.get(environment_key, ENVIRONMENT_FACTORS['normal'])

    @staticmethod
    def get_fragility_level(preservation_score):
        for level in FRAGILITY_LEVELS:
            if preservation_score >= level['min_score']:
                return level
        return FRAGILITY_LEVELS[-1]

    @staticmethod
    def calculate_composite_durability(fiber_compositions):
        if not fiber_compositions:
            return FIBER_DURABILITY['混合纤维']

        weighted_durability = 0
        weighted_half_life = 0
        total_pct = 0

        for fc in fiber_compositions:
            fiber_type = fc['fiber_type']
            percentage = fc['percentage']
            info = PaperAgingSimulator.get_fiber_info(fiber_type)

            weighted_durability += info['durability'] * percentage
            weighted_half_life += info['half_life_years'] * percentage
            total_pct += percentage

        if total_pct == 0:
            return FIBER_DURABILITY['混合纤维']

        return {
            'durability': weighted_durability / total_pct,
            'half_life_years': weighted_half_life / total_pct
        }

    @staticmethod
    def calculate_aging_factor(years_old, environment='normal'):
        env_info = PaperAgingSimulator.get_environment_info(environment)
        env_factor = env_info['factor']

        effective_years = years_old / env_factor

        if effective_years <= 0:
            return 1.0

        decay_rate = 0.001
        aging_factor = 1.0 / (1.0 + decay_rate * effective_years)

        return max(0.01, aging_factor)

    @staticmethod
    def calculate_thickness_factor(thickness):
        if thickness <= 0:
            return 0.5

        optimal_thickness = 50
        thickness_ratio = thickness / optimal_thickness

        if thickness_ratio < 0.5:
            return 0.6 + 0.4 * thickness_ratio
        elif thickness_ratio > 1.5:
            return max(0.6, 1.0 - 0.1 * (thickness_ratio - 1.5))
        else:
            return 1.0

    @staticmethod
    def calculate_ph_factor(ph_value):
        if ph_value is None:
            return 0.7

        optimal_ph = 7.5
        ph_diff = abs(ph_value - optimal_ph)

        if ph_diff <= 1.0:
            return 1.0
        elif ph_diff <= 3.0:
            return 0.8 + 0.2 * (1 - ph_diff / 3.0)
        else:
            return max(0.3, 0.8 - 0.5 * (ph_diff - 3.0) / 14.0)

    @staticmethod
    def simulate_aging(fiber_compositions, thickness, ph_value=None, 
                       manufacture_year=None, current_year=None,
                       environment='normal'):
        if current_year is None:
            current_year = datetime.now().year

        if manufacture_year is None:
            years_old = 0
        else:
            years_old = max(0, current_year - manufacture_year)

        composite = PaperAgingSimulator.calculate_composite_durability(fiber_compositions)
        base_durability = composite['durability']
        base_half_life = composite['half_life_years']

        thickness_factor = PaperAgingSimulator.calculate_thickness_factor(thickness)
        ph_factor = PaperAgingSimulator.calculate_ph_factor(ph_value)
        aging_factor = PaperAgingSimulator.calculate_aging_factor(years_old, environment)

        current_preservation = base_durability * thickness_factor * ph_factor * aging_factor

        env_info = PaperAgingSimulator.get_environment_info(environment)
        adjusted_half_life = base_half_life * env_info['factor']

        remaining_years = max(0, adjusted_half_life - years_old)

        fragility = PaperAgingSimulator.get_fragility_level(current_preservation)

        degradation_rate = PaperAgingSimulator._calculate_degradation_rate(
            base_durability, thickness_factor, ph_factor, env_info['factor']
        )

        prediction_50 = PaperAgingSimulator._predict_state(
            current_preservation, years_old, degradation_rate, 50
        )
        prediction_100 = PaperAgingSimulator._predict_state(
            current_preservation, years_old, degradation_rate, 100
        )

        return {
            'manufacture_year': manufacture_year,
            'years_old': years_old,
            'current_year': current_year,
            'environment': env_info,
            'base_durability': base_durability,
            'base_half_life_years': base_half_life,
            'adjusted_half_life_years': adjusted_half_life,
            'thickness_factor': thickness_factor,
            'ph_factor': ph_factor,
            'aging_factor': aging_factor,
            'current_preservation_score': current_preservation,
            'remaining_life_years': remaining_years,
            'fragility_level': fragility,
            'degradation_rate': degradation_rate,
            'prediction_50_years': prediction_50,
            'prediction_100_years': prediction_100
        }

    @staticmethod
    def _calculate_degradation_rate(base_durability, thickness_factor, ph_factor, env_factor):
        base_rate = 0.001
        durability_impact = 1.0 - base_durability
        env_impact = 1.0 - env_factor
        thickness_impact = 1.0 - thickness_factor
        ph_impact = 1.0 - ph_factor

        total_impact = (
            durability_impact * 0.3 +
            env_impact * 0.4 +
            thickness_impact * 0.15 +
            ph_impact * 0.15
        )

        return base_rate * (1 + total_impact * 2)

    @staticmethod
    def _predict_state(current_score, current_years, degradation_rate, years_ahead):
        future_years = current_years + years_ahead
        decay_factor = 1.0 / (1.0 + degradation_rate * years_ahead)
        future_score = current_score * decay_factor
        fragility = PaperAgingSimulator.get_fragility_level(future_score)

        return {
            'years_ahead': years_ahead,
            'future_year': datetime.now().year + years_ahead,
            'predicted_score': future_score,
            'predicted_fragility': fragility
        }

    @staticmethod
    def get_repair_urgency(preservation_score, fragility_level):
        if preservation_score >= 0.75:
            return {
                'urgency': '低',
                'color': '#27AE60',
                'recommendation': '定期检查，保持现有保存条件'
            }
        elif preservation_score >= 0.5:
            return {
                'urgency': '中',
                'color': '#F39C12',
                'recommendation': '改善保存环境，考虑预防性修复'
            }
        elif preservation_score >= 0.3:
            return {
                'urgency': '高',
                'color': '#E67E22',
                'recommendation': '建议尽快进行修复处理'
            }
        else:
            return {
                'urgency': '紧急',
                'color': '#E74C3C',
                'recommendation': '必须立即修复，停止使用'
            }
