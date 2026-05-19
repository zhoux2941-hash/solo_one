import click
import sys
from typing import Optional
import json

from .usb_capture import USBCapture
from .feature_extractor import FeatureExtractor
from .ml_model import USBFingerprintModel
from .database import init_db, get_db, USBDevice, DeviceHistory, PolicyType
from .model_recognition import DeviceModelRecognizer, DeviceInfo
from .config import SAMPLE_COUNT
from . import __version__


@click.group()
@click.version_option(version=__version__)
def main():
    """USB Device Fingerprint Recognition System v2.0"""
    init_db()


@main.group()
def device():
    """Device management commands"""
    pass


@device.command(name="list")
def list_devices():
    """List all connected USB devices"""
    capture = USBCapture()
    devices = capture.list_devices()

    if not devices:
        click.echo("No USB devices found")
        return

    click.echo(f"Found {len(devices)} USB device(s):")
    click.echo("-" * 80)

    for i, dev in enumerate(devices, 1):
        click.echo(f"\nDevice {i}:")
        click.echo(f"  Vendor ID:  0x{dev.vendor_id:04x}")
        click.echo(f"  Product ID: 0x{dev.product_id:04x}")
        click.echo(f"  Manufacturer: {dev.manufacturer}")
        click.echo(f"  Product: {dev.product}")
        click.echo(f"  Serial: {dev.serial_number}")
        click.echo(f"  Type: {dev.device_type}")
        click.echo(f"  Bus: {dev.bus}, Address: {dev.address}")


@device.command()
@click.argument("vendor_id", type=str)
@click.argument("product_id", type=str)
@click.option("--samples", "-n", default=SAMPLE_COUNT, help="Number of samples to collect")
def capture(vendor_id: str, product_id: str, samples: int):
    """Capture timing samples from a USB device"""
    vid = int(vendor_id, 16) if vendor_id.startswith("0x") else int(vendor_id)
    pid = int(product_id, 16) if product_id.startswith("0x") else int(product_id)

    click.echo(f"Capturing {samples} samples from device 0x{vid:04x}:0x{pid:04x}...")

    capture = USBCapture(sample_count=samples)
    samples_data = capture.capture_timings(vid, pid)

    if not samples_data:
        click.echo("Error: Device not found or could not capture samples")
        return

    click.echo(f"Successfully captured {len(samples_data)} samples")

    extractor = FeatureExtractor()
    features = extractor.extract_features(samples_data)

    click.echo("\nExtracted Features:")
    click.echo("-" * 40)
    for key, value in features.to_dict().items():
        if isinstance(value, float):
            click.echo(f"  {key}: {value:.6f}")
        else:
            click.echo(f"  {key}: {value}")


