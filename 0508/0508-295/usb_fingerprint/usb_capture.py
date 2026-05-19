import usb.core
import usb.util
import time
import threading
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class USBTimingSample:
    timestamp: float
    setup_response_time: float
    endpoint: int
    transfer_type: str


@dataclass
class USBDeviceInfo:
    vendor_id: int
    product_id: int
    manufacturer: str
    product: str
    serial_number: str
    device_type: str
    bus: int
    address: int


class USBCapture:
    def __init__(self, sample_count: int = 50, timeout: int = 5000):
        self.sample_count = sample_count
        self.timeout = timeout
        self.devices = {}

    def list_devices(self) -> List[USBDeviceInfo]:
        devices = []
        for dev in usb.core.find(find_all=True):
            try:
                device_info = self._get_device_info(dev)
                devices.append(device_info)
            except Exception as e:
                logger.debug(f"Error reading device: {e}")
        return devices

    def _get_device_info(self, dev) -> USBDeviceInfo:
        manufacturer = ""
        product = ""
        serial_number = ""

        try:
            if dev.iManufacturer:
                manufacturer = usb.util.get_string(dev, dev.iManufacturer)
        except:
            pass

        try:
            if dev.iProduct:
                product = usb.util.get_string(dev, dev.iProduct)
        except:
            pass

        try:
            if dev.iSerialNumber:
                serial_number = usb.util.get_string(dev, dev.iSerialNumber)
        except:
            pass

        device_type = self._detect_device_type(dev)

        return USBDeviceInfo(
            vendor_id=dev.idVendor,
            product_id=dev.idProduct,
            manufacturer=manufacturer or "Unknown",
            product=product or "Unknown",
            serial_number=serial_number or "Unknown",
            device_type=device_type,
            bus=dev.bus,
            address=dev.address
        )

    def _detect_device_type(self, dev) -> str:
        device_class = dev.bDeviceClass
        device_subclass = dev.bDeviceSubClass
        device_protocol = dev.bDeviceProtocol

        if device_class == 0:
            for cfg in dev:
                for intf in cfg:
                    if intf.bInterfaceClass == 3:
                        return "HID"
                    elif intf.bInterfaceClass == 8:
                        return "Mass Storage"
                    elif intf.bInterfaceClass == 2:
                        return "Communication"
                    elif intf.bInterfaceClass == 255:
                        return "Vendor Specific"

        if device_class == 3:
            return "HID"
        elif device_class == 8:
            return "Mass Storage"
        elif device_class == 2:
            return "Communication"
        elif device_class == 9:
            return "Hub"
        elif device_class == 224:
            return "Wireless"

        return "Unknown"

    def capture_timings(self, vendor_id: int, product_id: int) -> Optional[List[USBTimingSample]]:
        dev = usb.core.find(idVendor=vendor_id, idProduct=product_id)
        if dev is None:
            logger.error(f"Device not found: {vendor_id:04x}:{product_id:04x}")
            return None

        samples = []

        try:
            if dev.is_kernel_driver_active(0):
                dev.detach_kernel_driver(0)
        except:
            pass

        try:
            dev.set_configuration()
        except Exception as e:
            logger.debug(f"Could not set configuration: {e}")

        cfg = dev.get_active_configuration()
        intf = cfg[(0, 0)]

        ep_list = []
        for ep in intf:
            ep_list.append(ep.bEndpointAddress)

        for i in range(self.sample_count):
            try:
                start_time = time.perf_counter()

                bmRequestType = usb.util.CTRL_TYPE_STANDARD | usb.util.CTRL_RECIPIENT_DEVICE | usb.util.CTRL_IN
                bRequest = 0x06
                wValue = 0x0100
                wIndex = 0
                wLength = 18

                setup_start = time.perf_counter()
                try:
                    data = dev.ctrl_transfer(bmRequestType, bRequest, wValue, wIndex, wLength, timeout=self.timeout)
                    setup_end = time.perf_counter()
                    setup_response_time = (setup_end - setup_start) * 1000

                    sample = USBTimingSample(
                        timestamp=time.time(),
                        setup_response_time=setup_response_time,
                        endpoint=0,
                        transfer_type="control"
                    )
                    samples.append(sample)
                except Exception as e:
                    logger.debug(f"Control transfer error: {e}")

                time.sleep(0.01)

            except Exception as e:
                logger.debug(f"Sample {i} error: {e}")

        try:
            usb.util.dispose_resources(dev)
        except:
            pass

        return samples

    def monitor_hotplug(self, callback):
        def monitor():
            previous_devices = set()
            for dev in self.list_devices():
                previous_devices.add((dev.vendor_id, dev.product_id, dev.serial_number))

            while True:
                current_devices = set()
                for dev in self.list_devices():
                    current_devices.add((dev.vendor_id, dev.product_id, dev.serial_number))

                added = current_devices - previous_devices
                removed = previous_devices - current_devices

                for device_id in added:
                    callback("add", device_id)
                for device_id in removed:
                    callback("remove", device_id)

                previous_devices = current_devices
                time.sleep(1)

        thread = threading.Thread(target=monitor, daemon=True)
        thread.start()
        return thread
