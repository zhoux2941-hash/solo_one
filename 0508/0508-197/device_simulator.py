#!/usr/bin/env python3
"""
OTA 设备端模拟器
模拟物联网设备定期检查固件更新并升级
"""

import requests
import time
import random
import json
from datetime import datetime

API_BASE = "http://localhost:8080/api"

class DeviceSimulator:
    def __init__(self, device_id, device_model, current_version):
        self.device_id = device_id
        self.device_model = device_model
        self.current_version = current_version
        self.upgrade_id = None
        self.is_upgrading = False
        
    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{self.device_id}] {message}")
        
    def check_for_upgrade(self):
        self.log(f"检查固件更新... 当前版本: {self.current_version}")
        
        try:
            response = requests.post(
                f"{API_BASE}/device/check",
                json={
                    "deviceId": self.device_id,
                    "deviceModel": self.device_model,
                    "currentVersion": self.current_version
                },
                timeout=10
            )
            data = response.json()
            
            if data.get("upgradeAvailable"):
                self.upgrade_id = data.get("upgradeId")
                new_version = data.get("version")
                self.log(f"发现新版本: {new_version}")
                self.log(f"文件大小: {data.get('fileSize')}")
                return True, data
            else:
                self.log("当前已是最新版本")
                return False, None
                
        except Exception as e:
            self.log(f"检查更新失败: {e}")
            return False, None
            
    def download_firmware(self, firmware_info):
        if not firmware_info:
            return False
            
        self.log("开始下载固件...")
        download_url = firmware_info.get("downloadUrl")
        
        try:
            response = requests.get(
                f"{API_BASE}{download_url}",
                timeout=30
            )
            
            if response.status_code == 200:
                download_time = random.uniform(2, 5)
                time.sleep(download_time)
                self.log(f"固件下载完成 (耗时: {download_time:.1f}s)")
                return True
            else:
                self.log(f"下载失败: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"下载异常: {e}")
            return False
            
    def install_firmware(self):
        self.log("开始安装固件...")
        install_time = random.uniform(1, 3)
        time.sleep(install_time)
        
        success = random.random() > 0.1
        if success:
            self.log(f"固件安装成功 (耗时: {install_time:.1f}s)")
        else:
            self.log(f"固件安装失败!")
            
        return success
        
    def report_result(self, success, failure_reason=""):
        if not self.upgrade_id:
            return
            
        self.log(f"上报升级结果: {'成功' if success else '失败'}")
        
        try:
            response = requests.post(
                f"{API_BASE}/device/report",
                json={
                    "upgradeId": self.upgrade_id,
                    "success": success,
                    "failureReason": failure_reason
                },
                timeout=10
            )
            data = response.json()
            
            if data.get("success"):
                self.log("结果上报成功")
            else:
                self.log("结果上报失败")
                
        except Exception as e:
            self.log(f"上报异常: {e}")
            
    def run(self, check_interval=30):
        self.log(f"设备启动 - 型号: {self.device_model}, 初始版本: {self.current_version}")
        
        while True:
            if not self.is_upgrading:
                has_upgrade, firmware_info = self.check_for_upgrade()
                
                if has_upgrade:
                    self.is_upgrading = True
                    
                    download_success = self.download_firmware(firmware_info)
                    
                    if download_success:
                        install_success = self.install_firmware()
                        
                        if install_success:
                            self.current_version = firmware_info.get("version")
                            self.report_result(True)
                        else:
                            self.report_result(False, "安装失败")
                    else:
                        self.report_result(False, "下载失败")
                        
                    self.is_upgrading = False
                    self.upgrade_id = None
            
            time.sleep(check_interval)


def simulate_multiple_devices():
    devices = [
        DeviceSimulator("ESP32-001", "ESP32", "1.0.0"),
        DeviceSimulator("ESP32-002", "ESP32", "1.0.0"),
        DeviceSimulator("ESP32-003", "ESP32", "1.1.0"),
        DeviceSimulator("STM32-001", "STM32", "2.0.0"),
        DeviceSimulator("STM32-002", "STM32", "1.5.0"),
        DeviceSimulator("ESP8266-001", "ESP8266", "1.0.0"),
    ]
    
    print("=" * 60)
    print("OTA 多设备模拟器启动")
    print(f"共 {len(devices)} 台设备")
    print("=" * 60)
    
    import threading
    threads = []
    
    for device in devices:
        t = threading.Thread(target=device.run, args=(60,))
        t.daemon = True
        threads.append(t)
        t.start()
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n模拟器停止")


def interactive_mode():
    print("=" * 60)
    print("OTA 设备模拟器 - 交互模式")
    print("=" * 60)
    
    device_id = input("设备ID (默认: DEV001): ").strip() or "DEV001"
    device_model = input("设备型号 (默认: ESP32): ").strip() or "ESP32"
    current_version = input("当前版本 (默认: 1.0.0): ").strip() or "1.0.0"
    
    device = DeviceSimulator(device_id, device_model, current_version)
    
    print("\n1. 检查一次更新")
    print("2. 持续轮询模式")
    print("3. 退出")
    
    choice = input("\n请选择 (1-3): ").strip()
    
    if choice == "1":
        has_upgrade, info = device.check_for_upgrade()
        if has_upgrade:
            if device.download_firmware(info):
                success = device.install_firmware()
                device.report_result(success)
                if success:
                    print(f"\n✅ 升级成功! 当前版本: {device.current_version}")
    elif choice == "2":
        interval = int(input("轮询间隔(秒, 默认30): ") or "30")
        device.run(interval)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--multi":
        simulate_multiple_devices()
    else:
        interactive_mode()