@device.command()
@click.argument("vendor_id", type=str)
@click.argument("product_id", type=str)
@click.option("--name", "-n", help="Custom name for the device")
def register(vendor_id: str, product_id: str, name: Optional[str]):
    """Register a USB device in the system"""
    vid = int(vendor_id, 16) if vendor_id.startswith("0x") else int(vendor_id)
    pid = int(product_id, 16) if product_id.startswith("0x") else int(product_id)

    click.echo(f"Registering device 0x{vid:04x}:0x{pid:04x}...")

    capture = USBCapture()
    samples = capture.capture_timings(vid, pid)

    if not samples:
        click.echo("Error: Device not found")
        return

    extractor = FeatureExtractor()
    features = extractor.extract_features(samples)

    device_info = None
    for dev in capture.list_devices():
        if dev.vendor_id == vid and dev.product_id == pid:
            device_info = dev
            break

    if not device_info:
        click.echo("Error: Could not get device info")
        return

    # 设备型号识别
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    dev_info = DeviceInfo(
        vendor_id=device_info.vendor_id,
        product_id=device_info.product_id,
        manufacturer=device_info.manufacturer,
        product=device_info.product,
        serial_number=device_info.serial_number,
        device_type=device_info.device_type
    )
    recognition_result = recognizer.recognize(dev_info)

    import uuid
    device_id = str(uuid.uuid4())

    existing = db.query(USBDevice).filter(
        USBDevice.vendor_id == vid,
        USBDevice.product_id == pid,
        USBDevice.serial_number == device_info.serial_number
    ).first()

    if existing:
        click.echo(f"Device already registered with ID: {existing.device_id}")
        if click.confirm("Update existing device?"):
            existing.set_fingerprint_vector(features.to_dict())
            existing.model_id = recognition_result.model_id
            existing.is_model_authorized = recognition_result.is_authorized
            db.commit()
            click.echo("Device fingerprint updated")
            if recognition_result.model_name:
                click.echo(f"  Model: {recognition_result.model_name}")
                click.echo(f"  Model Authorized: {'Yes' if recognition_result.is_authorized else 'No'}")
        return

    device = USBDevice(
        device_id=device_id,
        vendor_id=vid,
        product_id=pid,
        manufacturer=device_info.manufacturer,
        product=name or device_info.product,
        serial_number=device_info.serial_number,
        device_type=device_info.device_type,
        model_id=recognition_result.model_id,
        is_blacklisted=False,
        is_model_authorized=recognition_result.is_authorized
    )
    device.set_fingerprint_vector(features.to_dict())
    db.add(device)
    db.commit()

    model = USBFingerprintModel()
    model.load_model()
    model.add_device(features, device_id, vid, pid)
    model.save_model()

    click.echo(f"Device registered successfully!")
    click.echo(f"  Device ID: {device_id}")
    click.echo(f"  Name: {device.product}")
    click.echo(f"  Type: {device.device_type}")
    if recognition_result.model_name:
        click.echo(f"  Model: {recognition_result.model_name}")
        click.echo(f"  Category: {recognition_result.category or 'N/A'}")
        click.echo(f"  Model Authorized: {'Yes' if recognition_result.is_authorized else 'No'}")


@device.command()
@click.argument("vendor_id", type=str)
@click.argument("product_id", type=str)
@click.option("--threshold", "-t", type=float, help="Confidence threshold (0-1)")
def authenticate(vendor_id: str, product_id: str, threshold: Optional[float]):
    """Authenticate a USB device"""
    vid = int(vendor_id, 16) if vendor_id.startswith("0x") else int(vendor_id)
    pid = int(product_id, 16) if product_id.startswith("0x") else int(product_id)

    click.echo(f"Authenticating device 0x{vid:04x}:0x{pid:04x}...")

    capture = USBCapture()
    samples = capture.capture_timings(vid, pid)

    if not samples:
        click.echo("Error: Device not found")
        return

    extractor = FeatureExtractor()
    features = extractor.extract_features(samples)

    model = USBFingerprintModel()
    model.load_model()

    device_id, confidence = model.predict(features, threshold)

    # 获取设备信息用于型号识别
    device_info = None
    for dev in capture.list_devices():
        if dev.vendor_id == vid and dev.product_id == pid:
            device_info = dev
            break

    # 设备型号识别和策略检查
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    model_id = None
    model_name = None
    category = None
    is_model_authorized = True
    blocked_reason = None

    if device_info:
        dev_info = DeviceInfo(
            vendor_id=device_info.vendor_id,
            product_id=device_info.product_id,
            manufacturer=device_info.manufacturer,
            product=device_info.product,
            serial_number=device_info.serial_number,
            device_type=device_info.device_type
        )
        recognition_result = recognizer.recognize(dev_info)
        model_id = recognition_result.model_id
        model_name = recognition_result.model_name
        category = recognition_result.category
        is_model_authorized = recognition_result.is_authorized
        blocked_reason = recognition_result.blocked_reason

    if device_id:
        device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()

        if device:
            # 综合检查：设备黑名单 或 型号未授权
            is_blocked = device.is_blacklisted or not is_model_authorized

            if is_blocked:
                click.echo("\n❌ Authentication Blocked!")
                click.echo(f"  Device ID: {device_id}")
                click.echo(f"  Device: {device.product}")
                click.echo(f"  Confidence: {confidence:.4f}")
                if model_name:
                    click.echo(f"  Model: {model_name}")
                click.echo(f"  Blacklisted: {'Yes' if device.is_blacklisted else 'No'}")
                click.echo(f"  Model Authorized: {'Yes' if is_model_authorized else 'No'}")
                if blocked_reason:
                    click.echo(f"  Reason: {blocked_reason}")
            else:
                click.echo("\n✅ Authentication Successful!")
                click.echo(f"  Device ID: {device_id}")
                click.echo(f"  Device: {device.product}")
                click.echo(f"  Manufacturer: {device.manufacturer}")
                click.echo(f"  Confidence: {confidence:.4f}")
                if model_name:
                    click.echo(f"  Model: {model_name}")
                    click.echo(f"  Category: {category or 'N/A'}")
    else:
        # 检查是否被型号策略阻止
        if not is_model_authorized:
            click.echo("\n❌ Device Model Blocked!")
            if model_name:
                click.echo(f"  Model: {model_name}")
            click.echo(f"  Reason: {blocked_reason or 'Policy restriction'}")
        else:
            click.echo("\n⚠️ Authentication Failed!")
            click.echo(f"  Unknown device (max confidence: {confidence:.4f})")


