import sys
sys.path.insert(0, '.')

from game.idiom_game import IdiomDatabase, IdiomMatcher, AIPlayer, normalize_pinyin

print("=" * 60)
print("测试1: 拼音归一化（去声调）")
print("=" * 60)
tests = [
    ("yī", "yi"), ("yì", "yi"), ("fā", "fa"), ("fà", "fa"),
    ("qiáng", "qiang"), ("qiǎng", "qiang"),
    ("lè", "le"), ("yuè", "yue"), ("zhōng", "zhong"),
    ("dǐ", "di"), ("lǜ", "lv"),
]
for raw, expected in tests:
    result = normalize_pinyin(raw)
    status = "✅" if result == expected else "❌"
    print(f"  {status} normalize_pinyin('{raw}') = '{result}' (期望: '{expected}')")

print("\n" + "=" * 60)
print("测试2: 倒排索引 - 字符→拼音映射")
print("=" * 60)
db = IdiomDatabase()
char_tests = [
    ("意", "yi"), ("一", "yi"), ("发", "fa"), ("马", "ma"),
    ("强", "qiang"), ("人", "ren"), ("心", "xin"), ("丁", "ding"),
]
for char, expected_pinyin in char_tests:
    pinyins = db.get_char_pinyins(char)
    found = expected_pinyin in pinyins
    status = "✅" if found else "❌"
    print(f"  {status} '{char}' → {pinyins} (期望包含: '{expected_pinyin}')")

print("\n" + "=" * 60)
print("测试3: 同音接龙匹配")
print("=" * 60)
matcher = IdiomMatcher(db)
chain_tests = [
    ("一心一意", "意气风发", True, "意(yì)→意(yì): 同字同音"),
    ("马到成功", "功成名就", True, "功(gōng)→功(gōng): 同字同音"),
    ("一心一意", "一鼓作气", True, "意(yì)→一(yī): 异字同音yi"),
    ("乐极生悲", "悲天悯人", True, "悲(bēi)→悲(bēi): 同字同音"),
    ("马到成功", "成千上万", False, "功(gōng)→成(chéng): 不同音"),
]
for prev, next_idiom, expected, desc in chain_tests:
    if db.is_valid_idiom(prev) and db.is_valid_idiom(next_idiom):
        result = matcher.can_chain(prev, next_idiom)
        status = "✅" if result == expected else "❌"
        prev_last = matcher.get_idiom_last_pinyin(prev)
        next_first = matcher.get_idiom_first_pinyin(next_idiom)
        print(f"  {status} {prev}→{next_idiom}: {result} (期望: {expected}) [{prev_last}→{next_first}] {desc}")
    else:
        prev_ok = db.is_valid_idiom(prev)
        next_ok = db.is_valid_idiom(next_idiom)
        print(f"  ⚠️ 跳过: '{prev}'({'✅' if prev_ok else '❌'}), '{next_idiom}'({'✅' if next_ok else '❌'}) 不在库中")

print("\n" + "=" * 60)
print("测试4: 拼音首字母倒排索引覆盖度")
print("=" * 60)
total_idioms = len(db.idioms)
indexed_count = 0
for idiom_data in db.idioms:
    idiom = idiom_data['idiom']
    first_norm = normalize_pinyin(idiom_data['pinyin'].split()[0]) if idiom_data['pinyin'].split() else ''
    if first_norm and first_norm in db.first_pinyin_index:
        indexed_count += 1
    else:
        print(f"  ⚠️ 未索引: {idiom} ({idiom_data['pinyin']})")
print(f"  索引覆盖率: {indexed_count}/{total_idioms} ({indexed_count*100//total_idioms}%)")

print("\n" + "=" * 60)
print("测试5: AI能否通过同音找到候选成语")
print("=" * 60)
ai = AIPlayer(db, matcher, 'medium')
sample_tests = ["一心一意", "马到成功", "水落石出"]
for idiom in sample_tests:
    last_pinyin = matcher.get_idiom_last_pinyin(idiom)
    candidates = db.get_idioms_by_first_pinyin(last_pinyin)
    candidate_names = [c['idiom'] for c in candidates[:5]]
    print(f"  '{idiom}' 尾音 '{last_pinyin}' → 候选: {candidate_names}{'...' if len(candidates) > 5 else ''} (共{len(candidates)}个)")

print("\n🎉 测试完成！")
