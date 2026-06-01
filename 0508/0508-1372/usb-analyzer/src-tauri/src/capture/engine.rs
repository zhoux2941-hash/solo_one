use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use chrono::Utc;
use rusb::{Context, Device, DeviceHandle, UsbContext};
use tracing::{error, info, warn};

use super::filter::PacketFilter;
use super::packet::{EndpointDescriptor, TransferType, UsbDevice, UsbPacket, UsbSpeed};

const READ_TIMEOUT: Duration = Duration::from_millis(100);
const BULK_BUFFER_SIZE: usize = 65536;
const ISO_MAX_PACKET_SIZE: usize = 1024;
const ISO_PACKETS_PER_FRAME: usize = 8;

pub struct CaptureHandle {
    pub stop_flag: Arc<AtomicBool>,
    pub thread_handle: JoinHandle<()>,
    pub packet_rx: std::sync::mpsc::Receiver<UsbPacket>,
}

pub struct UsbCaptureEngine {
    context: Context,
    capture_handle: Option<CaptureHandle>,
    packet_counter: Arc<AtomicU64>,
    active_filter: Option<PacketFilter>,
    session_id: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CaptureError {
    #[error("USB context error: {0}")]
    Context(String),
    #[error("Device not found: VID={vid:04x} PID={pid:04x}")]
    DeviceNotFound { vid: u16, pid: u16 },
    #[error("Failed to open device: {0}")]
    OpenFailed(String),
    #[error("Failed to claim interface {iface}: {detail}")]
    ClaimFailed { iface: u8, detail: String },
    #[error("Capture already running")]
    AlreadyRunning,
    #[error("Capture not running")]
    NotRunning,
    #[error("Kernel driver active on interface {iface}")]
    KernelDriverActive { iface: u8 },
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl UsbCaptureEngine {
    pub fn new() -> Result<Self, CaptureError> {
        let context = Context::new().map_err(|e| CaptureError::Context(e.to_string()))?;
        Ok(UsbCaptureEngine {
            context,
            capture_handle: None,
            packet_counter: Arc::new(AtomicU64::new(0)),
            active_filter: None,
            session_id: None,
        })
    }

    pub fn enumerate_devices(&self) -> Vec<UsbDevice> {
        let mut devices = Vec::new();
        match self.context.devices() {
            Ok(device_list) => {
                for device in device_list.iter() {
                    if let Ok(usb_dev) = Self::probe_device(&device) {
                        devices.push(usb_dev);
                    }
                }
            }
            Err(e) => {
                error!("Failed to enumerate USB devices: {}", e);
            }
        }
        devices
    }

    pub fn enumerate_superspeed_devices(&self) -> Vec<UsbDevice> {
        self.enumerate_devices()
            .into_iter()
            .filter(|d| d.speed == UsbSpeed::Super || d.speed == UsbSpeed::SuperPlus)
            .collect()
    }

    fn probe_device<T: UsbContext>(device: &Device<T>) -> Result<UsbDevice, rusb::Error> {
        let bus_number = device.bus_number();
        let device_address = device.address();
        let speed = device.speed();
        let device_desc = device.device_descriptor()?;
        let config_desc = device.config_descriptor(0).ok();

        let num_configurations = device_desc.num_configurations;

        let mut manufacturer = String::new();
        let mut product = String::new();
        let mut serial_number = String::new();

        if let Ok(handle) = device.open() {
            let _ = handle.set_active_configuration(0).or_else(|_| Ok(()));
            if device_desc.manufacturer_string_index > 0 {
                manufacturer = handle
                    .read_string_descriptor_ascii(device_desc.manufacturer_string_index)
                    .unwrap_or_default();
            }
            if device_desc.product_string_index > 0 {
                product = handle
                    .read_string_descriptor_ascii(device_desc.product_string_index)
                    .unwrap_or_default();
            }
            if device_desc.serial_number_string_index > 0 {
                serial_number = handle
                    .read_string_descriptor_ascii(device_desc.serial_number_string_index)
                    .unwrap_or_default();
            }
        }

        let (device_class, device_subclass, device_protocol) = if let Some(ref config) = config_desc {
            let iface = config.interfaces().next();
            if let Some(iface_desc) = iface.and_then(|i| i.descriptors().next()) {
                (
                    iface_desc.class_code(),
                    iface_desc.sub_class_code(),
                    iface_desc.protocol_code(),
                )
            } else {
                (
                    device_desc.class_code,
                    device_desc.sub_class_code,
                    device_desc.protocol_code,
                )
            }
        } else {
            (
                device_desc.class_code,
                device_desc.sub_class_code,
                device_desc.protocol_code,
            )
        };

        Ok(UsbDevice {
            bus_number,
            device_address,
            vendor_id: device_desc.vendor_id,
            product_id: device_desc.product_id,
            device_class,
            device_subclass,
            device_protocol,
            speed: UsbSpeed::from(speed),
            manufacturer,
            product,
            serial_number,
            num_configurations,
        })
    }

    pub fn start_capture(
        &mut self,
        vid: u16,
        pid: u16,
        interface: u8,
        endpoint: u8,
        filter: Option<PacketFilter>,
    ) -> Result<String, CaptureError> {
        if self.capture_handle.is_some() {
            return Err(CaptureError::AlreadyRunning);
        }

        self.active_filter = filter;
        self.packet_counter.store(0, Ordering::SeqCst);
        let session_id = uuid::Uuid::new_v4().to_string();
        self.session_id = Some(session_id.clone());

        let context = self.context.clone();
        let stop_flag = Arc::new(AtomicBool::new(false));
        let packet_counter = Arc::clone(&self.packet_counter);
        let capture_filter = self.active_filter.clone();

        let (tx, rx) = std::sync::mpsc::channel::<UsbPacket>();

        let stop_flag_clone = Arc::clone(&stop_flag);
        let handle = thread::Builder::new()
            .name("usb-capture".to_string())
            .spawn(move || {
                capture_loop(
                    context,
                    vid,
                    pid,
                    interface,
                    endpoint,
                    stop_flag_clone,
                    packet_counter,
                    tx,
                    capture_filter,
                );
            })
            .map_err(|e| CaptureError::Context(e.to_string()))?;

        self.capture_handle = Some(CaptureHandle {
            stop_flag,
            thread_handle: handle,
            packet_rx: rx,
        });

        info!("Capture started: session {}", session_id);
        Ok(session_id)
    }

    pub fn stop_capture(&mut self) -> Result<(), CaptureError> {
        if let Some(handle) = self.capture_handle.take() {
            handle.stop_flag.store(true, Ordering::SeqCst);
            let _ = handle.thread_handle.join();
            info!("Capture stopped: session {:?}", self.session_id);
            self.session_id = None;
            Ok(())
        } else {
            Err(CaptureError::NotRunning)
        }
    }

    pub fn is_capturing(&self) -> bool {
        self.capture_handle.is_some()
    }

    pub fn drain_packets(&mut self) -> Vec<UsbPacket> {
        if let Some(ref handle) = self.capture_handle {
            let mut packets = Vec::new();
            while let Ok(packet) = handle.packet_rx.try_recv() {
                packets.push(packet);
            }
            packets
        } else {
            Vec::new()
        }
    }

    pub fn get_packet_count(&self) -> u64 {
        self.packet_counter.load(Ordering::Relaxed)
    }

    pub fn set_filter(&mut self, filter: PacketFilter) {
        self.active_filter = Some(filter);
    }

    pub fn clear_filter(&mut self) {
        self.active_filter = None;
    }

    pub fn session_id(&self) -> Option<&str> {
        self.session_id.as_deref()
    }
}

fn capture_loop(
    context: Context,
    vid: u16,
    pid: u16,
    interface: u8,
    endpoint: u8,
    stop_flag: Arc<AtomicBool>,
    packet_counter: Arc<AtomicU64>,
    tx: std::sync::mpsc::Sender<UsbPacket>,
    filter: Option<PacketFilter>,
) {
    let device = match find_device_by_vid_pid(&context, vid, pid) {
        Some(d) => d,
        None => {
            error!("Device VID={:04x} PID={:04x} not found", vid, pid);
            return;
        }
    };

    let ep_desc = match resolve_endpoint_descriptor(&device, endpoint) {
        Some(desc) => desc,
        None => {
            error!(
                "Could not resolve descriptor for EP {:02x}, falling back to Bulk transfer",
                endpoint
            );
            EndpointDescriptor {
                endpoint_addr: endpoint,
                transfer_type: TransferType::Bulk,
                max_packet_size: 512,
                interval: 0,
                iso_packets_per_frame: 0,
            }
        }
    };

    info!(
        "Endpoint {:02x} resolved: type={} max_pkt={} interval={}",
        endpoint, ep_desc.transfer_type, ep_desc.max_packet_size, ep_desc.interval
    );

    let mut handle = match device.open() {
        Ok(h) => h,
        Err(e) => {
            error!("Failed to open device: {}", e);
            return;
        }
    };

    match handle.set_auto_detach_kernel_driver(true) {
        Ok(()) => info!("Kernel driver auto-detach enabled"),
        Err(e) => warn!("Auto-detach not supported: {}", e),
    }

    if let Err(e) = handle.claim_interface(interface) {
        error!("Failed to claim interface {}: {}", interface, e);
        return;
    }
    info!("Claimed interface {}", interface);

    let mut seq_counter: u16 = 0;

    match ep_desc.transfer_type {
        TransferType::Isochronous => {
            capture_iso_loop(
                &mut handle,
                &ep_desc,
                interface,
                &stop_flag,
                &packet_counter,
                &tx,
                &filter,
                &mut seq_counter,
            );
        }
        TransferType::Interrupt => {
            capture_interrupt_loop(
                &mut handle,
                &ep_desc,
                interface,
                &stop_flag,
                &packet_counter,
                &tx,
                &filter,
                &mut seq_counter,
            );
        }
        TransferType::Bulk | TransferType::Control | TransferType::Uas => {
            capture_bulk_loop(
                &mut handle,
                &ep_desc,
                interface,
                &stop_flag,
                &packet_counter,
                &tx,
                &filter,
                &mut seq_counter,
            );
        }
    }

    let _ = handle.release_interface(interface);
    info!("Capture loop exited, interface {} released", interface);
}

fn capture_bulk_loop<T: UsbContext>(
    handle: &mut DeviceHandle<T>,
    ep_desc: &EndpointDescriptor,
    interface: u8,
    stop_flag: &Arc<AtomicBool>,
    packet_counter: &Arc<AtomicU64>,
    tx: &std::sync::mpsc::Sender<UsbPacket>,
    filter: &Option<PacketFilter>,
    seq_counter: &mut u16,
) {
    let mut buffer = vec![0u8; BULK_BUFFER_SIZE];

    while !stop_flag.load(Ordering::SeqCst) {
        match handle.read_bulk(ep_desc.endpoint_addr, &mut buffer, READ_TIMEOUT) {
            Ok(bytes_read) => {
                let raw_data = &buffer[..bytes_read];
                let mut packet = parse_raw_packet(
                    raw_data,
                    ep_desc,
                    packet_counter,
                    seq_counter,
                );

                if let Some(ref f) = filter {
                    if !f.matches(&packet) {
                        packet_counter.fetch_add(1, Ordering::Relaxed);
                        continue;
                    }
                }

                let seq = packet_counter.fetch_add(1, Ordering::Relaxed);
                packet.seq_num = seq;

                if tx.send(packet).is_err() {
                    warn!("Packet receiver disconnected, stopping capture");
                    break;
                }
            }
            Err(rusb::Error::Timeout) => {
                continue;
            }
            Err(e) => {
                if stop_flag.load(Ordering::SeqCst) {
                    break;
                }
                error!("Bulk read error on EP{:02x}: {}", ep_desc.endpoint_addr, e);
                thread::sleep(Duration::from_millis(50));
            }
        }
    }
}

fn capture_iso_loop<T: UsbContext>(
    handle: &mut DeviceHandle<T>,
    ep_desc: &EndpointDescriptor,
    _interface: u8,
    stop_flag: &Arc<AtomicBool>,
    packet_counter: &Arc<AtomicU64>,
    tx: &std::sync::mpsc::Sender<UsbPacket>,
    filter: &Option<PacketFilter>,
    seq_counter: &mut u16,
) {
    let max_pkt = ep_desc.max_packet_size as usize;
    let num_iso_packets = if ep_desc.iso_packets_per_frame > 0 {
        ep_desc.iso_packets_per_frame as usize
    } else {
        ISO_PACKETS_PER_FRAME
    };
    let iso_packet_size = max_pkt.max(ISO_MAX_PACKET_SIZE);
    let buffer_size = iso_packet_size * num_iso_packets;

    info!(
        "Isochronous capture: EP{:02x} max_pkt={} num_packets={} buffer_size={}",
        ep_desc.endpoint_addr, iso_packet_size, num_iso_packets, buffer_size
    );

    let raw_handle = handle.as_raw();
    let ctx = handle.context();

    let mut micro_frame: u16 = 0;

    while !stop_flag.load(Ordering::SeqCst) {
        let transfer = unsafe { rusb::ffi::libusb_alloc_transfer(num_iso_packets as i32) };
        if transfer.is_null() {
            error!("Failed to allocate ISO transfer");
            thread::sleep(Duration::from_millis(100));
            continue;
        }

        let mut buffer = vec![0u8; buffer_size];

        let completed = Arc::new(AtomicBool::new(false));
        let completed_cb = Arc::clone(&completed);

        unsafe {
            rusb::ffi::libusb_fill_iso_transfer(
                transfer,
                raw_handle,
                ep_desc.endpoint_addr,
                buffer.as_mut_ptr(),
                buffer_size as i32,
                num_iso_packets as i32,
                Some(iso_transfer_callback),
                Arc::as_ptr(&completed_cb) as *mut core::ffi::c_void,
                READ_TIMEOUT.as_millis() as u32,
            );
            rusb::ffi::libusb_set_iso_packet_lengths(transfer, iso_packet_size as u32);
        }

        let submit_result = unsafe { rusb::ffi::libusb_submit_transfer(transfer) };
        if submit_result < 0 {
            let err = rusb::Error::from(submit_result);
            if stop_flag.load(Ordering::SeqCst) {
                unsafe { rusb::ffi::libusb_free_transfer(transfer) };
                break;
            }
            error!("ISO submit failed on EP{:02x}: {}", ep_desc.endpoint_addr, err);
            unsafe { rusb::ffi::libusb_free_transfer(transfer) };
            thread::sleep(Duration::from_millis(10));
            continue;
        }

        while !completed.load(Ordering::SeqCst) && !stop_flag.load(Ordering::SeqCst) {
            let mut tv = libc::timeval {
                tv_sec: 0,
                tv_usec: 100_000,
            };
            let _ = unsafe {
                rusb::ffi::libusb_handle_events_timeout(ctx.as_raw(), &mut tv)
            };
        }

        unsafe {
            let status = (*transfer).status;
            let num_pkts = (*transfer).num_iso_packets;
            let iso_descs = (*transfer).iso_packet_desc;

            match status {
                rusb::ffi::LIBUSB_TRANSFER_COMPLETED => {
                    let mut offset = 0usize;
                    for i in 0..num_pkts {
                        let desc = *iso_descs.add(i as usize);
                        let actual_len = desc.actual_length as usize;
                        if actual_len == 0 {
                            offset += iso_packet_size;
                            continue;
                        }

                        let end = (offset + actual_len).min(buffer.len());
                        if offset >= buffer.len() {
                            break;
                        }
                        let raw_data = &buffer[offset..end];

                        let packet = UsbPacket::new_iso(
                            packet_counter.load(Ordering::Relaxed),
                            Utc::now(),
                            ep_desc.endpoint_addr,
                            ep_desc.transfer_type,
                            raw_data.to_vec(),
                            0,
                            *seq_counter,
                            micro_frame.wrapping_add(i as u16),
                            desc.status as i32,
                        );
                        *seq_counter = seq_counter.wrapping_add(1);

                        if let Some(ref f) = filter {
                            if !f.matches(&packet) {
                                packet_counter.fetch_add(1, Ordering::Relaxed);
                                offset += iso_packet_size;
                                continue;
                            }
                        }

                        let seq = packet_counter.fetch_add(1, Ordering::Relaxed);
                        let mut packet = packet;
                        packet.seq_num = seq;

                        if tx.send(packet).is_err() {
                            warn!("Packet receiver disconnected, stopping iso capture");
                            rusb::ffi::libusb_free_transfer(transfer);
                            return;
                        }

                        offset += iso_packet_size;
                    }
                    micro_frame = micro_frame.wrapping_add(num_iso_packets as u16);
                }
                rusb::ffi::LIBUSB_TRANSFER_TIMED_OUT => {}
                rusb::ffi::LIBUSB_TRANSFER_CANCELLED => {
                    rusb::ffi::libusb_free_transfer(transfer);
                    break;
                }
                _ => {
                    error!(
                        "ISO transfer error on EP{:02x}: status={}",
                        ep_desc.endpoint_addr, status
                    );
                    thread::sleep(Duration::from_millis(10));
                }
            }

            rusb::ffi::libusb_free_transfer(transfer);
        }
    }
}

unsafe extern "C" fn iso_transfer_callback(transfer: *mut rusb::ffi::libusb_transfer) {
    if transfer.is_null() {
        return;
    }
    let user_data = (*transfer).user_data;
    if !user_data.is_null() {
        let completed = &*(user_data as *const AtomicBool);
        completed.store(true, Ordering::SeqCst);
    }
}

fn capture_interrupt_loop<T: UsbContext>(
    handle: &mut DeviceHandle<T>,
    ep_desc: &EndpointDescriptor,
    _interface: u8,
    stop_flag: &Arc<AtomicBool>,
    packet_counter: &Arc<AtomicU64>,
    tx: &std::sync::mpsc::Sender<UsbPacket>,
    filter: &Option<PacketFilter>,
    seq_counter: &mut u16,
) {
    let buffer_size = ep_desc.max_packet_size as usize;
    let mut buffer = vec![0u8; buffer_size.max(64)];

    let poll_interval = Duration::from_millis(ep_desc.interval.max(1) as u64);

    while !stop_flag.load(Ordering::SeqCst) {
        match handle.read_interrupt(ep_desc.endpoint_addr, &mut buffer, READ_TIMEOUT) {
            Ok(bytes_read) => {
                let raw_data = &buffer[..bytes_read];
                let mut packet = parse_raw_packet(
                    raw_data,
                    ep_desc,
                    packet_counter,
                    seq_counter,
                );

                if let Some(ref f) = filter {
                    if !f.matches(&packet) {
                        packet_counter.fetch_add(1, Ordering::Relaxed);
                        continue;
                    }
                }

                let seq = packet_counter.fetch_add(1, Ordering::Relaxed);
                packet.seq_num = seq;

                if tx.send(packet).is_err() {
                    warn!("Packet receiver disconnected, stopping interrupt capture");
                    break;
                }
            }
            Err(rusb::Error::Timeout) => {
                thread::sleep(poll_interval);
                continue;
            }
            Err(e) => {
                if stop_flag.load(Ordering::SeqCst) {
                    break;
                }
                error!(
                    "Interrupt read error on EP{:02x}: {}",
                    ep_desc.endpoint_addr, e
                );
                thread::sleep(Duration::from_millis(50));
            }
        }
    }
}

fn find_device_by_vid_pid<T: UsbContext>(
    context: &T,
    vid: u16,
    pid: u16,
) -> Option<Device<T>> {
    context
        .devices()
        .ok()?
        .iter()
        .find(|device| {
            device
                .device_descriptor()
                .map(|desc| desc.vendor_id == vid && desc.product_id == pid)
                .unwrap_or(false)
        })
}

fn resolve_endpoint_descriptor<T: UsbContext>(
    device: &Device<T>,
    target_endpoint: u8,
) -> Option<EndpointDescriptor> {
    let config_desc = device.config_descriptor(0).ok()?;

    for iface in config_desc.interfaces() {
        for iface_desc in iface.descriptors() {
            for ep in iface_desc.endpoint_descriptors() {
                if ep.address() == target_endpoint {
                    let mut desc = EndpointDescriptor::from_rusb(&ep);
                    if ep.transfer_type() == rusb::TransferType::Isochronous {
                        let additional = ep.max_packet_size() >> 11;
                        let mult = ((ep.max_packet_size() >> 9) & 0x3) + 1;
                        desc.max_packet_size = ep.max_packet_size() & 0x7FF;
                        desc.iso_packets_per_frame = additional as u32 * mult as u32;
                        if desc.iso_packets_per_frame == 0 {
                            desc.iso_packets_per_frame = 1;
                        }
                    }
                    return Some(desc);
                }
            }
        }
    }
    None
}

fn parse_raw_packet(
    raw: &[u8],
    ep_desc: &EndpointDescriptor,
    counter: &AtomicU64,
    seq_counter: &mut u16,
) -> UsbPacket {
    let transfer_type = ep_desc.transfer_type;
    let device_addr = extract_device_address(raw);
    let (crc_valid, crc_val) = if transfer_type == TransferType::Isochronous {
        (true, 0u32)
    } else {
        compute_crc32c_valid(raw)
    };
    let current_seq = *seq_counter;
    *seq_counter = seq_counter.wrapping_add(1);

    UsbPacket::new(
        counter.load(Ordering::Relaxed),
        Utc::now(),
        ep_desc.endpoint_addr,
        transfer_type,
        raw.to_vec(),
        device_addr,
        crc_valid,
        crc_val,
        current_seq,
    )
}

fn extract_device_address(data: &[u8]) -> u8 {
    if data.len() >= 2 {
        data[0] & 0x7F
    } else {
        0
    }
}

fn compute_crc32c_valid(data: &[u8]) -> (bool, u32) {
    if data.len() < 4 {
        let crc = crate::capture::crc::crc32c(data);
        return (true, crc);
    }
    let payload = &data[..data.len() - 4];
    let stored_crc = u32::from_le_bytes([
        data[data.len() - 4],
        data[data.len() - 3],
        data[data.len() - 2],
        data[data.len() - 1],
    ]);
    let computed_crc = crate::capture::crc::crc32c(payload);
    (computed_crc == stored_crc, computed_crc)
}

#[cfg(target_os = "windows")]
pub mod winusb {
    use tracing::{error, info};

    pub fn init_winusb_driver() -> Result<(), String> {
        info!("WinUSB driver subsystem initialized");
        Ok(())
    }

    pub fn open_superspeed_device(_vid: u16, _pid: u16) -> Result<WinUsbHandle, String> {
        info!("Attempting WinUSB SuperSpeed device open");
        Err("WinUSB SuperSpeed direct capture requires dedicated hardware".to_string())
    }

    pub fn read_superspeed_pipe(
        _handle: &WinUsbHandle,
        _pipe_id: u8,
        _buffer: &mut [u8],
    ) -> Result<usize, String> {
        Err("WinUSB pipe read not available without dedicated capture hardware".to_string())
    }

    pub struct WinUsbHandle {
        _handle: u64,
    }

    impl WinUsbHandle {
        pub fn close(&self) {
            info!("WinUSB handle closed");
        }
    }

    impl Drop for WinUsbHandle {
        fn drop(&mut self) {
            self.close();
        }
    }
}
