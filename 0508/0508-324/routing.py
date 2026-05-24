import networkx as nx
import heapq
from collections import defaultdict


class RoutingEngine:
    def __init__(self, logger):
        self.logger = logger
        self.graph = nx.Graph()
        self.path_cache = {}
        self.backup_paths = {}
        self.distance_cache = {}
        self.predecessor_cache = {}
        self.topology_version = 0

    def update_topology(self, topology):
        self.graph = topology['graph']
        self.topology_version += 1
        self._invalidate_cache()
        self._precompute_all_pairs()
        self.logger.info(f"Topology updated (v{self.topology_version}): {len(self.graph.nodes())} nodes, {len(self.graph.edges())} edges")

    def _invalidate_cache(self):
        self.path_cache.clear()
        self.backup_paths.clear()
        self.distance_cache.clear()
        self.predecessor_cache.clear()

    def _precompute_all_pairs(self):
        nodes = list(self.graph.nodes())
        for src in nodes:
            if isinstance(src, int):
                self._dijkstra_precompute(src)

    def _dijkstra_precompute(self, src):
        if src not in self.graph:
            return

        distances = {node: float('inf') for node in self.graph}
        distances[src] = 0
        predecessors = {node: None for node in self.graph}
        priority_queue = [(0, src)]

        while priority_queue:
            current_dist, current_node = heapq.heappop(priority_queue)
            if current_dist > distances[current_node]:
                continue
            for neighbor, data in self.graph[current_node].items():
                weight = data.get('weight', 1)
                distance = current_dist + weight
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    predecessors[neighbor] = current_node
                    heapq.heappush(priority_queue, (distance, neighbor))

        self.distance_cache[src] = distances
        self.predecessor_cache[src] = predecessors

    def _reconstruct_path(self, src, dst):
        if src not in self.predecessor_cache:
            return None
        predecessors = self.predecessor_cache[src]
        if dst not in predecessors or predecessors[dst] is None:
            return None
        path = []
        current = dst
        while current is not None:
            path.append(current)
            current = predecessors[current]
        path.reverse()
        return path if path[0] == src else None

    def dijkstra_shortest_path(self, src, dst):
        if src == dst:
            return [src]
        cache_key = (src, dst, self.topology_version)
        if cache_key in self.path_cache:
            return self.path_cache[cache_key]
        try:
            path = self._reconstruct_path(src, dst)
            if path is None:
                path = nx.dijkstra_path(self.graph, src, dst, weight='weight')
            self.path_cache[cache_key] = path
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound) as e:
            self.logger.warning(f"No path found between {src} and {dst}: {e}")
            return None

    def get_all_shortest_paths(self, src, dst):
        try:
            paths = list(nx.all_shortest_paths(self.graph, src, dst, weight='weight'))
            return paths
        except nx.NetworkXNoPath:
            return []
        except nx.NodeNotFound:
            return []

    def get_k_shortest_paths(self, src, dst, k=3):
        backup_key = (src, dst, self.topology_version)
        if backup_key in self.backup_paths:
            return self.backup_paths[backup_key][:k]
        try:
            paths = []
            for i, path in enumerate(nx.shortest_simple_paths(self.graph, src, dst, weight='weight')):
                if i >= k:
                    break
                paths.append(path)
            self.backup_paths[backup_key] = paths
            return paths
        except nx.NetworkXNoPath:
            return []
        except nx.NodeNotFound:
            return []

    def get_backup_path(self, src, dst, failed_edge=None):
        paths = self.get_k_shortest_paths(src, dst, k=5)
        if not paths:
            return None
        if not failed_edge:
            return paths[1] if len(paths) > 1 else paths[0]
        for path in paths:
            if not self._path_contains_edge(path, failed_edge):
                return path
        return paths[0] if paths else None

    def _path_contains_edge(self, path, edge):
        u, v = edge
        for i in range(len(path) - 1):
            if (path[i] == u and path[i + 1] == v) or \
               (path[i] == v and path[i + 1] == u):
                return True
        return False

    def calculate_path_cost(self, path, link_utilization=None):
        if not path or len(path) < 2:
            return float('inf')

        cost = 0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            if self.graph.has_edge(u, v):
                edge_weight = self.graph[u][v].get('weight', 1)
                if link_utilization:
                    util = link_utilization.get((u, v), 0)
                    cost += edge_weight * (1 + util * 2)
                else:
                    cost += edge_weight
        return cost

    def get_best_path_with_load(self, src, dst, link_utilization):
        paths = self.get_k_shortest_paths(src, dst, k=5)
        if not paths:
            return None

        best_path = None
        min_cost = float('inf')

        for path in paths:
            cost = self.calculate_path_cost(path, link_utilization)
            if cost < min_cost:
                min_cost = cost
                best_path = path

        return best_path

    def is_path_valid(self, path):
        if not path or len(path) < 2:
            return False

        for i in range(len(path) - 1):
            if not self.graph.has_edge(path[i], path[i + 1]):
                return False
        return True
