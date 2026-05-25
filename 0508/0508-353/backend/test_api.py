import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def test_health():
    print("=" * 50)
    print("测试 1: 健康检查")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_get_words():
    print("\n" + "=" * 50)
    print("测试 2: 获取词汇列表")
    try:
        response = requests.get(f"{BASE_URL}/api/words")
        data = response.json()
        print(f"状态码: {response.status_code}")
        print(f"词汇数量: {len(data)}")
        if data:
            print(f"第一个词汇: {data[0]['word']} - {data[0]['description']}")
        return response.status_code == 200 and len(data) > 0
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_create_user():
    print("\n" + "=" * 50)
    print("测试 3: 创建用户")
    try:
        response = requests.post(
            f"{BASE_URL}/api/users",
            json={"username": "test_user"}
        )
        data = response.json()
        print(f"状态码: {response.status_code}")
        print(f"用户ID: {data['id']}")
        print(f"用户名: {data['username']}")
        return data['id']
    except Exception as e:
        print(f"错误: {e}")
        return None


def test_get_template(word_id="hello"):
    print("\n" + "=" * 50)
    print(f"测试 4: 获取模板 ({word_id})")
    try:
        response = requests.get(f"{BASE_URL}/api/templates/{word_id}")
        data = response.json()
        print(f"状态码: {response.status_code}")
        print(f"词汇: {data['word']}")
        print(f"描述: {data['description']}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_compare_sign(user_id, word_id="hello"):
    print("\n" + "=" * 50)
    print(f"测试 5: 比对手语 (词汇: {word_id})")
    try:
        import tempfile
        import cv2
        import numpy as np
        
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        temp_file = tempfile.NamedTemporaryFile(suffix='.avi', delete=False)
        temp_path = temp_file.name
        temp_file.close()
        
        out = cv2.VideoWriter(temp_path, fourcc, 10.0, (640, 480))
        
        for i in range(30):
            frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, f'Frame {i}', (100, 200), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            out.write(frame)
        
        out.release()
        
        with open(temp_path, 'rb') as f:
            files = {'video': ('test.avi', f, 'video/x-msvideo')}
            response = requests.post(
                f"{BASE_URL}/api/compare/{word_id}?user_id={user_id}",
                files=files
            )
        
        import os
        os.unlink(temp_path)
        
        if response.status_code == 200:
            data = response.json()
            print(f"状态码: {response.status_code}")
            print(f"分数: {data['score']}")
            print(f"帧数: {data['frame_count']}")
            return True
        else:
            print(f"状态码: {response.status_code}")
            print(f"错误: {response.json()}")
            return False
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_get_history(user_id):
    print("\n" + "=" * 50)
    print("测试 6: 获取练习历史")
    try:
        response = requests.get(f"{BASE_URL}/api/history/{user_id}")
        data = response.json()
        print(f"状态码: {response.status_code}")
        print(f"记录数量: {len(data)}")
        if data:
            print(f"第一个记录词汇: {data[0]['word']}")
            print(f"平均分: {data[0]['average_score']}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def main():
    print("手语教学系统 - API测试")
    print("=" * 50)
    
    results = []
    
    results.append(("健康检查", test_health()))
    results.append(("获取词汇列表", test_get_words()))
    
    user_id = test_create_user()
    results.append(("创建用户", user_id is not None))
    
    if user_id:
        results.append(("获取模板", test_get_template("hello")))
        results.append(("比对手语", test_compare_sign(user_id, "hello")))
        results.append(("获取历史记录", test_get_history(user_id)))
    
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {name}: {status}")
    
    print(f"\n总计: {passed}/{total} 通过")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
