import json
import random
import os


_TONE_MARK_MAP = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
    'ń': 'n', 'ň': 'n', 'ǹ': 'n',
    'ḿ': 'm',
    'Ń': 'N', 'Ň': 'N', 'Ǹ': 'N',
}


def normalize_pinyin(pinyin_with_tone):
    base = []
    for ch in pinyin_with_tone:
        if ch in _TONE_MARK_MAP:
            base.append(_TONE_MARK_MAP[ch])
        else:
            base.append(ch)
    return ''.join(base)


def extract_pinyin_parts(pinyin_str):
    parts = pinyin_str.strip().split()
    normalized = [normalize_pinyin(p) for p in parts]
    return parts, normalized


def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


class TrieNode:
    __slots__ = ('children', 'idioms')

    def __init__(self):
        self.children = {}
        self.idioms = []


class PinyinTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, pinyin_str, idiom_data):
        node = self.root
        for ch in pinyin_str:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.idioms.append(idiom_data)

    def search(self, pinyin_str):
        node = self.root
        for ch in pinyin_str:
            if ch not in node.children:
                return []
            node = node.children[ch]
        return node.idioms

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]
        return self._collect_all_idioms(node)

    def _collect_all_idioms(self, node):
        result = list(node.idioms)
        for child in node.children.values():
            result.extend(self._collect_all_idioms(child))
        return result


