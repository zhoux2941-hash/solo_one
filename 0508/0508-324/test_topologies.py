#!/usr/bin/env python
from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import RemoteController, OVSKernelSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel
from mininet.link import TCLink
import argparse
import time


class LinearTopo(Topo):
    def build(self, n=3):
        hosts = []
        switches = []

        for i in range(n):
            switch = self.addSwitch(f's{i+1}')
            switches.append(switch)

            host = self.addHost(f'h{i+1}')
            hosts.append(host)
            self.addLink(host, switch)

        for i in range(n - 1):
            self.addLink(switches[i], switches[i + 1], bw=100)


class TreeTopo(Topo):
    def build(self, depth=2, fanout=2):
        self.switch_count = 0
        self.host_count = 0
        self._build_tree(depth, fanout, None)

    def _build_tree(self, depth, fanout, parent):
        if depth == 0:
            host = self.addHost(f'h{self.host_count + 1}')
            self.host_count += 1
            self.addLink(parent, host)
            return

        switch = self.addSwitch(f's{self.switch_count + 1}')
        self.switch_count += 1

        if parent:
            self.addLink(parent, switch, bw=100)

        for _ in range(fanout):
            self._build_tree(depth - 1, fanout, switch)


class FatTreeTopo(Topo):
    def build(self, k=4):
        self.switch_count = 0
        self.host_count = 0

        core_switches = []
        for i in range((k // 2) ** 2):
            switch = self.addSwitch(f'c{i+1}')
            core_switches.append(switch)
            self.switch_count += 1

        for pod in range(k):
            agg_switches = []
            edge_switches = []

            for i in range(k // 2):
                switch = self.addSwitch(f'a{pod}-{i+1}')
                agg_switches.append(switch)
                self.switch_count += 1

            for i in range(k // 2):
                switch = self.addSwitch(f'e{pod}-{i+1}')
                edge_switches.append(switch)
                self.switch_count += 1

            for i, edge in enumerate(edge_switches):
                for agg in agg_switches:
                    self.addLink(edge, agg, bw=100)

            for i, agg in enumerate(agg_switches):
                for j in range(k // 2):
                    core_idx = (i * (k // 2) + j) % len(core_switches)
                    self.addLink(agg, core_switches[core_idx], bw=100)

            for edge in edge_switches:
                for _ in range(k // 2):
                    host = self.addHost(f'h{self.host_count + 1}')
                    self.host_count += 1
                    self.addLink(edge, host)


class DataCenterTopo(Topo):
    def build(self, n_switches=10):
        self.switch_count = 0
        self.host_count = 0

        core = self.addSwitch(f's{self.switch_count + 1}')
        self.switch_count += 1

        aggregation = []
        for i in range(min(3, n_switches // 4)):
            switch = self.addSwitch(f's{self.switch_count + 1}')
            aggregation.append(switch)
            self.switch_count += 1
            self.addLink(core, switch, bw=1000)

        remaining = n_switches - 1 - len(aggregation)
        edge_per_agg = remaining // len(aggregation) if aggregation else remaining

        for agg in aggregation:
            for _ in range(edge_per_agg):
                if self.switch_count >= n_switches:
                    break
                edge = self.addSwitch(f's{self.switch_count + 1}')
                self.switch_count += 1
                self.addLink(agg, edge, bw=100)

                for j in range(2):
                    host = self.addHost(f'h{self.host_count + 1}')
                    self.host_count += 1
                    self.addLink(edge, host)


def run_topo(topo_type, n=None):
    setLogLevel('info')

    if topo_type == 'linear':
        n = n or 3
        topo = LinearTopo(n=n)
        print(f"Linear topology: {n} switches")
    elif topo_type == 'tree':
        depth = n or 2
        topo = TreeTopo(depth=depth, fanout=2)
        print(f"Tree topology: depth={depth}, fanout=2")
    elif topo_type == 'fattree':
        k = n or 4
        topo = FatTreeTopo(k=k)
        print(f"Fat-Tree topology: k={k}")
    elif topo_type == 'datacenter':
        n_switches = n or 10
        topo = DataCenterTopo(n_switches=n_switches)
        print(f"Data Center topology: {n_switches} switches")
    else:
        print(f"Unknown topology: {topo_type}")
        return

    net = Mininet(
        topo=topo,
        switch=OVSKernelSwitch,
        controller=lambda name: RemoteController(name, ip='127.0.0.1', port=6653),
        link=TCLink,
        autoSetMacs=True
    )

    net.start()
    print("Waiting for controller connection...")
    time.sleep(5)

    print("\nHosts:")
    for host in net.hosts:
        print(f"  {host.name}: {host.IP()}")

    print("\nTesting connectivity...")
    net.pingAll()

    print("\nStarting CLI...")
    CLI(net)

    net.stop()


def main():
    parser = argparse.ArgumentParser(description='Mininet SDN Test Topologies')
    parser.add_argument('--topo', type=str, default='linear',
                        choices=['linear', 'tree', 'fattree', 'datacenter'],
                        help='Topology type')
    parser.add_argument('--n', type=int, default=None,
                        help='Parameter for topology (switches/depth/k)')

    args = parser.parse_args()
    run_topo(args.topo, args.n)


if __name__ == '__main__':
    main()
