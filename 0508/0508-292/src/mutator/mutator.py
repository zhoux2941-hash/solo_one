import random
import struct
from typing import List, Optional, Set
from collections import defaultdict


class SmartMutator:
    def __init__(self, dict_path: Optional[str] = None, max_length: int = 4096):
        self.max_length = max_length
        self.dictionary = []
        self.rng = random.Random()
        
        self.byte_impact_map: Dict[int, Set[int]] = defaultdict(set)
        self.byte_hit_count: List[int] = [0] * max_length
        self.byte_new_coverage_count: List[int] = [0] * max_length
        self.total_executions = 0
        
        self.mutation_success_count = defaultdict(int)
        self.mutation_total_count = defaultdict(int)
        
        if dict_path:
            self._load_dictionary(dict_path)
    
    def _load_dictionary(self, dict_path: str):
        try:
            with open(dict_path, 'rb') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith(b'#'):
                        self.dictionary.append(line)
        except Exception as e:
            print(f"Warning: Could not load dictionary: {e}")
    
    def record_execution_result(
        self,
        input_data: bytes,
        covered_edges: Set[int],
        found_new_coverage: bool = False
    ):
        self.total_executions += 1
        
        for byte_pos in range(min(len(input_data), self.max_length)):
            self.byte_hit_count[byte_pos] += 1
            
            for edge in covered_edges:
                self.byte_impact_map[byte_pos].add(edge)
            
            if found_new_coverage:
                self.byte_new_coverage_count[byte_pos] += len(covered_edges)
    
    def record_mutation_success(self, mutation_type: str, success: bool):
        self.mutation_total_count[mutation_type] += 1
        if success:
            self.mutation_success_count[mutation_type] += 1
    
    def get_byte_impact_score(self, byte_pos: int) -> float:
        if byte_pos >= self.max_length:
            return 0.0
        
        hit_count = self.byte_hit_count[byte_pos]
        if hit_count == 0:
            return 0.0
        
        unique_edges = len(self.byte_impact_map.get(byte_pos, set()))
        new_coverage = self.byte_new_coverage_count[byte_pos]
        
        import math
        edge_score = math.log(unique_edges + 1) * 10
        new_coverage_score = math.log(new_coverage + 1) * 5
        
        return edge_score + new_coverage_score
    
    def get_smart_mutation_positions(self, input_length: int, num_positions: int = 5) -> List[int]:
        if input_length == 0:
            return []
        
        scores = []
        for pos in range(min(input_length, self.max_length)):
            score = self.get_byte_impact_score(pos)
            scores.append((pos, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        
        top_positions = [pos for pos, score in scores[:num_positions * 2]]
        
        selected = []
        num_high_impact = min(num_positions, len(top_positions))
        selected.extend(self.rng.sample(top_positions, k=num_high_impact))
        
        remaining = num_positions - num_high_impact
        if remaining > 0 and input_length > len(selected):
            available = [p for p in range(input_length) if p not in selected]
            if available:
                selected.extend(self.rng.sample(available, k=min(remaining, len(available))))
        
        return selected
    
    def get_best_mutation_types(self) -> List[str]:
        types = ['bit_flip', 'byte_flip', 'arith_inc', 'arith_dec', 'dict_insert']
        scores = []
        
        for t in types:
            total = self.mutation_total_count.get(t, 1)
            success = self.mutation_success_count.get(t, 0)
            score = success / total if total > 0 else 0.5
            scores.append((t, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return [t for t, s in scores]
    
    def mutate(self, data: bytes, use_smart: bool = True) -> bytes:
        data = bytearray(data)
        num_mutations = self.rng.randint(1, max(1, min(16, len(data) // 100 + 1)))
        
        mutation_types = [
            ('bit_flip', self._bit_flip),
            ('byte_flip', self._byte_flip),
            ('arith_inc', self._arith_inc),
            ('arith_dec', self._arith_dec),
            ('insert_byte', self._insert_byte),
            ('delete_byte', self._delete_byte),
            ('copy_block', self._copy_block),
        ]
        
        if self.dictionary:
            mutation_types.append(('dict_insert', self._dict_insert))
        
        positions = None
        if use_smart and len(data) > 0:
            positions = self.get_smart_mutation_positions(len(data), num_mutations)
        
        pos_idx = 0
        for _ in range(num_mutations):
            mut_name, mut_func = self.rng.choice(mutation_types)
            
            if positions and pos_idx < len(positions) and hasattr(mut_func, '_use_position'):
                data = mut_func(data, positions[pos_idx])
                pos_idx += 1
            else:
                data = mut_func(data)
        
        if len(data) > self.max_length:
            data = data[:self.max_length]
        
        return bytes(data)
    
    def _bit_flip(self, data: bytearray, position: Optional[int] = None) -> bytearray:
        if len(data) == 0:
            return data
        
        idx = position if position is not None else self.rng.randint(0, len(data) - 1)
        idx = min(idx, len(data) - 1)
        
        bit = self.rng.randint(0, 7)
        data[idx] ^= (1 << bit)
        return data
    
    def _byte_flip(self, data: bytearray, position: Optional[int] = None) -> bytearray:
        if len(data) == 0:
            return data
        
        idx = position if position is not None else self.rng.randint(0, len(data) - 1)
        idx = min(idx, len(data) - 1)
        
        data[idx] ^= 0xff
        return data
    
    def _arith_inc(self, data: bytearray, position: Optional[int] = None) -> bytearray:
        if len(data) == 0:
            return data
        
        idx = position if position is not None else self.rng.randint(0, len(data) - 1)
        idx = min(idx, len(data) - 1)
        
        val = self.rng.randint(1, 32)
        data[idx] = (data[idx] + val) & 0xff
        return data
    
    def _arith_dec(self, data: bytearray, position: Optional[int] = None) -> bytearray:
        if len(data) == 0:
            return data
        
        idx = position if position is not None else self.rng.randint(0, len(data) - 1)
        idx = min(idx, len(data) - 1)
        
        val = self.rng.randint(1, 32)
        data[idx] = (data[idx] - val) & 0xff
        return data
    
    def _insert_byte(self, data: bytearray) -> bytearray:
        if len(data) >= self.max_length:
            return data
        
        idx = self.rng.randint(0, len(data))
        byte = self.rng.randint(0, 255)
        data.insert(idx, byte)
        return data
    
    def _delete_byte(self, data: bytearray) -> bytearray:
        if len(data) <= 1:
            return data
        
        idx = self.rng.randint(0, len(data) - 1)
        del data[idx]
        return data
    
    def _copy_block(self, data: bytearray) -> bytearray:
        if len(data) < 2:
            return data
        
        block_size = self.rng.randint(1, min(64, len(data)))
        src_idx = self.rng.randint(0, len(data) - block_size)
        dst_idx = self.rng.randint(0, len(data))
        
        block = data[src_idx:src_idx + block_size]
        
        if dst_idx + block_size > self.max_length:
            block = block[:self.max_length - dst_idx]
        
        data[dst_idx:dst_idx] = block
        
        if len(data) > self.max_length:
            data = data[:self.max_length]
        
        return data
    
    def _dict_insert(self, data: bytearray) -> bytearray:
        if not self.dictionary:
            return data
        
        dict_entry = self.rng.choice(self.dictionary)
        dict_entry = bytearray(dict_entry)
        
        if len(data) + len(dict_entry) > self.max_length:
            dict_entry = dict_entry[:self.max_length - len(data)]
        
        if not dict_entry:
            return data
        
        idx = self.rng.randint(0, len(data))
        data[idx:idx] = dict_entry
        
        if len(data) > self.max_length:
            data = data[:self.max_length]
        
        return data
    
    def get_impact_heatmap(self) -> List[float]:
        max_score = 1.0
        for pos in range(self.max_length):
            score = self.get_byte_impact_score(pos)
            if score > max_score:
                max_score = score
        
        heatmap = []
        for pos in range(self.max_length):
            heatmap.append(self.get_byte_impact_score(pos) / max_score)
        
        return heatmap
    
    def get_high_impact_regions(self, window_size: int = 8, threshold: float = 0.5) -> List[Tuple[int, int, float]]:
        regions = []
        heatmap = self.get_impact_heatmap()
        
        for start in range(0, self.max_length - window_size, window_size // 2):
            avg_heat = sum(heatmap[start:start + window_size]) / window_size
            if avg_heat >= threshold:
                regions.append((start, start + window_size, avg_heat))
        
        regions.sort(key=lambda x: x[2], reverse=True)
        return regions
    
    def get_statistics(self) -> dict:
        total_high_impact = 0
        total_medium_impact = 0
        
        for pos in range(self.max_length):
            score = self.get_byte_impact_score(pos)
            if score >= 10:
                total_high_impact += 1
            elif score >= 5:
                total_medium_impact += 1
        
        return {
            'total_executions': self.total_executions,
            'high_impact_positions': total_high_impact,
            'medium_impact_positions': total_medium_impact
        }
    
    def generate_seed(self) -> bytes:
        length = self.rng.randint(1, self.max_length // 4)
        return bytes([self.rng.randint(0, 255) for _ in range(length)])
    
    def reset_impact_analysis(self):
        self.byte_impact_map.clear()
        self.byte_hit_count = [0] * self.max_length
        self.byte_new_coverage_count = [0] * self.max_length
        self.total_executions = 0


Mutator = SmartMutator
