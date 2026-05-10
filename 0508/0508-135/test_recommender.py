import sys
sys.path.insert(0, '.')

from utils.recommender import PaperRecommender, FIBER_CATEGORIES, get_fiber_category

print("=" * 60)
print("古籍修复纸张推荐系统 - 改进后的推荐算法测试")
print("=" * 60)

print("\n一、纤维分类系统:")
for category, fibers in FIBER_CATEGORIES.items():
    print(f"  {category}: {fibers}")

print("\n二、纤维相似度计算测试:")

test_cases = [
    {
        "name": "完全匹配 - 楮皮100% vs 楮皮100%",
        "target": [{"fiber_type": "楮皮", "percentage": 100}],
        "paper": [{"fiber_type": "楮皮", "percentage": 100}]
    },
    {
        "name": "同类别匹配 - 楮皮 vs 三桠(同属皮纸类)",
        "target": [{"fiber_type": "楮皮", "percentage": 100}],
        "paper": [{"fiber_type": "三桠", "percentage": 100}]
    },
    {
        "name": "不同类别 - 楮皮 vs 竹纸",
        "target": [{"fiber_type": "楮皮", "percentage": 100}],
        "paper": [{"fiber_type": "竹纸", "percentage": 100}]
    },
    {
        "name": "混合匹配 - 楮皮70%+三桠30% vs 仿古皮纸",
        "target": [{"fiber_type": "楮皮", "percentage": 70}, {"fiber_type": "三桠", "percentage": 30}],
        "paper": [{"fiber_type": "楮皮", "percentage": 70}, {"fiber_type": "三桠", "percentage": 30}]
    },
    {
        "name": "部分匹配 - 纯楮皮 vs 楮竹混合",
        "target": [{"fiber_type": "楮皮", "percentage": 100}],
        "paper": [{"fiber_type": "楮皮", "percentage": 50}, {"fiber_type": "竹纸", "percentage": 50}]
    }
]

for tc in test_cases:
    sim = PaperRecommender.calculate_fiber_similarity(tc["target"], tc["paper"])
    print(f"\n  {tc['name']}")
    print(f"    目标: {tc['target']}")
    print(f"    纸张: {tc['paper']}")
    print(f"    相似度: {sim:.2%}")

print("\n" + "=" * 60)
print("三、综合推荐测试 - 模拟古籍修复场景")
print("=" * 60)

mock_papers = [
    {
        "id": 1,
        "name": "仿古皮纸",
        "thickness": 52,
        "ph_value": 7.5,
        "fiber_compositions": [
            {"fiber_type": "楮皮", "percentage": 70},
            {"fiber_type": "三桠", "percentage": 30}
        ]
    },
    {
        "id": 2,
        "name": "纯楮皮纸",
        "thickness": 45,
        "ph_value": 7.2,
        "fiber_compositions": [
            {"fiber_type": "楮皮", "percentage": 100}
        ]
    },
    {
        "id": 3,
        "name": "三桠皮纸",
        "thickness": 40,
        "ph_value": 7.0,
        "fiber_compositions": [
            {"fiber_type": "三桠", "percentage": 100}
        ]
    },
    {
        "id": 4,
        "name": "雁皮纸",
        "thickness": 35,
        "ph_value": 7.3,
        "fiber_compositions": [
            {"fiber_type": "雁皮", "percentage": 100}
        ]
    },
    {
        "id": 5,
        "name": "竹纸",
        "thickness": 65,
        "ph_value": 7.0,
        "fiber_compositions": [
            {"fiber_type": "竹纸", "percentage": 100}
        ]
    },
    {
        "id": 6,
        "name": "皮竹混合纸",
        "thickness": 55,
        "ph_value": 7.1,
        "fiber_compositions": [
            {"fiber_type": "皮纸", "percentage": 60},
            {"fiber_type": "竹纸", "percentage": 40}
        ]
    }
]

test_scenarios = [
    {
        "name": "场景1: 目标是纯楮皮纸（应该推荐仿古皮纸、纯楮皮纸）",
        "target_fibers": [{"fiber_type": "楮皮", "percentage": 100}],
        "target_thickness": 50
    },
    {
        "name": "场景2: 目标是纯三桠纸（应该推荐三桠皮纸、仿古皮纸）",
        "target_fibers": [{"fiber_type": "三桠", "percentage": 100}],
        "target_thickness": 42
    },
    {
        "name": "场景3: 目标是纯麻纸（数据库中没有，应该按厚度推荐）",
        "target_fibers": [{"fiber_type": "麻纸", "percentage": 100}],
        "target_thickness": 50
    }
]

for scenario in test_scenarios:
    print(f"\n{scenario['name']}")
    print(f"  目标纤维: {scenario['target_fibers']}")
    print(f"  目标厚度: {scenario['target_thickness']} g/m²")
    
    recs = PaperRecommender.recommend_papers(
        mock_papers,
        scenario['target_fibers'],
        scenario['target_thickness'],
        top_n=5
    )
    
    print("\n  推荐结果:")
    print(f"  {'排名':<4} {'纸张':<15} {'纤维相似度':<10} {'厚度相似度':<10} {'综合评分':<10} {'推荐依据':<10}")
    print("  " + "-" * 70)
    
    for idx, rec in enumerate(recs):
        match_type = rec.get('match_type', 'fiber')
        match_text = "纤维+厚度" if match_type == 'fiber' else "厚度匹配"
        print(f"  {idx+1:<4} {rec['paper']['name']:<15} {rec['fiber_similarity']:>8.1%}   {rec['thickness_similarity']:>8.1%}   {rec['overall_score']:>8.1%}   {match_text}")

print("\n" + "=" * 60)
print("测试完成！改进说明：")
print("=" * 60)
print("""
1. 纤维分类系统：
   - 皮纸类: 楮皮、三桠、雁皮、桑皮、皮纸
   - 竹纸类: 竹纸
   - 麻纸类: 麻纸
   - 草纸类: 稻草纸

2. 相似度计算改进：
   - 完全匹配: 100%
   - 同类匹配: 60%（如楮皮 vs 三桠）
   - 跨类匹配: 20-30%（如楮皮 vs 竹纸）

3. 智能降级推荐：
   - 先推荐纤维相似度 >= 50% 的纸张
   - 不足时按厚度相似度补充
   - 确保永远有推荐结果

4. 用户提示：
   - 清晰显示推荐依据
   - 不同类型用颜色区分
   - 纤维匹配(绿色) vs 厚度匹配(橙色)
""")
