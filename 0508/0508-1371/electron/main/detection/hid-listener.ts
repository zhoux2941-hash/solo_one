import EventEmitter from 'events';
import HID from 'node-hid';
import { usb } from 'usb';
import type { Device } from 'usb';
import crypto from 'crypto';
import type { HIDDevice, HIDInputEvent } from '@shared/types';

const KEYBOARD_USAGE_PAGE = 0x01;
const KEYBOARD_USAGE = 0x06;
const MOUSE_USAGE_PAGE = 0x01;
const MOUSE_USAGE = 0x02;

const MODIFIER_KEYS: Record<number, string> = {
  0xe0: 'ControlLeft',
  0xe1: 'ShiftLeft',
  0xe2: 'AltLeft',
  0xe3: 'MetaLeft',
  0xe4: 'ControlRight',
  0xe5: 'ShiftRight',
  0xe6: 'AltRight',
  0xe7: 'MetaRight',
};

const KEYCODE_MAP: Record<number, string> = {
  0x04: 'a', 0x05: 'b', 0x06: 'c', 0x07: 'd', 0x08: 'e',
  0x09: 'f', 0x0a: 'g', 0x0b: 'h', 0x0c: 'i', 0x0d: 'j',
  0x0e: 'k', 0x0f: 'l', 0x10: 'm', 0x11: 'n', 0x12: 'o',
  0x13: 'p', 0x14: 'q', 0x15: 'r', 0x16: 's', 0x17: 't',
  0x18: 'u', 0x19: 'v', 0x1a: 'w', 0x1b: 'x', 0x1c: 'y',
  0x1d: 'z', 0x1e: '1', 0x1f: '2', 0x20: '3', 0x21: '4',
  0x22: '5', 0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9',
  0x27: '0', 0x28: 'Enter', 0x29: 'Escape', 0x2a: 'Backspace',
  0x2b: 'Tab', 0x2c: ' ', 0x2d: '-', 0x2e: '=', 0x2f: '[',
  0x30: ']', 0x31: '\\', 0x33: ';', 0x34: "'", 0x36: ',',
  0x37: '.', 0x38: '/', 0x39: 'CapsLock',
  0x3a: 'F1', 0x3b: 'F2', 0x3c: 'F3', 0x3d: 'F4', 0x3e: 'F5',
  0x3f: 'F6', 0x40: 'F7', 0x41: 'F8', 0x42: 'F9', 0x43: 'F10',
  0x44: 'F11', 0x45: 'F12', 0x4f: 'ArrowRight', 0x50: 'ArrowLeft',
  0x51: 'ArrowDown', 0x52: 'ArrowUp',
};

interface OpenedDevice {
  device: HID.HID;
  info: HID.Device;
  deviceType: 'keyboard' | 'mouse' | 'other';
  dataHandler: (data: Buffer) => void;
  errorHandler: (error: Error) => void;
}

interface DeviceAttachTimeout {
  [key: string]: NodeJS.Timeout;
}

export class HIDListener extends EventEmitter {
  private openedDevices: Map<string, OpenedDevice> = new Map();
  private isListening: boolean = false;
  private screenWidth: number = 1920;
  private screenHeight: number = 1080;
  private attachTimeouts: DeviceAttachTimeout = {};

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  enumerateDevices(): HIDDevice[] {
    const devices = HID.devices();
    return devices.map((d) => this.mapToHIDDevice(d));
  }

  startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    this.enumerateAndOpenDevices();

    usb.on('attach', (device: Device) => {
      this.handleDeviceAttach(device);
    });

    usb.on('detach', (device: Device) => {
      this.handleDeviceDetach(device);
    });

