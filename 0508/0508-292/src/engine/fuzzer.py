import os
import gc
import time
import hashlib
from dataclasses import dataclass, field
from typing import List, Optional, Callable, Dict, Set
from queue import Queue
import threading
import random

from ..mutator import Mutator
from ..coverage import CoverageTracker


@dataclass
class SeedInfo:
    data: bytes
    hash: str
    size: int
    coverage: Set[int] = field(default_factory=set)
    exec_time: float = 0.0
    score: float = 0.0
    added_at: float = 0.0

    def calculate_score(self) -> float:
        size_factor = 1.0 / (1.0 + self.size / 1000.0)
        speed_factor = 1.0 / (1.0 + self.exec_time * 10.0)
        coverage_factor = len(self.coverage)
        return coverage_factor * size_factor * speed_factor


@dataclass
class FuzzResult:
    total_execs: int = 0
    execs_per_sec: float = 0.0
    coverage_count: int = 0
    crashes_found: int = 0
    hangs_found: int = 0
    corpus_size: int = 0
    last_new_path: float = 0.0


class Fuzzer:
    def __init__(
        self,
        target_path: str,
        corpus_dir: str = "corpus",
        crashes_dir: str = "crashes",
        dict_path: Optional[str] = None,
        timeout: int = 5,
        num_workers: int = 1,
        mem_limit: int = 1024,
        max_corpus_size: int = 10000
    ):
        self.target_path = target_path
        self.corpus_dir = corpus_dir
        self.crashes_dir = crashes_dir
        self.timeout = timeout
        self.num_workers = num_workers
        self.mem_limit = mem_limit
        self.max_corpus_size = max_corpus_size
        
        self.mutator = Mutator(dict_path=dict_path)
        self.coverage_tracker = CoverageTracker()
        
        self.corpus: List[SeedInfo] = []
        self.corpus_hashes: Set[str] = set()
        self.coverage_map: Dict[int, List[str]] = {}
        self.crashes: List[dict] = []
        
        self.running = False
        self.result = FuzzResult()
        self.start_time = 0.0
        self.last_minimize_time = 0.0
        
        self._init_directories()
        self._load_corpus()
    
    def _init_directories(self):
        os.makedirs(self.corpus_dir, exist_ok=True)
        os.makedirs(self.crashes_dir, exist_ok=True)
    
    def _load_corpus(self):
        for filename in os.listdir(self.corpus_dir):
            filepath = os.path.join(self.corpus_dir, filename)
            if os.path.isfile(filepath):
                with open(filepath, 'rb') as f:
                    data = f.read()
                    self._add_seed_to_memory(data, save=False)
        
        if not self.corpus:
            seed = self.mutator.generate_seed()
            self._add_seed_to_memory(seed, save=True)
        
        self._update_corpus_score()
        self.result.corpus_size = len(self.corpus)
    
    def _add_seed_to_memory(self, data: bytes, save: bool = True, coverage: Optional[Set[int]] = None, exec_time: float = 0.0) -> bool:
        data_hash = hashlib.sha256(data).hexdigest()
        
        if data_hash in self.corpus_hashes:
            return False
        
        if len(self.corpus) >= self.max_corpus_size:
            if not self._try_replace_worst_seed(data, data_hash, coverage, exec_time):
                return False
        
        seed_info = SeedInfo(
            data=data,
            hash=data_hash,
            size=len(data),
            coverage=coverage or set(),
            exec_time=exec_time,
            added_at=time.time()
        )
        
        self.corpus.append(seed_info)
        self.corpus_hashes.add(data_hash)
        
        if coverage:
            for edge_id in coverage:
                if edge_id not in self.coverage_map:
                    self.coverage_map[edge_id] = []
                self.coverage_map[edge_id].append(data_hash)
        
        if save:
            self._save_seed_to_disk(data, data_hash)
        
        return True
    
    def _save_seed_to_disk(self, data: bytes, data_hash: str):
        filepath = os.path.join(self.corpus_dir, f"seed_{data_hash}.bin")
        with open(filepath, 'wb') as f:
            f.write(data)
    
    def _save_crash(self, data: bytes, error_msg: Optional[str] = None):
        file_hash = hashlib.sha256(data).hexdigest()
        filepath = os.path.join(self.crashes_dir, f"crash_{file_hash}.bin")
        with open(filepath, 'wb') as f:
            f.write(data)
        
        crash_info = {
            'timestamp': time.time(),
            'hash': file_hash,
            'size': len(data),
            'error': error_msg or 'Unknown crash'
        }
        self.crashes.append(crash_info)
        self.result.crashes_found += 1
    
    def _try_replace_worst_seed(self, new_data: bytes, new_hash: str, coverage: Optional[Set[int]], exec_time: float) -> bool:
        if not coverage or len(coverage) == 0:
            return False
        
        if len(self.corpus) < self.max_corpus_size:
            return True
        
        self._update_corpus_score()
        
        sorted_corpus = sorted(self.corpus, key=lambda s: s.score)
        
        for worst_seed in sorted_corpus:
            seed_coverage_count = len(worst_seed.coverage)
            new_coverage_count = len(coverage)
            
            if new_coverage_count > seed_coverage_count * 0.5:
                self._remove_seed(worst_seed)
                return True
            
            if len(new_data) < worst_seed.size and new_coverage_count >= seed_coverage_count:
                self._remove_seed(worst_seed)
                return True
        
        return False
    
    def _remove_seed(self, seed_info: SeedInfo):
        if seed_info.hash not in self.corpus_hashes:
            return
        
        for edge_id in seed_info.coverage:
            if edge_id in self.coverage_map:
                try:
                    self.coverage_map[edge_id].remove(seed_info.hash)
                    if not self.coverage_map[edge_id]:
                        del self.coverage_map[edge_id]
                except ValueError:
                    pass
        
        try:
            self.corpus.remove(seed_info)
            self.corpus_hashes.remove(seed_info.hash)
        except ValueError:
            pass
        
        filepath = os.path.join(self.corpus_dir, f"seed_{seed_info.hash}.bin")
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass
    
    def _update_corpus_score(self):
        for seed in self.corpus:
            seed.score = seed.calculate_score()
    
    def _minimize_corpus(self):
        if len(self.corpus) <= self.max_corpus_size // 2:
            return
        
        essential_edges: Set[int] = set()
        essential_seeds: Set[str] = set()
        
        for edge_id, seed_hashes in self.coverage_map.items():
            if len(seed_hashes) == 1:
                essential_seeds.add(seed_hashes[0])
                essential_edges.add(edge_id)
        
        seeds_to_remove = []
        for seed in self.corpus:
            if seed.hash not in essential_seeds:
                seeds_to_remove.append(seed)
        
        seeds_to_remove.sort(key=lambda s: s.score)
        
        target_size = max(len(essential_seeds), self.max_corpus_size // 2)
        while len(self.corpus) > target_size and seeds_to_remove:
            seed_to_remove = seeds_to_remove.pop(0)
            self._remove_seed(seed_to_remove)
        
        gc.collect()
    
    def _check_memory(self) -> bool:
        try:
            import psutil
            process = psutil.Process(os.getpid())
            mem_mb = process.memory_info().rss / 1024 / 1024
            if mem_mb > self.mem_limit:
                return True
        except:
            pass
        return False
    
    def _select_seed(self) -> bytes:
        if not self.corpus:
            return self.mutator.generate_seed()
        
        if len(self.corpus) < 100:
            return random.choice(self.corpus).data
        
        self._update_corpus_score()
        total_score = sum(s.score for s in self.corpus)
        
        if total_score == 0:
            return random.choice(self.corpus).data
        
        r = random.uniform(0, total_score)
        cumulative = 0
        for seed in self.corpus:
            cumulative += seed.score
            if r <= cumulative:
                return seed.data
        
        return self.corpus[-1].data
    
    def _run_single(self, input_data: bytes) -> bool:
        from .forkserver import ForkServer
        
        shm_name = self.coverage_tracker.setup_shared_memory()
        fork_server = ForkServer(self.target_path, self.timeout, self.mem_limit // 2)
        
        try:
            return_code, elapsed, crashed, error_msg = fork_server.spawn_target(
                input_data,
                shm_name
            )
            
            if crashed:
                if elapsed >= self.timeout * 0.9:
                    self.result.hangs_found += 1
                else:
                    self._save_crash(input_data, error_msg)
                return False
            
            has_new, new_edges = self.coverage_tracker.has_new_coverage()
            
            current_edges = self.coverage_tracker.get_coverage()
            
            self.mutator.record_execution_result(
                input_data,
                current_edges,
                has_new
            )
            
            if has_new:
                self._add_seed_to_memory(input_data, save=True, coverage=set(new_edges), exec_time=elapsed)
                self.result.corpus_size = len(self.corpus)
                self.result.last_new_path = time.time()
            
            return has_new
            
        finally:
            fork_server.cleanup()
            self.coverage_tracker.cleanup_shared_memory()
    
    def fuzz_loop(self, status_callback: Optional[Callable] = None, max_execs: Optional[int] = None):
        self.running = True
        self.start_time = time.time()
        
        while self.running:
            if max_execs and self.result.total_execs >= max_execs:
                break
            
            seed = self._select_seed()
            mutated_data = self.mutator.mutate(seed)
            
            self._run_single(mutated_data)
            
            self.result.total_execs += 1
            
            elapsed = time.time() - self.start_time
            self.result.execs_per_sec = self.result.total_execs / elapsed if elapsed > 0 else 0
            self.result.coverage_count = self.coverage_tracker.get_coverage_count()
            
            if status_callback and self.result.total_execs % 100 == 0:
                status_callback(self.result)
            
            if self.result.total_execs % 1000 == 0:
                gc.collect()
            
            if self.result.total_execs % 10000 == 0:
                if time.time() - self.last_minimize_time > 300:
                    self._minimize_corpus()
                    self.last_minimize_time = time.time()
            
            if self.result.total_execs % 5000 == 0 and self._check_memory():
                self._minimize_corpus()
                if self._check_memory():
                    break
    
    def stop(self):
        self.running = False
        gc.collect()
    
    def get_status(self) -> FuzzResult:
        return self.result
    
    def get_crashes(self) -> List[dict]:
        return self.crashes