@device.command(name="registered")
def list_registered():
    """List all registered devices"""
    db = next(get_db())
    devices = db.query(USBDevice).all()

    if not devices:
        click.echo("No registered devices")
        return

    click.echo(f"Found {len(devices)} registered device(s):")
    click.echo("-" * 100)

    for dev in devices:
        click.echo(f"\nDevice ID: {dev.device_id}")
        click.echo(f"  Vendor: 0x{dev.vendor_id:04x}, Product: 0x{dev.product_id:04x}")
        click.echo(f"  Name: {dev.product}")
        click.echo(f"  Manufacturer: {dev.manufacturer}")
        click.echo(f"  Type: {dev.device_type}")
        if dev.model_id:
            click.echo(f"  Model ID: {dev.model_id}")
        click.echo(f"  Blacklisted: {'Yes' if dev.is_blacklisted else 'No'}")
        click.echo(f"  Model Authorized: {'Yes' if dev.is_model_authorized else 'No'}")
        click.echo(f"  Created: {dev.created_at}")


# 设备型号管理命令组
@main.group()
def model():
    """Device model management commands"""
    pass


@model.command(name="list")
def list_models():
    """List all registered device models"""
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    models = recognizer.get_all_models()

    if not models:
        click.echo("No device models registered")
        return

    click.echo(f"Found {len(models)} device model(s):")
    click.echo("-" * 80)

    for m in models:
        click.echo(f"\nModel ID: {m.model_id}")
        click.echo(f"  Name: {m.model_name}")
        click.echo(f"  Vendor: 0x{m.vendor_id:04x}, Product: 0x{m.product_id:04x}")
        if m.vendor_name_pattern:
            click.echo(f"  Vendor Pattern: {m.vendor_name_pattern}")
        if m.product_name_pattern:
            click.echo(f"  Product Pattern: {m.product_name_pattern}")
        click.echo(f"  Type: {m.device_type or 'N/A'}")
        click.echo(f"  Category: {m.category or 'N/A'}")
        click.echo(f"  Authorized: {'Yes' if m.is_authorized else 'No'}")


