import sys
import time
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, '.')

from game import (
    IdiomDatabase, IdiomMatcher, PinyinTrie,
    normalize_pinyin, levenshtein_distance
)

print("=" * 70)
print("测试1: Trie树基础功能")
print("=" * 70)

trie = PinyinTrie()
test_data = [
    ("yi", {"idiom": "一心一意"}),
    ("yi", {"idiom": "意气风发"}),
    ("yi", {"idiom": "一鼓作气"}),
    ("gong", {"idiom": "功成名就"}),
    ("gong", {"idiom": "工欲善其事"}),
    ("ma", {"idiom": "马到成功"}),
]
for pinyin, idiom in test_data:
    trie.insert(pinyin, idiom)

search_tests = [
    ("yi", 3),
    ("gong", 2),
    ("ma", 1),
    ("xxx", 0),
]
for pinyin, expected_count in search_tests:
    result = trie.search(pinyin)
    status = "✅" if len(result) == expected_count else "❌"
    print(f"  {status} trie.search('{pinyin}') = {len(result)} 条 (期望: {expected_count})")

prefix_tests = [
    ("y", 3),
    ("g", 2),
    ("gon", 2),
    ("z", 0),
]
for prefix, expected_count in prefix_tests:
    result = trie.starts_with(prefix)
    status = "✅" if len(result) == expected_count else "❌"
    print(f"  {status} trie.starts_with('{prefix}') = {len(result)} 条 (期望: {expected_count})")

print("\n" + "=" * 70)
print("测试2: 编辑距离算法 (Levenshtein)")
print("=" * 70)

distance_tests = [
    ("一心一意", "一亿一意", 1),
    ("一心一意", "一心一义", 1),
    ("马到成功", "马到成攻", 1),
    ("马到成功", "马道成功", 1),
    ("水落石出", "水落石初", 1),
    ("一心一意", "三心二意", 2),
    ("成千上万", "成千成万", 1),
    ("成千上万", "成百上千", 2),
    ("人杰地灵", "人杰地陵", 1),
    ("人杰地灵", "地灵人杰", 4),
]
for s1, s2, expected in distance_tests:
    dist = levenshtein_distance(s1, s2)
    status = "✅" if dist == expected else "❌"
    print(f"  {status} distance('{s1}', '{s2}') = {dist} (期望: {expected})")

print("\n" + "=" * 70)
print("测试3: 成语库Trie索引构建与查询")
print("=" * 70)

db = IdiomDatabase()

pinyin_queries = [
    "yi", "gong", "ma", "ren", "xin", "shi", "tian", "di"
]
total_trie_time = 0
total_dict_time = 0

for pinyin in pinyin_queries:
    t0 = time.time()
    trie_result = db.get_idioms_by_first_pinyin(pinyin)
    t1 = time.time()
    trie_time = (t1 - t0) * 1000

    t0 = time.time()
    dict_result = db.first_pinyin_index.get(pinyin, [])
    t1 = time.time()
    dict_time = (t1 - t0) * 1000

    total_trie_time += trie_time
    total_dict_time += dict_time

    match = "✅" if len(trie_result) == len(dict_result) else "❌"
    print(f"  {match} '{pinyin}': Trie={len(trie_result)} ({trie_time:.4f}ms) | Dict={len(dict_result)} ({dict_time:.4f}ms)")

print(f"\n  平均查询时间: Trie={total_trie_time/len(pinyin_queries):.4f}ms | Dict={total_dict_time/len(pinyin_queries):.4f}ms")

print("\n" + "=" * 70)
print("测试4: 成语推荐功能 (编辑距离模糊匹配)")
print("=" * 70)

recommend_tests = [
    "一亿一意",
    "马道成功",
    "水落石初",
    "三心二意",
    "成千成万",
    "人杰地陵",
    "成百上千",
    "一心一义",
]

for wrong_input in recommend_tests:
    suggestions = db.suggest_similar_idioms(wrong_input, max_suggestions=3)
    if suggestions:
        names = [s['idiom'] for s in suggestions]
        distances = [levenshtein_distance(wrong_input, s['idiom']) for s in suggestions]
        print(f"  输入: '{wrong_input}' → 推荐: {names} (距离: {distances})")
    else:
        print(f"  输入: '{wrong_input}' → 无推荐")

print("\n" + "=" * 70)
print("测试5: AIPlayer使用Trie查找候选 (性能验证)")
print("=" * 70)

matcher = IdiomMatcher(db)
from game import AIPlayer

ai = AIPlayer(db, matcher, 'medium')
test_idioms = ["一心一意", "马到成功", "水落石出", "海阔天空", "万众一心"]

for idiom in test_idioms:
    info = db.get_idiom_info(idiom)
    if info:
        last_pinyin = matcher.get_idiom_last_pinyin(idiom)
        t0 = time.time()
        candidates = db.get_idioms_by_first_pinyin(last_pinyin)
        t1 = time.time()
        lookup_time = (t1 - t0) * 1000
        print(f"  '{idiom}' 尾音 '{last_pinyin}' → {len(candidates)} 个候选 (查询耗时: {lookup_time:.4f}ms)")
        if candidates:
            sample = candidates[:3]
            print(f"     示例: {[c['idiom'] for c in sample]}")

print("\n" + "=" * 70)
print("测试6: IdiomGame完整流程验证")
print("=" * 70)

from game import IdiomGame

game = IdiomGame('medium')
start_idiom = game.start_game(player_first=False)
print(f"  AI开头: {start_idiom['idiom']} - {start_idiom['meaning'][:30]}...")

test_inputs = [
    ("一心一意", True, "测试正常接龙"),
    ("一亿一意", False, "测试不存在的成语，应返回推荐"),
]

for input_str, should_success, desc in test_inputs:
    result = game.player_input(input_str)
    if 'suggestions' in result:
        sug_names = [s['idiom'] for s in result['suggestions']]
        print(f"  {desc}: '{input_str}' → success={result['success']}, 推荐={sug_names} ✅")
    else:
        print(f"  {desc}: '{input_str}' → success={result['success']} {'✅' if result['success'] == should_success else '❌'}")

print("\n🎉 所有测试完成！")
