package com.networkscanner.scanner;

import com.networkscanner.model.DeviceInfo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NetworkScanner {
    private static final int DEFAULT_TIMEOUT = 1000;
    private static final int DEFAULT_THREADS = 50;
    private static final int[] COMMON_PORTS = {21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3306, 3389, 8080, 8443};

    private int timeout;
    private int threadCount;
    private int[] portsToScan;
    private volatile boolean isScanning;
    private ExecutorService executorService;
    private List<ScanListener> listeners;
    private List<DeviceInfo> devicesFound;

    public NetworkScanner() {
        this.timeout = DEFAULT_TIMEOUT;
        this.threadCount = DEFAULT_THREADS;
        this.portsToScan = COMMON_PORTS;
        this.listeners = new ArrayList<>();
        this.devicesFound = new ArrayList<>();
        this.isScanning = false;
    }

    public void addScanListener(ScanListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public void removeScanListener(ScanListener listener) {
        listeners.remove(listener);
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public void setThreadCount(int threadCount) {
        this.threadCount = threadCount;
    }

    public void setPortsToScan(int[] ports) {
        this.portsToScan = ports != null ? ports : new int[0];
    }

    public boolean isScanning() {
        return isScanning;
    }

    public void stopScan() {
        if (!isScanning) {
            return;
        }
        isScanning = false;
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdownNow();
        }
        notifyScanStopped(new ArrayList<>(devicesFound));
    }

    public List<String> parseNetworkRange(String networkRange) {
        List<String> ips = new ArrayList<>();
        try {
            Pattern cidrPattern = Pattern.compile("^(\\d+\\.\\d+\\.\\d+\\.\\d+)/(\\d+)$");
            Matcher cidrMatcher = cidrPattern.matcher(networkRange.trim());

            if (cidrMatcher.matches()) {
                String baseIp = cidrMatcher.group(1);
                int prefix = Integer.parseInt(cidrMatcher.group(2));
                ips.addAll(getIpRangeFromCidr(baseIp, prefix));
            } else {
                Pattern rangePattern = Pattern.compile("^(\\d+\\.\\d+\\.\\d+\\.)(\\d+)-(\\d+)$");
                Matcher rangeMatcher = rangePattern.matcher(networkRange.trim());

                if (rangeMatcher.matches()) {
                    String prefix = rangeMatcher.group(1);
                    int start = Integer.parseInt(rangeMatcher.group(2));
                    int end = Integer.parseInt(rangeMatcher.group(3));

                    for (int i = start; i <= end && i <= 255; i++) {
                        ips.add(prefix + i);
                    }
                } else {
                    String[] parts = networkRange.split("\\.");
                    if (parts.length == 4) {
                        if (parts[3].contains("-")) {
                            String[] lastOctet = parts[3].split("-");
                            int start = Integer.parseInt(lastOctet[0]);
                            int end = Integer.parseInt(lastOctet[1]);
                            for (int i = start; i <= end && i <= 255; i++) {
                                ips.add(parts[0] + "." + parts[1] + "." + parts[2] + "." + i);
                            }
                        } else {
                            ips.add(networkRange);
                        }
                    }
                }
            }
        } catch (Exception e) {
            notifyError("解析网段失败: " + e.getMessage());
        }
        return ips;
    }

    private List<String> getIpRangeFromCidr(String baseIp, int prefix) {
        List<String> ips = new ArrayList<>();
        try {
            int ip = ipToInt(InetAddress.getByName(baseIp));
            int mask = 0xFFFFFFFF << (32 - prefix);
            int network = ip & mask;
            int broadcast = network | (~mask);

            for (int i = network + 1; i < broadcast; i++) {
                ips.add(intToIp(i));
            }
        } catch (UnknownHostException e) {
            notifyError("CIDR解析失败: " + e.getMessage());
        }
        return ips;
    }

    private int ipToInt(InetAddress inetAddress) {
        byte[] bytes = inetAddress.getAddress();
        return ((bytes[0] & 0xFF) << 24) |
               ((bytes[1] & 0xFF) << 16) |
               ((bytes[2] & 0xFF) << 8) |
               (bytes[3] & 0xFF);
    }

    private String intToIp(int ip) {
        return ((ip >> 24) & 0xFF) + "." +
               ((ip >> 16) & 0xFF) + "." +
               ((ip >> 8) & 0xFF) + "." +
               (ip & 0xFF);
    }

    public void scanNetwork(String networkRange) {
        if (isScanning) {
            notifyError("扫描正在进行中");
            return;
        }

        List<String> ips = parseNetworkRange(networkRange);
        if (ips.isEmpty()) {
            notifyError("未找到有效的IP地址");
            return;
        }

        isScanning = true;
        devicesFound.clear();
        notifyScanStart(ips.size());

        executorService = Executors.newFixedThreadPool(threadCount);
        List<Future<DeviceInfo>> futures = new ArrayList<>();

        for (String ip : ips) {
            futures.add(executorService.submit(() -> scanDevice(ip)));
        }

        executorService.submit(() -> {
            List<DeviceInfo> devices = new ArrayList<>();
            int completed = 0;

            for (Future<DeviceInfo> future : futures) {
                if (!isScanning) break;
                try {
                    DeviceInfo device = future.get(5, TimeUnit.SECONDS);
                    if (device != null && device.isOnline()) {
                        devices.add(device);
                        devicesFound.add(device);
                        notifyDeviceFound(device);
                    }
                    completed++;
                    notifyScanProgress(completed, ips.size());
                } catch (Exception e) {
                    completed++;
                    notifyScanProgress(completed, ips.size());
                }
            }

            if (isScanning) {
                isScanning = false;
                executorService.shutdown();
                notifyScanComplete(devices);
            }
        });
    }

    private DeviceInfo scanDevice(String ipAddress) {
        if (!isScanning) return null;

        DeviceInfo device = new DeviceInfo(ipAddress);

        try {
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            long startTime = System.currentTimeMillis();
            boolean reachable = inetAddress.isReachable(timeout);
            long responseTime = System.currentTimeMillis() - startTime;

            if (reachable) {
                device.setOnline(true);
                device.setResponseTime(responseTime);

                String hostname = inetAddress.getHostName();
                if (!hostname.equals(ipAddress)) {
                    device.setDeviceName(hostname);
                }

                String mac = getMacAddress(ipAddress);
                if (mac != null) {
                    device.setMacAddress(mac);
                }

                if (portsToScan.length > 0) {
                    scanPorts(device);
                }
            }
        } catch (IOException e) {
            // Device not reachable
        }

        return device;
    }

    private String getMacAddress(String ipAddress) {
        String os = System.getProperty("os.name").toLowerCase();
        try {
            Process process;
            if (os.contains("win")) {
                process = Runtime.getRuntime().exec("arp -a " + ipAddress);
            } else {
                process = Runtime.getRuntime().exec("arp " + ipAddress);
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            Pattern macPattern = Pattern.compile("([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})");

            while ((line = reader.readLine()) != null) {
                Matcher matcher = macPattern.matcher(line);
                if (matcher.find()) {
                    return matcher.group().toUpperCase();
                }
            }
            reader.close();
        } catch (Exception e) {
            // Ignore MAC address retrieval errors
        }
        return null;
    }

    private void scanPorts(DeviceInfo device) {
        for (int port : portsToScan) {
            if (!isScanning) break;
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(device.getIpAddress(), port), 200);
                device.addOpenPort(port);
            } catch (IOException e) {
                // Port is closed
            }
        }
    }

    private void notifyScanStart(int totalDevices) {
        for (ScanListener listener : listeners) {
            listener.onScanStart(totalDevices);
        }
    }

    private void notifyDeviceFound(DeviceInfo device) {
        for (ScanListener listener : listeners) {
            listener.onDeviceFound(device);
        }
    }

    private void notifyScanProgress(int current, int total) {
        for (ScanListener listener : listeners) {
            listener.onScanProgress(current, total);
        }
    }

    private void notifyScanComplete(List<DeviceInfo> devices) {
        for (ScanListener listener : listeners) {
            listener.onScanComplete(devices);
        }
    }

    private void notifyScanStopped(List<DeviceInfo> devices) {
        for (ScanListener listener : listeners) {
            listener.onScanStopped(devices);
        }
    }

    private void notifyError(String error) {
        for (ScanListener listener : listeners) {
            listener.onScanError(error);
        }
    }
}
