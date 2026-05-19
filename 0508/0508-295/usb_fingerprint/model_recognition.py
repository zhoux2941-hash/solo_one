import re
import hashlib
from typing import Optional, Tuple, List, Dict
from dataclasses import dataclass
import logging
from sqlalchemy.orm import Session

from .database import DeviceModel, ModelPolicy, PolicyType, USBDevice, get_db

logger = logging.getLogger(__name__)


@dataclass
class DeviceInfo:
    """设备信息"""
    vendor_id: int
    product_id: int
    manufacturer: str
    product: str
    serial_number: str
    device_type: str


@dataclass
class RecognitionResult:
    """识别结果"""
    model_id: Optional[str] = None
    model_name: Optional[str] = None
    category: Optional[str] = None
    is_authorized: bool = True
    match_score: float = 0.0
    policy_applied: Optional[str] = None
    blocked_reason: Optional[str] = None


class DeviceModelRecognizer:
    """设备型号识别器"""

    def __init__(self, db: Session):
        self.db = db
        self._load_models()

    def _load_models(self):
        """加载所有已定义的设备型号"""
        self.models = self.db.query(DeviceModel).all()
        logger.info(f"已加载 {len(self.models)} 个设备型号定义")

    def _calculate_match_score(self, device_info: DeviceInfo, model: DeviceModel) -> float:
        """计算设备与型号定义的匹配分数"""
        score = 0.0
        max_score = 0.0

        # 1. Vendor ID 匹配 (权重 30%)
        max_score += 0.3
        if model.vendor_id is not None and model.vendor_id == device_info.vendor_id:
            score += 0.3

        # 2. Product ID 匹配 (权重 35%)
        max_score += 0.35
        if model.product_id is not None and model.product_id == device_info.product_id:
            score += 0.35

        # 3. 厂商名称匹配 (支持通配符) (权重 15%)
        max_score += 0.15
        if model.vendor_name_pattern and device_info.manufacturer:
            if self._pattern_match(model.vendor_name_pattern, device_info.manufacturer):
                score += 0.15

        # 4. 产品名称匹配 (支持通配符) (权重 15%)
        max_score += 0.15
        if model.product_name_pattern and device_info.product:
            if self._pattern_match(model.product_name_pattern, device_info.product):
                score += 0.15

        # 5. 设备类型匹配 (权重 5%)
        max_score += 0.05
        if model.device_type and model.device_type == device_info.device_type:
            score += 0.05

        return score / max_score if max_score > 0 else 0.0

    def _pattern_match(self, pattern: str, text: str) -> bool:
        """通配符模式匹配"""
        if not pattern or not text:
            return False

        # 将通配符转换为正则表达式
        regex_pattern = '^' + re.escape(pattern).replace('\\*', '.*').replace('\\?', '.') + '$'
        return bool(re.match(regex_pattern, text, re.IGNORECASE))

    def recognize(self, device_info: DeviceInfo) -> RecognitionResult:
        """识别设备型号"""
        result = RecognitionResult()

        # 查找匹配的型号
        best_match = None
        best_score = 0.0

        for model in self.models:
            score = self._calculate_match_score(device_info, model)
            if score > best_score and score >= 0.5:  # 最低匹配阈值
                best_score = score
                best_match = model

        if best_match:
            result.model_id = best_match.model_id
            result.model_name = best_match.model_name
            result.category = best_match.category
            result.is_authorized = best_match.is_authorized
            result.match_score = best_score

        # 应用策略检查
        self._apply_policies(device_info, result)

        return result

    def _apply_policies(self, device_info: DeviceInfo, result: RecognitionResult):
        """应用访问策略"""
        policies = self.db.query(ModelPolicy).filter(ModelPolicy.is_active == True).all()

        for policy in policies:
            if self._policy_matches(policy, device_info, result):
                if policy.policy_type == PolicyType.BLACKLIST:
                    result.is_authorized = False
                    result.policy_applied = f"BLACKLIST:{policy.id}"
                    result.blocked_reason = policy.reason or "设备型号在黑名单中"
                    logger.warning(f"设备被阻止: VID={device_info.vendor_id:04x}, PID={device_info.product_id:04x}, 原因: {result.blocked_reason}")
                elif policy.policy_type == PolicyType.WHITELIST:
                    result.is_authorized = True
                    result.policy_applied = f"WHITELIST:{policy.id}"

    def _policy_matches(self, policy: ModelPolicy, device_info: DeviceInfo, result: RecognitionResult) -> bool:
        """检查策略是否匹配设备"""
        # 按型号匹配
        if policy.model_id and result.model_id:
            if policy.model_id == result.model_id:
                return True

        # 按 Vendor ID 匹配
        if policy.vendor_id is not None and policy.vendor_id == device_info.vendor_id:
            # 如果指定了 product_id 则需要同时匹配
            if policy.product_id is not None:
                if policy.product_id == device_info.product_id:
                    return True
            else:
                # 只匹配 vendor_id
                return True

        # 按设备类型匹配
        if policy.device_type and policy.device_type == device_info.device_type:
            return True

        # 按类别匹配
        if policy.category and result.category and policy.category == result.category:
            return True

        return False

    def register_model(self, model_name: str, vendor_id: int, product_id: int,
                      vendor_name_pattern: str = None, product_name_pattern: str = None,
                      device_type: str = None, category: str = None,
                      description: str = None, is_authorized: bool = True) -> DeviceModel:
        """注册新的设备型号"""
        # 生成 model_id
        model_id = hashlib.md5(f"{vendor_id}:{product_id}:{model_name}".encode()).hexdigest()[:12]

        # 检查是否已存在
        existing = self.db.query(DeviceModel).filter(
            (DeviceModel.vendor_id == vendor_id) &
            (DeviceModel.product_id == product_id)
        ).first()

        if existing:
            existing.model_name = model_name
            existing.vendor_name_pattern = vendor_name_pattern
            existing.product_name_pattern = product_name_pattern
            existing.device_type = device_type
            existing.category = category
            existing.description = description
            existing.is_authorized = is_authorized
            model = existing
        else:
            model = DeviceModel(
                model_id=model_id,
                model_name=model_name,
                vendor_id=vendor_id,
                product_id=product_id,
                vendor_name_pattern=vendor_name_pattern,
                product_name_pattern=product_name_pattern,
                device_type=device_type,
                category=category,
                description=description,
                is_authorized=is_authorized
            )
            self.db.add(model)

        self.db.commit()
        self._load_models()
        return model

    def add_policy(self, policy_type: PolicyType, model_id: str = None,
                   vendor_id: int = None, product_id: int = None,
                   device_type: str = None, category: str = None,
                   reason: str = None) -> ModelPolicy:
        """添加访问策略"""
        policy = ModelPolicy(
            policy_type=policy_type,
            model_id=model_id,
            vendor_id=vendor_id,
            product_id=product_id,
            device_type=device_type,
            category=category,
            reason=reason
        )
        self.db.add(policy)
        self.db.commit()
        return policy

    def get_all_models(self) -> List[DeviceModel]:
        """获取所有已定义型号"""
        return self.db.query(DeviceModel).all()

    def get_all_policies(self) -> List[ModelPolicy]:
        """获取所有策略"""
        return self.db.query(ModelPolicy).all()

    def delete_model(self, model_id: str) -> bool:
        """删除型号定义"""
        model = self.db.query(DeviceModel).filter(DeviceModel.model_id == model_id).first()
        if model:
            self.db.delete(model)
            self.db.commit()
            self._load_models()
            return True
        return False

    def delete_policy(self, policy_id: int) -> bool:
        """删除策略"""
        policy = self.db.query(ModelPolicy).filter(ModelPolicy.id == policy_id).first()
        if policy:
            self.db.delete(policy)
            self.db.commit()
            return True
        return False

    def update_device_model_id(self, device: USBDevice, model_id: str):
        """更新设备的型号关联"""
        device.model_id = model_id
        self.db.commit()


