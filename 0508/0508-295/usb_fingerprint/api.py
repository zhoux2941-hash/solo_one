from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from .database import get_db, USBDevice, DeviceHistory, init_db, PolicyType
from .usb_capture import USBCapture
from .feature_extractor import FeatureExtractor
from .ml_model import USBFingerprintModel
from .model_recognition import DeviceModelRecognizer, DeviceInfo, create_common_models
from .config import SAMPLE_COUNT

app = FastAPI(title="USB Fingerprint API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

usb_capture = USBCapture(sample_count=SAMPLE_COUNT)
feature_extractor = FeatureExtractor()
ml_model = USBFingerprintModel()


class DeviceRegisterRequest(BaseModel):
    vendor_id: int
    product_id: int
    custom_name: Optional[str] = None


class DeviceAuthRequest(BaseModel):
    vendor_id: int
    product_id: int
    threshold: Optional[float] = None


class DeviceResponse(BaseModel):
    device_id: str
    vendor_id: int
    product_id: int
    manufacturer: str
    product: str
    serial_number: str
    device_type: str
    model_id: Optional[str] = None
    is_blacklisted: bool
    is_model_authorized: bool
    created_at: datetime
    last_seen: datetime


class AuthResponse(BaseModel):
    success: bool
    device_id: Optional[str] = None
    confidence: float = 0.0
    is_blacklisted: bool = False
    is_model_authorized: bool = True
    model_id: Optional[str] = None
    model_name: Optional[str] = None
    category: Optional[str] = None
    blocked_reason: Optional[str] = None
    message: str


class BlacklistRequest(BaseModel):
    device_id: str
    reason: Optional[str] = None


class DeviceModelRequest(BaseModel):
    model_name: str
    vendor_id: int
    product_id: int
    vendor_name_pattern: Optional[str] = None
    product_name_pattern: Optional[str] = None
    device_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_authorized: bool = True


class ModelPolicyRequest(BaseModel):
    policy_type: PolicyType
    model_id: Optional[str] = None
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    device_type: Optional[str] = None
    category: Optional[str] = None
    reason: Optional[str] = None


@app.on_event("startup")
def startup_event():
    init_db()
    ml_model.load_model()
    db = next(get_db())
    create_common_models(db)


@app.get("/")
def root():
    return {"message": "USB Fingerprint Recognition System API v2.0"}


@app.get("/devices", response_model=List[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(USBDevice).all()
    return devices


@app.get("/devices/usb")
def list_usb_devices():
    devices = usb_capture.list_devices()
    return [
        {
            "vendor_id": d.vendor_id,
            "product_id": d.product_id,
            "manufacturer": d.manufacturer,
            "product": d.product,
            "serial_number": d.serial_number,
            "device_type": d.device_type
        }
        for d in devices
    ]


@app.post("/devices/register")
def register_device(request: DeviceRegisterRequest, db: Session = Depends(get_db)):
    samples = usb_capture.capture_timings(request.vendor_id, request.product_id)
    if not samples:
        raise HTTPException(status_code=404, detail="USB device not found")

    try:
        features = feature_extractor.extract_features(samples)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    device_info = None
    for dev in usb_capture.list_devices():
        if dev.vendor_id == request.vendor_id and dev.product_id == request.product_id:
            device_info = dev
            break

    if not device_info:
        raise HTTPException(status_code=404, detail="USB device info not found")

    # 设备型号识别
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

    device_id = str(uuid.uuid4())

    existing = db.query(USBDevice).filter(
        USBDevice.vendor_id == request.vendor_id,
        USBDevice.product_id == request.product_id,
        USBDevice.serial_number == device_info.serial_number
    ).first()

    if existing:
        existing.last_seen = datetime.utcnow()
        existing.set_fingerprint_vector(features.to_dict())
        existing.model_id = recognition_result.model_id
        existing.is_model_authorized = recognition_result.is_authorized
        db.commit()
        device_id = existing.device_id
    else:
        device = USBDevice(
            device_id=device_id,
            vendor_id=request.vendor_id,
            product_id=request.product_id,
            manufacturer=device_info.manufacturer,
            product=request.custom_name or device_info.product,
            serial_number=device_info.serial_number,
            device_type=device_info.device_type,
            model_id=recognition_result.model_id,
            is_blacklisted=False,
            is_model_authorized=recognition_result.is_authorized
        )
        device.set_fingerprint_vector(features.to_dict())
        db.add(device)
        db.commit()

    ml_model.add_device(features, device_id, request.vendor_id, request.product_id)
    ml_model.save_model()

    history = DeviceHistory(
        device_id=device_id,
        action="register",
        details=f"Device registered: {device_info.product}, Model: {recognition_result.model_name or 'Unknown'}"
    )
    db.add(history)
    db.commit()

    return {
        "success": True,
        "device_id": device_id,
        "message": "Device registered successfully",
        "model_id": recognition_result.model_id,
        "model_name": recognition_result.model_name,
        "is_model_authorized": recognition_result.is_authorized,
        "match_score": recognition_result.match_score
    }


@app.post("/devices/authenticate")
def authenticate_device(request: DeviceAuthRequest, db: Session = Depends(get_db)):
    samples = usb_capture.capture_timings(request.vendor_id, request.product_id)
    if not samples:
        return AuthResponse(success=False, message="USB device not found")

    try:
        features = feature_extractor.extract_features(samples)
    except ValueError as e:
        return AuthResponse(success=False, message=str(e))

    device_id, confidence = ml_model.predict(features, request.threshold)

    # 获取设备信息用于型号识别
    device_info = None
    for dev in usb_capture.list_devices():
        if dev.vendor_id == request.vendor_id and dev.product_id == request.product_id:
            device_info = dev
            break

    # 设备型号识别和策略检查
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
            device.last_seen = datetime.utcnow()
            device.model_id = model_id
            device.is_model_authorized = is_model_authorized
            db.commit()

            # 综合检查：设备黑名单 或 型号未授权
            is_blocked = device.is_blacklisted or not is_model_authorized

            history = DeviceHistory(
                device_id=device_id,
                action="authenticate",
                details=f"Auth: confidence={confidence:.4f}, model_authorized={is_model_authorized}, blocked={is_blocked}"
            )
            db.add(history)
            db.commit()

            if is_blocked:
                block_msg = blocked_reason or ("Device blacklisted" if device.is_blacklisted else "Device model not authorized")
                return AuthResponse(
                    success=False,
                    device_id=device_id,
                    confidence=confidence,
                    is_blacklisted=device.is_blacklisted,
                    is_model_authorized=is_model_authorized,
                    model_id=model_id,
                    model_name=model_name,
                    category=category,
                    blocked_reason=block_msg,
                    message=block_msg
                )

            return AuthResponse(
                success=True,
                device_id=device_id,
                confidence=confidence,
                is_blacklisted=device.is_blacklisted,
                is_model_authorized=is_model_authorized,
                model_id=model_id,
                model_name=model_name,
                category=category,
                message="Device authenticated"
            )

    # 未知设备也要进行型号授权检查
    if not is_model_authorized:
        return AuthResponse(
            success=False,
            confidence=confidence,
            is_model_authorized=False,
            model_id=model_id,
            model_name=model_name,
            category=category,
            blocked_reason=blocked_reason,
            message=f"Device model blocked: {blocked_reason}"
        )

    return AuthResponse(
        success=False,
        confidence=confidence,
        model_id=model_id,
        model_name=model_name,
        category=category,
        message="Unknown device or confidence below threshold"
    )


@app.get("/devices/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@app.delete("/devices/{device_id}")
def delete_device(device_id: str, db: Session = Depends(get_db)):
    device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    db.delete(device)

    history = DeviceHistory(
        device_id=device_id,
        action="delete",
        details="Device deleted"
    )
    db.add(history)

    db.commit()
    return {"success": True, "message": "Device deleted"}


@app.post("/blacklist")
def add_to_blacklist(request: BlacklistRequest, db: Session = Depends(get_db)):
    device = db.query(USBDevice).filter(USBDevice.device_id == request.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_blacklisted = True

    history = DeviceHistory(
        device_id=request.device_id,
        action="blacklist",
        details=request.reason or "Added to blacklist"
    )
    db.add(history)

    db.commit()
    return {"success": True, "message": "Device added to blacklist"}


@app.delete("/blacklist/{device_id}")
def remove_from_blacklist(device_id: str, db: Session = Depends(get_db)):
    device = db.query(USBDevice).filter(USBDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_blacklisted = False

    history = DeviceHistory(
        device_id=device_id,
        action="unblacklist",
        details="Removed from blacklist"
    )
    db.add(history)

    db.commit()
    return {"success": True, "message": "Device removed from blacklist"}


@app.get("/blacklist", response_model=List[DeviceResponse])
def list_blacklisted(db: Session = Depends(get_db)):
    devices = db.query(USBDevice).filter(USBDevice.is_blacklisted == True).all()
    return devices


# 设备型号管理接口
@app.get("/models")
def list_device_models(db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    models = recognizer.get_all_models()
    return [
        {
            "model_id": m.model_id,
            "model_name": m.model_name,
            "vendor_id": m.vendor_id,
            "product_id": m.product_id,
            "vendor_name_pattern": m.vendor_name_pattern,
            "product_name_pattern": m.product_name_pattern,
            "device_type": m.device_type,
            "category": m.category,
            "description": m.description,
            "is_authorized": m.is_authorized,
            "created_at": m.created_at
        }
        for m in models
    ]


@app.post("/models")
def create_device_model(request: DeviceModelRequest, db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    model = recognizer.register_model(
        model_name=request.model_name,
        vendor_id=request.vendor_id,
        product_id=request.product_id,
        vendor_name_pattern=request.vendor_name_pattern,
        product_name_pattern=request.product_name_pattern,
        device_type=request.device_type,
        category=request.category,
        description=request.description,
        is_authorized=request.is_authorized
    )
    return {
        "success": True,
        "model_id": model.model_id,
        "message": "Device model created successfully"
    }


@app.delete("/models/{model_id}")
def delete_device_model(model_id: str, db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    if recognizer.delete_model(model_id):
        return {"success": True, "message": "Device model deleted"}
    raise HTTPException(status_code=404, detail="Device model not found")


# 策略管理接口
@app.get("/policies")
def list_policies(db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    policies = recognizer.get_all_policies()
    return [
        {
            "id": p.id,
            "policy_type": p.policy_type.value,
            "model_id": p.model_id,
            "vendor_id": p.vendor_id,
            "product_id": p.product_id,
            "device_type": p.device_type,
            "category": p.category,
            "reason": p.reason,
            "created_at": p.created_at
        }
        for p in policies
    ]


@app.post("/policies")
def create_policy(request: ModelPolicyRequest, db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    policy = recognizer.add_policy(
        policy_type=request.policy_type,
        model_id=request.model_id,
        vendor_id=request.vendor_id,
        product_id=request.product_id,
        device_type=request.device_type,
        category=request.category,
        reason=request.reason
    )
    return {
        "success": True,
        "policy_id": policy.id,
        "message": "Policy created successfully"
    }


@app.delete("/policies/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    recognizer = DeviceModelRecognizer(db)
    if recognizer.delete_policy(policy_id):
        return {"success": True, "message": "Policy deleted"}
    raise HTTPException(status_code=404, detail="Policy not found")


@app.get("/model/importance")
def get_feature_importance():
    return ml_model.get_feature_importance()


@app.get("/history")
def get_device_history(limit: int = 100, db: Session = Depends(get_db)):
    history = db.query(DeviceHistory).order_by(DeviceHistory.timestamp.desc()).limit(limit).all()
    return history


def run_server(host: str = "0.0.0.0", port: int = 8000):
    import uvicorn
    uvicorn.run(app, host=host, port=port)