class IdiomDatabase:
    def __init__(self, data_path=None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'idioms.json')
        self.idioms = self._load_idioms(data_path)
        self.idiom_dict = {item['idiom']: item for item in self.idioms}
        self._build_indexes()

    def _load_idioms(self, data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data['idioms']

    def _build_indexes(self):
        self.first_pinyin_index = {}
        self.last_pinyin_index = {}
        self.char_to_pinyin = {}
        self.first_pinyin_trie = PinyinTrie()
        self.idiom_trie = PinyinTrie()

        for idiom_data in self.idioms:
            idiom = idiom_data['idiom']
            raw_parts, norm_parts = extract_pinyin_parts(idiom_data['pinyin'])

            if not norm_parts:
                continue

            first_norm = norm_parts[0]
            if first_norm not in self.first_pinyin_index:
                self.first_pinyin_index[first_norm] = []
            self.first_pinyin_index[first_norm].append(idiom_data)

            self.first_pinyin_trie.insert(first_norm, idiom_data)

            self.idiom_trie.insert(idiom, idiom_data)

            first_char = idiom[0]
            if first_char not in self.char_to_pinyin:
                self.char_to_pinyin[first_char] = set()
            self.char_to_pinyin[first_char].add(first_norm)

            last_norm = norm_parts[-1]
            if last_norm not in self.last_pinyin_index:
                self.last_pinyin_index[last_norm] = []
            self.last_pinyin_index[last_norm].append(idiom_data)

            last_char = idiom[-1]
            if last_char not in self.char_to_pinyin:
                self.char_to_pinyin[last_char] = set()
            self.char_to_pinyin[last_char].add(last_norm)

            for i, char in enumerate(idiom):
                if i < len(norm_parts):
                    if char not in self.char_to_pinyin:
                        self.char_to_pinyin[char] = set()
                    self.char_to_pinyin[char].add(norm_parts[i])

    def is_valid_idiom(self, idiom):
        return idiom in self.idiom_dict

    def get_idiom_info(self, idiom):
        return self.idiom_dict.get(idiom)

    def get_idioms_by_first_pinyin(self, norm_pinyin):
        return self.first_pinyin_trie.search(norm_pinyin)

    def get_idioms_by_first_pinyin_prefix(self, prefix):
        return self.first_pinyin_trie.starts_with(prefix)

    def get_char_pinyins(self, char):
        return self.char_to_pinyin.get(char, set())

    def get_all_idioms(self):
        return self.idioms

    def suggest_similar_idioms(self, input_str, max_suggestions=3, max_distance=2):
        if not input_str or len(input_str) < 2:
            return []

        candidates = []
        input_len = len(input_str)

        for idiom_data in self.idioms:
            idiom = idiom_data['idiom']
            idiom_len = len(idiom)

            if abs(idiom_len - input_len) > max_distance:
                continue

            distance = levenshtein_distance(input_str, idiom)

            if distance <= max_distance:
                candidates.append((distance, idiom_data))

        candidates.sort(key=lambda x: x[0])

        return [item[1] for item in candidates[:max_suggestions]]


class IdiomMatcher:
    def __init__(self, database):
        self.database = database

    def get_idiom_first_pinyin(self, idiom):
        info = self.database.get_idiom_info(idiom)
        if info:
            _, norm_parts = extract_pinyin_parts(info['pinyin'])
            if norm_parts:
                return norm_parts[0]
        return ''

    def get_idiom_last_pinyin(self, idiom):
        info = self.database.get_idiom_info(idiom)
        if info:
            _, norm_parts = extract_pinyin_parts(info['pinyin'])
            if norm_parts:
                return norm_parts[-1]
        return ''

    def can_chain(self, prev_idiom, next_idiom):
        prev_last = self.get_idiom_last_pinyin(prev_idiom)
        next_first = self.get_idiom_first_pinyin(next_idiom)
        return prev_last != '' and prev_last == next_first


class AIPlayer:
    def __init__(self, database, matcher, difficulty='medium'):
        self.database = database
        self.matcher = matcher
        self.difficulty = difficulty
        self.used_idioms = set()

    def set_difficulty(self, difficulty):
        self.difficulty = difficulty

    def reset_used_idioms(self):
        self.used_idioms = set()

    def _filter_by_difficulty(self, idioms):
        if self.difficulty == 'easy':
            return [i for i in idioms if i['difficulty'] == 'easy']
        elif self.difficulty == 'medium':
            return [i for i in idioms if i['difficulty'] in ['easy', 'medium']]
        else:
            return idioms

    def get_next_idiom(self, last_idiom):
        last_pinyin = self.matcher.get_idiom_last_pinyin(last_idiom)
        if not last_pinyin:
            return None

        candidates = self.database.get_idioms_by_first_pinyin(last_pinyin)
        candidates = [c for c in candidates if c['idiom'] not in self.used_idioms]

        if not candidates:
            return None

        filtered = self._filter_by_difficulty(candidates)
        if not filtered:
            filtered = candidates

        chosen = random.choice(filtered)
        self.used_idioms.add(chosen['idiom'])
        return chosen


class IdiomGame:
    def __init__(self, difficulty='medium'):
        self.database = IdiomDatabase()
        self.matcher = IdiomMatcher(self.database)
        self.ai_player = AIPlayer(self.database, self.matcher, difficulty)

        self.current_idiom = None
        self.chain_length = 0
        self.used_idioms = set()
        self.is_player_turn = True
        self.game_over = False
        self.difficulty = difficulty

    def start_game(self, player_first=True):
        self.chain_length = 0
        self.used_idioms = set()
        self.ai_player.reset_used_idioms()
        self.game_over = False
        self.is_player_turn = player_first

        if not player_first:
            self.current_idiom = self._get_random_start_idiom()
            self.used_idioms.add(self.current_idiom['idiom'])
            self.chain_length = 1
            self.is_player_turn = True

        return self.current_idiom

    def _get_random_start_idiom(self):
        easy_idioms = [i for i in self.database.get_all_idioms() if i['difficulty'] == 'easy']
        return random.choice(easy_idioms)

    def set_difficulty(self, difficulty):
        self.difficulty = difficulty
        self.ai_player.set_difficulty(difficulty)

    def player_input(self, idiom):
        if self.game_over:
            return {'success': False, 'message': '游戏已结束，请重新开始'}

        if not self.is_player_turn:
            return {'success': False, 'message': '不是你的回合'}

        if not self.database.is_valid_idiom(idiom):
            suggestions = self.database.suggest_similar_idioms(idiom, max_suggestions=3)
            message = f'"{idiom}" 不在成语库中'
            if suggestions:
                suggestion_str = '、'.join([f"{s['idiom']}" for s in suggestions])
                message += f'\n💡 你是不是想找：{suggestion_str}？'
            return {'success': False, 'message': message, 'suggestions': suggestions}

        if idiom in self.used_idioms:
            return {'success': False, 'message': f'"{idiom}" 已经使用过了'}

        if self.current_idiom:
            if not self.matcher.can_chain(self.current_idiom['idiom'], idiom):
                last_pinyin = self.matcher.get_idiom_last_pinyin(self.current_idiom['idiom'])
                current_pinyin = self.matcher.get_idiom_first_pinyin(idiom)
                return {
                    'success': False,
                    'message': f'接龙失败！需要接 "{self.current_idiom["idiom"][-1]}" ({last_pinyin})，你输入的 "{idiom[0]}" ({current_pinyin}) 不匹配'
                }

        self.current_idiom = self.database.get_idiom_info(idiom)
        self.used_idioms.add(idiom)
        self.chain_length += 1
        self.is_player_turn = False

        return {
            'success': True,
            'message': '接龙成功！',
            'idiom_info': self.current_idiom,
            'chain_length': self.chain_length
        }

    def ai_play(self):
        if self.game_over:
            return {'success': False, 'message': '游戏已结束'}

        if self.is_player_turn:
            return {'success': False, 'message': '不是AI的回合'}

        ai_idiom = self.ai_player.get_next_idiom(self.current_idiom['idiom'])

        if ai_idiom is None:
            self.game_over = True
            return {
                'success': False,
                'message': 'AI接不上了！你赢了！',
                'winner': 'player'
            }

        while ai_idiom['idiom'] in self.used_idioms:
            ai_idiom = self.ai_player.get_next_idiom(self.current_idiom['idiom'])
            if ai_idiom is None:
                self.game_over = True
                return {
                    'success': False,
                    'message': 'AI接不上了！你赢了！',
                    'winner': 'player'
                }

        self.current_idiom = ai_idiom
        self.used_idioms.add(ai_idiom['idiom'])
        self.chain_length += 1
        self.is_player_turn = True

        return {
            'success': True,
            'message': 'AI接龙成功！',
            'idiom_info': ai_idiom,
            'chain_length': self.chain_length
        }

    def query_idiom(self, idiom):
        idiom_info = self.database.get_idiom_info(idiom)
        if idiom_info:
            return {
                'found': True,
                'idiom': idiom_info['idiom'],
                'pinyin': idiom_info['pinyin'],
                'meaning': idiom_info['meaning'],
                'difficulty': idiom_info['difficulty']
            }
        suggestions = self.database.suggest_similar_idioms(idiom, max_suggestions=3)
        result = {'found': False, 'message': f'未找到成语 "{idiom}"'}
        if suggestions:
            result['suggestions'] = suggestions
            suggestion_str = '、'.join([f"{s['idiom']}" for s in suggestions])
            result['message'] += f'\n💡 你是不是想找：{suggestion_str}？'
        return result

    def get_game_status(self):
        return {
            'current_idiom': self.current_idiom,
            'chain_length': self.chain_length,
            'is_player_turn': self.is_player_turn,
            'game_over': self.game_over,
            'difficulty': self.difficulty,
            'used_count': len(self.used_idioms)
        }