def create_common_models(db: Session):
    """创建常见的USB设备型号定义"""
    recognizer = DeviceModelRecognizer(db)

    common_models = [
        # 存储设备
        ("USB Mass Storage", 0x0781, 0x5567, "SanDisk", "*Cruzer*", "Mass Storage", "Storage", "闪迪U盘"),
        ("Kingston USB Drive", 0x0951, 0x1666, "Kingston", "*DataTraveler*", "Mass Storage", "Storage", "金士顿U盘"),
        ("WD External HDD", 0x1058, 0x1023, "Western Digital", "*External*", "Mass Storage", "Storage", "西部数据移动硬盘"),

        # HID设备
        ("Logitech Mouse", 0x046d, 0xc52b, "Logitech", "*Mouse*", "HID", "Input", "罗技鼠标"),
        ("Logitech Keyboard", 0x046d, 0xc31c, "Logitech", "*Keyboard*", "HID", "Input", "罗技键盘"),
        ("Microsoft Mouse", 0x045e, 0x07a5, "Microsoft", "*Mouse*", "HID", "Input", "微软鼠标"),

        # 网络设备
        ("USB Ethernet", 0x0bda, 0x8153, "Realtek", "*USB*Ethernet*", "Communication", "Network", "Realtek USB网卡"),
        ("USB WiFi Adapter", 0x148f, 0x5370, "Ralink", "*WiFi*", "Communication", "Network", "USB无线网卡"),

        # 打印机
        ("HP Printer", 0x03f0, 0x104a, "HP", "*Printer*", "Printer", "Peripheral", "惠普打印机"),
        ("Epson Printer", 0x04b8, 0x0881, "Epson", "*Printer*", "Printer", "Peripheral", "爱普生打印机"),
    ]

    for model_data in common_models:
        try:
            recognizer.register_model(
                model_name=model_data[0],
                vendor_id=model_data[1],
                product_id=model_data[2],
                vendor_name_pattern=model_data[3],
                product_name_pattern=model_data[4],
                device_type=model_data[5],
                category=model_data[6],
                description=model_data[7],
                is_authorized=True
            )
        except Exception as e:
            logger.debug(f"预定义型号已存在或创建失败: {model_data[0]}, {e}")

    logger.info("常见设备型号定义已加载")
