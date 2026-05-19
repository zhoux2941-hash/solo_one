import hashlib
import struct
from typing import Dict, Set, List, Tuple, Optional
from collections import defaultdict
import math


class ByteImpactAnalyzer:
    def __init__(self, input_size_limit: int = 4096):
        self.input_size_limit = input_size_limit
        
        self.byte_impact_map: Dict[int, Set[int]] = defaultdict(set)
        self.byte_hit_count: Dict[int, int] = defaultdict(int)
        self.byte_new_coverage_count: Dict[int, int] = defaultdict(int)
        
        self.edge_to_bytes: Dict[int, Set[int]] = defaultdict(set)
        
        self.position_heatmap: List[int] = [0] * input_size_limit
        
        self.total_executions = 0
        self.total_new_coverage = 0
        
        self.impact_cache = {}
    
    def record_execution(
        self,
        input_data: bytes,
        covered_edges: Set[int],
        is_new_coverage: bool = False
    ):
        self.total_executions += 1
        
        if is_new_coverage:
            self.total_new_coverage += len(covered_edges)
        
        for byte_pos in range(min(len(input_data), self.input_size_limit)):
            byte_value = input_data[byte_pos]
            
            for edge in covered_edges:
                self.byte_impact_map[byte_pos].add(edge)
                self.edge_to_bytes[edge].add(byte_pos)
            
            self.byte_hit_count[byte_pos] += 1
            
            if is_new_coverage:
                self.byte_new_coverage_count[byte_pos] += len(covered_edges)
                self.position_heatmap[byte_pos] += len(covered_edges)
    
    def get_byte_impact_score(self, byte_pos: int) -> float:
        if byte_pos >= self.input_size_limit:
            return 0.0
        
        hit_count = self.byte_hit_count.get(byte_pos, 0)
        if hit_count == 0:
            return 0.0
        
        unique_edges = len(self.byte_impact_map.get(byte_pos, set()))
        new_coverage = self.byte_new_coverage_count.get(byte_pos, 0)
        
        edge_score = math.log(unique_edges + 1) * 10
        new_coverage_score = math.log(new_coverage + 1) * 5
        
        return edge_score + new_coverage_score
    
    def get_high_impact_positions(self, threshold: float = 5.0, top_n: Optional[int] = None) -> List[Tuple[int, float]]:
        scores = []
        for pos in range(self.input_size_limit):
            score = self.get_byte_impact_score(pos)
            if score >= threshold:
                scores.append((pos, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        
        if top_n:
            return scores[:top_n]
        return scores
    
    def get_low_impact_positions(self, max_positions: int = 100) -> List[int]:
        low_impact = []
        for pos in range(self.input_size_limit):
            if self.byte_hit_count.get(pos, 0) == 0:
                low_impact.append(pos)
                if len(low_impact) >= max_positions:
                    break
        return low_impact
    
    def get_positions_for_edge(self, edge_id: int) -> Set[int]:
        return self.edge_to_bytes.get(edge_id, set())
    
    def get_heatmap_normalized(self) -> List[float]:
        max_heat = max(self.position_heatmap) if self.position_heatmap else 1
        if max_heat == 0:
            max_heat = 1
        return [h / max_heat for h in self.position_heatmap]
    
    def get_most_influential_bytes(self, top_n: int = 20) -> List[Tuple[int, float, int]]:
        results = []
        for pos in range(self.input_size_limit):
            score = self.get_byte_impact_score(pos)
            edges = len(self.byte_impact_map.get(pos, set()))
            results.append((pos, score, edges))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_n]
    
    def suggest_mutation_positions(
        self,
        input_length: int,
        num_positions: int = 5,
        exploration_ratio: float = 0.3
    ) -> List[int]:
        if input_length == 0:
            return []
        
        num_explore = int(num_positions * exploration_ratio)
        num_exploit = num_positions - num_explore
        
        exploit_positions = []
        high_impact = self.get_high_impact_positions(top_n=num_exploit * 2)
        
        for pos, score in high_impact:
            if pos < input_length:
                exploit_positions.append(pos)
                if len(exploit_positions) >= num_exploit:
                    break
        
        explore_positions = []
        for _ in range(num_explore):
            import random
            explore_positions.append(random.randint(0, min(input_length - 1, self.input_size_limit - 1)))
        
        all_positions = list(set(exploit_positions + explore_positions))
        all_positions.sort()
        
        return all_positions
    
    def get_impact_clusters(self) -> Dict[str, List[int]]:
        high_impact = []
        medium_impact = []
        low_impact = []
        no_impact = []
        
        for pos in range(self.input_size_limit):
            score = self.get_byte_impact_score(pos)
            if score >= 10:
                high_impact.append(pos)
            elif score >= 5:
                medium_impact.append(pos)
            elif score >= 1:
                low_impact.append(pos)
            else:
                no_impact.append(pos)
        
        return {
            'high': high_impact,
            'medium': medium_impact,
            'low': low_impact,
            'none': no_impact
        }
    
    def get_statistics(self) -> Dict:
        clusters = self.get_impact_clusters()
        
        return {
            'total_executions': self.total_executions,
            'total_new_coverage': self.total_new_coverage,
            'high_impact_positions': len(clusters['high']),
            'medium_impact_positions': len(clusters['medium']),
            'low_impact_positions': len(clusters['low']),
            'no_impact_positions': len(clusters['none']),
            'avg_impact_per_byte': sum(
                self.get_byte_impact_score(p) for p in range(self.input_size_limit)
            ) / self.input_size_limit
        }
    
    def merge_with(self, other: 'ByteImpactAnalyzer'):
        for pos, edges in other.byte_impact_map.items():
            self.byte_impact_map[pos].update(edges)
        
        for pos, count in other.byte_hit_count.items():
            self.byte_hit_count[pos] += count
        
        for pos, count in other.byte_new_coverage_count.items():
            self.byte_new_coverage_count[pos] += count
        
        for edge, positions in other.edge_to_bytes.items():
            self.edge_to_bytes[edge].update(positions)
        
        for i in range(min(len(self.position_heatmap), len(other.position_heatmap))):
            self.position_heatmap[i] += other.position_heatmap[i]
        
        self.total_executions += other.total_executions
        self.total_new_coverage += other.total_new_coverage
    
    def reset(self):
        self.byte_impact_map.clear()
        self.byte_hit_count.clear()
        self.byte_new_coverage_count.clear()
        self.edge_to_bytes.clear()
        self.position_heatmap = [0] * self.input_size_limit
        self.total_executions = 0
        self.total_new_coverage = 0
        self.impact_cache.clear()
