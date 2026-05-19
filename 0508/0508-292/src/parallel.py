import os
import sys
import gc
import hashlib
import multiprocessing as mp
from multiprocessing import Process, Queue, Lock
import time
from typing import Optional, List, Dict, Set
import threading
import random

from .mutator import Mutator
from .coverage import CoverageTracker
from .engine.forkserver import ForkServer


class SeedInfo:
    def __init__(self, data: bytes, data_hash: str):
        self.data = data
        self.hash = data_hash
        self.size = len(data)
        self.coverage: Set[int] = set()
        self.exec_time: float = 0.0
        self.score: float = 0.0
        self.added_at: float = time.time()

    def calculate_score(self) -> float:
        size_factor = 1.0 / (1.0 + self.size / 1000.0)
        speed_factor = 1.0 / (1.0 + self.exec_time * 10.0)
        coverage_factor = len(self.coverage)
        return coverage_factor * size_factor * speed_factor


class WorkerProcess:
    def __init__(
        self,
        worker_id: int,
        target_path: str,
        task_queue: Queue,
        result_queue: Queue,
        corpus_lock: Lock,
        dict_path: Optional[str] = None,
        timeout: int = 5,
        mem_limit: int = 1024
    ):
        self.worker_id = worker_id
        self.target_path = target_path
        self.task_queue = task_queue
        self.result_queue = result_queue
        self.corpus_lock = corpus_lock
        self.timeout = timeout
        self.mem_limit = mem_limit
        
        self.mutator = Mutator(dict_path=dict_path)
        self.coverage_tracker = CoverageTracker()
        self.running = True
        self.exec_count = 0
    
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
    
    def run(self):
        shm_name = self.coverage_tracker.setup_shared_memory()
        fork_server = ForkServer(self.target_path, self.timeout, self.mem_limit // 2)
        
        try:
            while self.running:
                try:
                    seed = self.task_queue.get(timeout=1)
                except:
                    continue
                
                mutated_data = self.mutator.mutate(seed)
                
                self.coverage_tracker.reset_map()
                
                return_code, elapsed, crashed, error_msg = fork_server.spawn_target(
                    mutated_data,
                    shm_name
                )
                
                has_new, new_edges = self.coverage_tracker.has_new_coverage()
                
                result = {
                    'worker_id': self.worker_id,
                    'crashed': crashed,
                    'timed_out': elapsed >= self.timeout * 0.9,
                    'has_new_coverage': has_new,
                    'new_edges': list(new_edges) if has_new else [],
                    'data': mutated_data if has_new or crashed else b'',
                    'error_msg': error_msg,
                    'elapsed': elapsed
                }
                
                try:
                    self.result_queue.put(result, timeout=0.5)
                except:
                    pass
                
                self.exec_count += 1
                
                if self.exec_count % 1000 == 0:
                    gc.collect()
                
                if self.exec_count % 5000 == 0 and self._check_memory():
                    break
        
        finally:
            fork_server.cleanup()
            self.coverage_tracker.cleanup_shared_memory()
            gc.collect()


class ParallelFuzzer:
    def __init__(
        self,
        target_path: str,
        corpus_dir: str = "corpus",
        crashes_dir: str = "crashes",
        dict_path: Optional[str] = None,
        timeout: int = 5,
        num_workers: Optional[int] = None,
        mem_limit: int = 1024,
        max_corpus_size: int = 10000
    ):
        self.target_path = target_path
        self.corpus_dir = corpus_dir
        self.crashes_dir = crashes_dir
        self.dict_path = dict_path
        self.timeout = timeout
        self.mem_limit = mem_limit
        self.max_corpus_size = max_corpus_size
        
        if num_workers is None:
            self.num_workers = max(1, mp.cpu_count() - 1)
        else:
            self.num_workers = num_workers
        
        self.corpus: List[SeedInfo] = []
        self.corpus_hashes: Set[str] = set()
        self.coverage_map: Dict[int, List[str]] = {}
        self.crashes: List[dict] = []
        
        self.task_queue = Queue(maxsize=500)
        self.result_queue = Queue(maxsize=1000)
        self.corpus_lock = Lock()
        
        self.workers: List[Process] = []
        self.running = False
        
        self.total_execs = 0
        self.coverage_count = 0
        self.crashes_found = 0
        self.hangs_found = 0
        self.start_time = 0.0
        self.last_minimize_time = 0.0
        
        self.mutator = Mutator(dict_path=self.dict_path)
        
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
            mutator = Mutator()
            seed = mutator.generate_seed()
            self._add_seed_to_memory(seed, save=True)
        
        self._update_corpus_score()
    
    def _add_seed_to_memory(self, data: bytes, save: bool = True, coverage: Optional[Set[int]] = None, exec_time: float = 0.0) -> bool:
        data_hash = hashlib.sha256(data).hexdigest()
        
        if data_hash in self.corpus_hashes:
            return False
        
        if len(self.corpus) >= self.max_corpus_size:
            if not self._try_replace_worst_seed(data, data_hash, coverage, exec_time):
                return False
        
        seed_info = SeedInfo(data, data_hash)
        seed_info.coverage = coverage or set()
        seed_info.exec_time = exec_time
        
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
    
    def _clear_queue(self, queue: Queue):
        while not queue.empty():
            try:
                queue.get_nowait()
            except:
                break
    
    def _select_seed(self) -> bytes:
        if not self.corpus:
            mutator = Mutator()
            return mutator.generate_seed()
        
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
    
    def _feed_workers(self):
        while self.running:
            if not self.task_queue.full():
                with self.corpus_lock:
                    seed = self._select_seed()
                try:
                    self.task_queue.put(seed, timeout=0.1)
                except:
                    pass
            else:
                time.sleep(0.01)
    
    def _process_results(self, status_callback=None):
        while self.running:
            try:
                result = self.result_queue.get(timeout=1)
            except:
                continue
            
            self.total_execs += 1
            
            if result['crashed']:
                if result['timed_out']:
                    self.hangs_found += 1
                elif result['data']:
                    with self.corpus_lock:
                        self._save_crash(result['data'], result['error_msg'])
                        self.crashes_found += 1
            
            if result['has_new_coverage'] and result['data']:
                with self.corpus_lock:
                    self.mutator.record_execution_result(
                        result['data'],
                        set(result['new_edges']),
                        True
                    )
                    self._add_seed_to_memory(
                        result['data'],
                        save=True,
                        coverage=set(result['new_edges']),
                        exec_time=result['elapsed']
                    )
                    self.coverage_count += len(result['new_edges'])
            
            if status_callback and self.total_execs % 100 == 0:
                status_callback(self.get_status())
            
            if self.total_execs % 10000 == 0:
                if time.time() - self.last_minimize_time > 300:
                    with self.corpus_lock:
                        self._minimize_corpus()
                    self.last_minimize_time = time.time()
    
    def start(self, status_callback=None):
        self.running = True
        self.start_time = time.time()
        
        self._clear_queue(self.task_queue)
        self._clear_queue(self.result_queue)
        
        for i in range(self.num_workers):
            worker = WorkerProcess(
                worker_id=i,
                target_path=self.target_path,
                task_queue=self.task_queue,
                result_queue=self.result_queue,
                corpus_lock=self.corpus_lock,
                dict_path=self.dict_path,
                timeout=self.timeout,
                mem_limit=self.mem_limit
            )
            
            p = Process(target=worker.run, daemon=True)
            p.start()
            self.workers.append(p)
        
        feeder_thread = threading.Thread(target=self._feed_workers, daemon=True)
        feeder_thread.start()
        
        processor_thread = threading.Thread(
            target=self._process_results,
            args=(status_callback,),
            daemon=True
        )
        processor_thread.start()
    
    def stop(self):
        self.running = False
        
        for p in self.workers:
            try:
                p.join(timeout=1)
                if p.is_alive():
                    p.terminate()
                    p.join(timeout=1)
                    if p.is_alive():
                        p.kill()
            except:
                pass
        
        self.workers.clear()
        
        self._clear_queue(self.task_queue)
        self._clear_queue(self.result_queue)
        
        gc.collect()
    
    def get_status(self):
        elapsed = time.time() - self.start_time if self.start_time > 0 else 1
        execs_per_sec = self.total_execs / elapsed
        
        return {
            'total_execs': self.total_execs,
            'execs_per_sec': execs_per_sec,
            'coverage_count': self.coverage_count,
            'corpus_size': len(self.corpus),
            'crashes_found': self.crashes_found,
            'hangs_found': self.hangs_found,
            'num_workers': self.num_workers
        }
    
    def get_crashes(self):
        return self.crashes
