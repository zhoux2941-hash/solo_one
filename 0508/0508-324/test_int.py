#!/usr/bin/env python
import requests
import time
import json

BASE_URL = 'http://localhost:8080'


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def test_health():
    print_section("1. 健康检查")
    try:
        response = requests.get(f'{BASE_URL}/health')
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")


def test_int_telemetry():
    print_section("2. INT 遥测数据")
    try:
        response = requests.get(f'{BASE_URL}/int/telemetry?limit=10')
        print(f"Status: {response.status_code}")
        data = response.json()
        if data:
            print(f"遥测记录数: {len(data)}")
            if len(data) > 0:
                print("\n最新记录:")
                print(json.dumps(data[0], indent=2))
        else:
            print("暂无遥测数据 (需要先进行流量测试)")
    except Exception as e:
        print(f"Error: {e}")


def test_int_latency():
    print_section("3. INT 延迟统计")
    try:
        response = requests.get(f'{BASE_URL}/int/latency')
        print(f"Status: {response.status_code}")
        data = response.json()
        if data:
            print(f"统计流数: {len(data)}")
            for flow_key, stats in list(data.items())[:3]:
                print(f"\n流: {flow_key}")
                print(f"  最小延迟: {stats.get('min_latency', 0)} us")
                print(f"  最大延迟: {stats.get('max_latency', 0)} us")
                print(f"  平均延迟: {stats.get('avg_latency', 0):.2f} us")
                print(f"  样本数: {stats.get('count', 0)}")
        else:
            print("暂无延迟统计数据")
    except Exception as e:
        print(f"Error: {e}")


def test_int_queues():
    print_section("4. INT 队列统计")
    try:
        response = requests.get(f'{BASE_URL}/int/queues')
        print(f"Status: {response.status_code}")
        data = response.json()
        if data:
            print(f"有队列统计的交换机数: {len(data)}")
            for dpid, queues in list(data.items())[:2]:
                print(f"\n交换机 {dpid}:")
                for (port, queue), stats in queues.items():
                    print(f"  端口{port}, 队列{queue}:")
                    print(f"    发送字节数: {stats.get('tx_bytes', 0)}")
                    print(f"    发送包数: {stats.get('tx_packets', 0)}")
        else:
            print("暂无队列统计数据")
    except Exception as e:
        print(f"Error: {e}")


def test_int_congested():
    print_section("5. INT 拥塞端口检测")
    try:
        response = requests.get(f'{BASE_URL}/int/congested')
        print(f"Status: {response.status_code}")
        data = response.json()
        if data:
            print(f"检测到 {len(data)} 个拥塞端口:")
            for item in data:
                print(f"  交换机{item['dpid']}, 端口{item['port_no']}, "
                      f"队列深度: {item['queue_depth']}/{item['threshold']}")
        else:
            print("暂无拥塞端口")
    except Exception as e:
        print(f"Error: {e}")


def test_set_thresholds():
    print_section("6. 设置INT阈值")
    try:
        threshold_data = {
            'max_queue_depth': 60,
            'latency_threshold_ms': 100
        }
        response = requests.post(
            f'{BASE_URL}/int/thresholds',
            json=threshold_data
        )
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")


def test_toggle_int():
    print_section("7. 切换INT功能状态")
    try:
        response = requests.post(
            f'{BASE_URL}/int/toggle',
            json={'enabled': True}
        )
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")


def main():
    print("SDN 控制器 INT 遥测功能测试")
    print("="*60)
    print(f"测试地址: {BASE_URL}")
    print(f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    tests = [
        test_health,
        test_int_telemetry,
        test_int_latency,
        test_int_queues,
        test_int_congested,
        test_set_thresholds,
        test_toggle_int
    ]

    for test in tests:
        test()
        time.sleep(0.5)

    print("\n" + "="*60)
    print("测试完成!")
    print("="*60)
    print("\n提示: 如需查看遥测数据，请先在Mininet中执行:")
    print("  1. pingall 或 h1 ping h2")
    print("  2. iperf 进行流量测试")


if __name__ == '__main__':
    main()
