import sys
sys.path.insert(0, '.')

from utils.aging_simulator import (
    PaperAgingSimulator, FIBER_DURABILITY, ENVIRONMENT_FACTORS, FRAGILITY_LEVELS
)

print("=" * 70)
print("纸张老化模拟系统测试")
print("=" * 70)

print("\n一、纤维耐用性参数:")
print("-" * 70)
for fiber, info in FIBER_DURABILITY.items():
    print(f"  {fiber:<10} - 耐用性: {info['durability']:.0%}, 半衰期: {info['half_life_years']}年")
    print(f"    {info['description']}")

print("\n二、脆弱等级定义:")
print("-" * 70)
for level in FRAGILITY_LEVELS:
    print(f"  {level['level']}级 ({level['name']}): 评分 >= {level['min_score']:.0%} - {level['description']}")

print("\n三、老化模拟测试:")
print("=" * 70)

simulator = PaperAgingSimulator()

test_cases = [
    {
        "name": "现代纯楮皮纸 (1990年制作)",
        "fibers": [{"fiber_type": "楮皮", "percentage": 100}],
        "thickness": 50,
        "ph_value": 7.5,
        "manufacture_year": 1990,
        "environment": "normal"
    },
    {
        "name": "清代仿古皮纸 (1800年制作)",
        "fibers": [{"fiber_type": "楮皮", "percentage": 70}, {"fiber_type": "三桠", "percentage": 30}],
        "thickness": 52,
        "ph_value": 7.2,
        "manufacture_year": 1800,
        "environment": "normal"
    },
    {
        "name": "明代竹纸 (1500年制作, 恶劣环境)",
        "fibers": [{"fiber_type": "竹纸", "percentage": 100}],
        "thickness": 45,
        "ph_value": 6.5,
        "manufacture_year": 1500,
        "environment": "poor"
    },
    {
        "name": "唐代麻纸 (800年制作, 博物馆环境)",
        "fibers": [{"fiber_type": "麻纸", "percentage": 100}],
        "thickness": 50,
        "ph_value": 7.0,
        "manufacture_year": 800,
        "environment": "good"
    },
    {
        "name": "新纸测试 (2020年制作)",
        "fibers": [{"fiber_type": "楮皮", "percentage": 70}, {"fiber_type": "竹纸", "percentage": 30}],
        "thickness": 55,
        "ph_value": 7.5,
        "manufacture_year": 2020,
        "environment": "optimal"
    }
]

for tc in test_cases:
    result = simulator.simulate_aging(
        fiber_compositions=tc['fibers'],
        thickness=tc['thickness'],
        ph_value=tc['ph_value'],
        manufacture_year=tc['manufacture_year'],
        environment=tc['environment']
    )

    print(f"\n测试案例: {tc['name']}")
    print("-" * 70)
    print(f"  纸张年龄: {result['years_old']} 年 (约{result['manufacture_year']}年制作)")
    print(f"  基础耐用性: {result['base_durability']:.2%}, 理论半衰期: {result['base_half_life_years']:.0f}年")
    print(f"  环境系数: {result['environment']['factor']:.0%} ({result['environment']['name']})")
    print(f"  厚度因素: {result['thickness_factor']:.0%}, pH因素: {result['ph_factor']:.0%}")
    print()
    print(f"  当前保存评分: {result['current_preservation_score']:.1%}")
    print(f"  脆弱等级: {result['fragility_level']['level']}级 - {result['fragility_level']['name']}")
    print(f"  剩余寿命估算: {result['remaining_life_years']:.0f} 年")
    print()

    urgency = simulator.get_repair_urgency(
        result['current_preservation_score'],
        result['fragility_level']
    )
    print(f"  修复紧迫性: {urgency['urgency']}")
    print(f"  建议: {urgency['recommendation']}")
    print()
    print(f"  未来预测:")
    print(f"    50年后 ({result['prediction_50_years']['future_year']}年):")
    print(f"      预测评分: {result['prediction_50_years']['predicted_score']:.1%}, "
          f"等级: {result['prediction_50_years']['predicted_fragility']['level']}级")
    print(f"    100年后 ({result['prediction_100_years']['future_year']}年):")
    print(f"      预测评分: {result['prediction_100_years']['predicted_score']:.1%}, "
          f"等级: {result['prediction_100_years']['predicted_fragility']['level']}级")

print("\n" + "=" * 70)
print("老化模拟参数说明:")
print("=" * 70)
print("""
保存状况评分公式:
  评分 = 基础耐用性 × 厚度因素 × pH因素 × 老化因子

影响因素权重:
  - 纤维类型: 决定基础耐用性（楮皮最优，稻草纸最差）
  - 保存环境: 影响老化速率（环境系数：理想100%、良好85%、普通70%、恶劣50%）
  - 纸张厚度: 50g/m²为最优，过薄或过厚都会降低耐用性
  - pH值: 7.5为最优，偏离会降低评分

半衰期定义:
  纸张性能下降到原始50%所需的时间
  - 楮皮纸: 约800年
  - 三桠纸: 约750年
  - 雁皮纸: 约700年
  - 桑皮纸: 约650年
  - 麻纸: 约550年
  - 竹纸: 约400年
  - 稻草纸: 约250年

修复建议:
  - 低紧急性 (评分 >= 75%): 定期检查，保持现有保存条件
  - 中紧急性 (评分 50-75%): 改善保存环境，考虑预防性修复
  - 高紧急性 (评分 30-50%): 建议尽快进行修复处理
  - 紧急 (评分 < 30%): 必须立即修复，停止使用
""")
