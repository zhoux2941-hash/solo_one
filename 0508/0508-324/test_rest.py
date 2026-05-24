#!/usr/bin/env python
import requests
import json
import time

BASE_URL = 'http://localhost:8080'


def print_response(response):
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(response.text)


def test_health():
    print("\n=== Health Check ===")
    response = requests.get(f'{BASE_URL}/health')
    print_response(response)


def test_topology():
    print("\n=== Get Topology ===")
    response = requests.get(f'{BASE_URL}/topology')
    print_response(response)


def test_switches():
    print("\n=== Get Switches ===")
    response = requests.get(f'{BASE_URL}/switches')
    print_response(response)


def test_hosts():
    print("\n=== Get Hosts ===")
    response = requests.get(f'{BASE_URL}/hosts')
    print_response(response)


def test_port_stats():
    print("\n=== Get Port Stats ===")
    response = requests.get(f'{BASE_URL}/stats/ports')
    print_response(response)


def test_congested():
    print("\n=== Get Congested Links ===")
    response = requests.get(f'{BASE_URL}/stats/congested')
    print_response(response)


def test_routing():
    print("\n=== Get Path ===")
    params = {'src': 1, 'dst': 3}
    response = requests.get(f'{BASE_URL}/routing/path', params=params)
    print_response(response)


def test_add_flow():
    print("\n=== Add Flow ===")
    flow_data = {
        'dpid': 1,
        'priority': 100,
        'match': {
            'eth_type': 0x0800,
            'ipv4_src': '10.0.0.1',
            'ipv4_dst': '10.0.0.3'
        },
        'actions': [
            {'type': 'output', 'port': 2}
        ],
        'idle_timeout': 60
    }
    response = requests.post(f'{BASE_URL}/flows', json=flow_data)
    print_response(response)


def test_get_flows():
    print("\n=== Get Flows ===")
    response = requests.get(f'{BASE_URL}/flows')
    print_response(response)


def main():
    print("Testing SDN Controller REST API")
    print("=" * 50)

    time.sleep(2)

    tests = [
        test_health,
        test_topology,
        test_switches,
        test_hosts,
        test_port_stats,
        test_congested,
        test_routing,
        test_add_flow,
        test_get_flows
    ]

    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(0.5)


if __name__ == '__main__':
    main()