@model.command(name="add")
@click.argument("model_name")
@click.argument("vendor_id", type=str)
@click.argument("product_id", type=str)
@click.option("--vendor-pattern", help="Vendor name pattern (supports *)")
@click.option("--product-pattern", help="Product name pattern (supports *)")
@click.option("--device-type", help="Device type")
@click.option("--category", help="Device category")
@click.option("--description", help="Model description")
@click.option("--authorized/--no-authorized", default=True, help="Set authorization status")
def add_model(model_name: str, vendor_id: str, product_id: str, vendor_pattern: Optional[str],
              product_pattern: Optional[str], device_type: Optional[str], category: Optional[str],
              description: Optional[str], authorized: bool):
    """Add or update a device model"""
    vid = int(vendor_id, 16) if vendor_id.startswith("0x") else int(vendor_id)
    pid = int(product_id, 16) if product_id.startswith("0x") else int(product_id)

    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    model = recognizer.register_model(
        model_name=model_name,
        vendor_id=vid,
        product_id=pid,
        vendor_name_pattern=vendor_pattern,
        product_name_pattern=product_pattern,
        device_type=device_type,
        category=category,
        description=description,
        is_authorized=authorized
    )

    click.echo(f"Device model '{model_name}' registered successfully!")
    click.echo(f"  Model ID: {model.model_id}")
    click.echo(f"  Authorized: {'Yes' if authorized else 'No'}")


@model.command(name="delete")
@click.argument("model_id")
def delete_model(model_id: str):
    """Delete a device model"""
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)

    if recognizer.delete_model(model_id):
        click.echo(f"Device model {model_id} deleted successfully")
    else:
        click.echo("Error: Device model not found")


# 策略管理命令组
@main.group()
def policy():
    """Access policy management commands"""
    pass


@policy.command(name="list")
def list_policies():
    """List all access policies"""
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    policies = recognizer.get_all_policies()

    if not policies:
        click.echo("No access policies configured")
        return

    click.echo(f"Found {len(policies)} access policy(ies):")
    click.echo("-" * 80)

    for p in policies:
        click.echo(f"\nPolicy ID: {p.id}")
        click.echo(f"  Type: {p.policy_type.value.upper()}")
        if p.model_id:
            click.echo(f"  Applies to Model ID: {p.model_id}")
        if p.vendor_id is not None:
            click.echo(f"  Applies to Vendor: 0x{p.vendor_id:04x}")
        if p.product_id is not None:
            click.echo(f"  Applies to Product: 0x{p.product_id:04x}")
        if p.device_type:
            click.echo(f"  Applies to Device Type: {p.device_type}")
        if p.category:
            click.echo(f"  Applies to Category: {p.category}")
        if p.reason:
            click.echo(f"  Reason: {p.reason}")
        click.echo(f"  Created: {p.created_at}")


@policy.command(name="blacklist")
@click.option("--model-id", help="Apply to specific model ID")
@click.option("--vendor-id", type=str, help="Apply to specific vendor ID")
@click.option("--product-id", type=str, help="Apply to specific product ID")
@click.option("--device-type", help="Apply to specific device type")
@click.option("--category", help="Apply to specific category")
@click.option("--reason", "-r", help="Reason for blacklisting")
def add_blacklist_policy(model_id: Optional[str], vendor_id: Optional[str], product_id: Optional[str],
                         device_type: Optional[str], category: Optional[str], reason: Optional[str]):
    """Add a blacklist policy"""
    vid = int(vendor_id, 16) if vendor_id and vendor_id.startswith("0x") else (int(vendor_id) if vendor_id else None)
    pid = int(product_id, 16) if product_id and product_id.startswith("0x") else (int(product_id) if product_id else None)

    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    policy = recognizer.add_policy(
        policy_type=PolicyType.BLACKLIST,
        model_id=model_id,
        vendor_id=vid,
        product_id=pid,
        device_type=device_type,
        category=category,
        reason=reason
    )

    click.echo(f"Blacklist policy created successfully (ID: {policy.id})")