    this.emit('listening-started');
  }

  stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;

    for (const timeoutKey of Object.keys(this.attachTimeouts)) {
      clearTimeout(this.attachTimeouts[timeoutKey]);
      delete this.attachTimeouts[timeoutKey];
    }

    for (const [path, opened] of this.openedDevices) {
      try {
        opened.device.removeListener('data', opened.dataHandler);
        opened.device.removeListener('error', opened.errorHandler);
        opened.device.close();
      } catch {
        // ignore
      }
    }
    this.openedDevices.clear();

    usb.removeAllListeners('attach');
    usb.removeAllListeners('detach');

    this.removeAllListeners();

    this.emit('listening-stopped');
  }

  private enumerateAndOpenDevices(): void {
    const devices = HID.devices();
    for (const deviceInfo of devices) {
      if (deviceInfo.path && !this.openedDevices.has(deviceInfo.path)) {
        this.openDevice(deviceInfo);
      }
    }
  }

  private openDevice(deviceInfo: HID.Device): void {
    if (!deviceInfo.path) return;

    try {
      const device = new HID.HID(deviceInfo.path);
      const deviceType = this.getDeviceType(deviceInfo);

      const dataHandler = (data: Buffer) => {
        this.handleInputData(deviceInfo, deviceType, data);
      };

      const errorHandler = (error: Error) => {
        this.emit('device-error', { devicePath: deviceInfo.path, error });
      };

      device.on('data', dataHandler);
      device.on('error', errorHandler);

      this.openedDevices.set(deviceInfo.path, { 
        device, 
        info: deviceInfo, 
        deviceType,
        dataHandler,
        errorHandler
      });
      this.emit('device-opened', this.mapToHIDDevice(deviceInfo));
    } catch (error) {
      this.emit('device-open-failed', {
        devicePath: deviceInfo.path,
        vendorId: deviceInfo.vendorId,
        productId: deviceInfo.productId,
        error,
      });
    }
  }

  private handleDeviceAttach(device: Device): void {
    const deviceKey = `${device.deviceDescriptor.idVendor}-${device.deviceDescriptor.idProduct}`;
    
    if (this.attachTimeouts[deviceKey]) {
      clearTimeout(this.attachTimeouts[deviceKey]);
    }

    this.attachTimeouts[deviceKey] = setTimeout(() => {
      delete this.attachTimeouts[deviceKey];
      const devices = HID.devices();
      const matching = devices.find(
        (d) => d.vendorId === device.deviceDescriptor.idVendor && d.productId === device.deviceDescriptor.idProduct
      );
      if (matching && matching.path) {
        this.openDevice(matching);
        this.emit('device-attached', this.mapToHIDDevice(matching));
      }
    }, 500);
  }

  private handleDeviceDetach(device: Device): void {
    for (const [path, opened] of this.openedDevices) {
      if (
        opened.info.vendorId === device.deviceDescriptor.idVendor &&
        opened.info.productId === device.deviceDescriptor.idProduct
      ) {
        try {
          opened.device.removeListener('data', opened.dataHandler);
          opened.device.removeListener('error', opened.errorHandler);
          opened.device.close();
        } catch {
          // ignore
        }
        this.openedDevices.delete(path);
        this.emit('device-detached', this.mapToHIDDevice(opened.info));
        break;
      }
    }
  }

  private getDeviceType(deviceInfo: HID.Device): 'keyboard' | 'mouse' | 'other' {
    const { usagePage, usage } = deviceInfo;
    if (usagePage === KEYBOARD_USAGE_PAGE && usage === KEYBOARD_USAGE) {
      return 'keyboard';
    }
    if (usagePage === MOUSE_USAGE_PAGE && usage === MOUSE_USAGE) {
      return 'mouse';
    }
    const product = (deviceInfo.product || '').toLowerCase();
    if (product.includes('keyboard')) return 'keyboard';
    if (product.includes('mouse')) return 'mouse';
    return 'other';
  }

  private handleInputData(
    deviceInfo: HID.Device,
    deviceType: 'keyboard' | 'mouse' | 'other',
    data: Buffer
  ): void {
    const startTime = process.hrtime.bigint();
    const rawData = Array.from(data);
    const event: Partial<HIDInputEvent> = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      devicePath: deviceInfo.path || '',
      device: this.mapToHIDDevice(deviceInfo),
      type: deviceType,
      rawData,
    };

    if (deviceType === 'keyboard') {
      this.parseKeyboardReport(data, event);
    } else if (deviceType === 'mouse') {
      this.parseMouseReport(data, event);
    }

    const endTime = process.hrtime.bigint();
    event.processingTimeMs = Number(endTime - startTime) / 1_000_000;

    this.emit('input-event', event as HIDInputEvent);
  }

  private parseKeyboardReport(data: Buffer, event: Partial<HIDInputEvent>): void {
    if (data.length < 3) return;

    const modifierByte = data[0];
    const modifiers: string[] = [];

    for (let i = 0; i < 8; i++) {
      if (modifierByte & (1 << i)) {
        const key = MODIFIER_KEYS[0xe0 + i];
        if (key) modifiers.push(key);
      }
    }

    event.modifiers = modifiers;
    event.isModifier = modifiers.length > 0;

    for (let i = 2; i < Math.min(data.length, 8); i++) {
      const keyCode = data[i];
      if (keyCode !== 0x00) {
        event.keyCode = keyCode;
        event.keyName = KEYCODE_MAP[keyCode] || `Unknown(0x${keyCode.toString(16)})`;
        break;
      }
    }
  }

  private parseMouseReport(data: Buffer, event: Partial<HIDInputEvent>): void {
    if (data.length < 4) return;

    const buttonByte = data[0];
    let xDelta = data[1];
    let yDelta = data[2];
    const wheelDelta = data.length > 3 ? data[3] : 0;

    if (xDelta & 0x80) xDelta = xDelta - 0x100;
    if (yDelta & 0x80) yDelta = yDelta - 0x100;

    event.mouseX = xDelta;
    event.mouseY = yDelta;

    if (buttonByte & 0x01) event.keyName = 'MouseLeft';
    else if (buttonByte & 0x02) event.keyName = 'MouseRight';
    else if (buttonByte & 0x04) event.keyName = 'MouseMiddle';
    else if (wheelDelta !== 0) event.keyName = 'MouseWheel';

    event.keyCode = buttonByte;
  }

  private mapToHIDDevice(d: HID.Device): HIDDevice {
    return {
      vendorId: d.vendorId,
      productId: d.productId,
      manufacturer: d.manufacturer || '',
      productName: d.product || '',
      serialNumber: d.serialNumber || '',
      devicePath: d.path || '',
      firstSeen: new Date(),
    };
  }

  isRunning(): boolean {
    return this.isListening;
  }

  getOpenedDeviceCount(): number {
    return this.openedDevices.size;
  }

  destroy(): void {
    this.stopListening();
    this.removeAllListeners();
  }
}

export default HIDListener;