@policy.command(name="whitelist")
@click.option("--model-id", help="Apply to specific model ID")
@click.option("--vendor-id", type=str, help="Apply to specific vendor ID")
@click.option("--product-id", type=str, help="Apply to specific product ID")
@click.option("--device-type", help="Apply to specific device type")
@click.option("--category", help="Apply to specific category")
@click.option("--reason", "-r", help="Reason for whitelisting")
def add_whitelist_policy(model_id: Optional[str], vendor_id: Optional[str], product_id: Optional[str],
                         device_type: Optional[str], category: Optional[str], reason: Optional[str]):
    """Add a whitelist policy"""
    vid = int(vendor_id, 16) if vendor_id and vendor_id.startswith("0x") else (int(vendor_id) if vendor_id else None)
    pid = int(product_id, 16) if product_id and product_id.startswith("0x") else (int(product_id) if product_id else None)

    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)
    policy = recognizer.add_policy(
        policy_type=PolicyType.WHITELIST,
        model_id=model_id,
        vendor_id=vid,
        product_id=pid,
        device_type=device_type,
        category=category,
        reason=reason
    )

    click.echo(f"Whitelist policy created successfully (ID: {policy.id})")


@policy.command(name="delete")
@click.argument("policy_id", type=int)
def delete_policy(policy_id: int):
    """Delete an access policy"""
    db = next(get_db())
    recognizer = DeviceModelRecognizer(db)

    if recognizer.delete_policy(policy_id):
        click.echo(f"Policy {policy_id} deleted successfully")
    else:
        click.echo("Error: Policy not found")


# 黑名单管理命令组
@main.group()
def blacklist():
    """Blacklist management commands"""
    pass


@blacklist.command(name="add")
@click.argument("device_id")
@click.option("--reason", "-r", help="Reason for blacklisting")
def add_blacklist(device_id: str, reason: Optional[str]):
    """Add a device to blacklist"""
    db = next(get_db())
    device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()

    if not device:
        click.echo("Error: Device not found")
        return

    device.is_blacklisted = True

    history = DeviceHistory(
        device_id=device_id,
        action="blacklist",
        details=reason or "Added to blacklist via CLI"
    )
    db.add(history)
    db.commit()

    click.echo(f"Device {device_id} added to blacklist")


@blacklist.command(name="remove")
@click.argument("device_id")
def remove_blacklist(device_id: str):
    """Remove a device from blacklist"""
    db = next(get_db())
    device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()

    if not device:
        click.echo("Error: Device not found")
        return

    device.is_blacklisted = False

    history = DeviceHistory(
        device_id=device_id,
        action="unblacklist",
        details="Removed from blacklist via CLI"
    )
    db.add(history)
    db.commit()

    click.echo(f"Device {device_id} removed from blacklist")


@blacklist.command(name="list")
def list_blacklist():
    """List all blacklisted devices"""
    db = next(get_db())
    devices = db.query(USBDevice).filter(USBDevice.is_blacklisted == True).all()

    if not devices:
        click.echo("No blacklisted devices")
        return

    click.echo(f"Found {len(devices)} blacklisted device(s):")
    for dev in devices:
        click.echo(f"  {dev.device_id} - {dev.product}")


@main.command()
@click.option("--host", "-h", default="0.0.0.0", help="Host to bind to")
@click.option("--port", "-p", default=8000, help="Port to listen on")
def server(host: str, port: int):
    """Start the API server"""
    from .api import run_server
    click.echo(f"Starting API server on {host}:{port}")
    click.echo(f"API documentation: http://{host}:{port}/docs")
    run_server(host, port)


@main.command()
def monitor():
    """Monitor USB device hotplug events"""
    click.echo("Monitoring USB devices (press Ctrl+C to stop)...")

    def callback(action, device_id):
        if action == "add":
            click.echo(f"[+] Device added: {device_id[0]:04x}:{device_id[1]:04x}")
        elif action == "remove":
            click.echo(f"[-] Device removed: {device_id[0]:04x}:{device_id[1]:04x}")

    capture = USBCapture()
    thread = capture.monitor_hotplug(callback)

    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        click.echo("\nStopping monitor...")


if __name__ == "__main__":
    main()
