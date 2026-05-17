package com.networkscanner.exporter;

import com.networkscanner.model.DeviceInfo;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

public class ResultExporter {

    public static boolean exportToTxt(List<DeviceInfo> devices, String filePath) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath))) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            writer.write("========================================");
            writer.newLine();
            writer.write("局域网设备扫描报告");
            writer.newLine();
            writer.write("生成时间: " + sdf.format(new Date()));
            writer.newLine();
            writer.write("========================================");
            writer.newLine();
            writer.newLine();

            writer.write("在线设备总数: " + devices.size());
            writer.newLine();
            writer.newLine();

            for (int i = 0; i < devices.size(); i++) {
                DeviceInfo device = devices.get(i);
                writer.write("设备 #" + (i + 1));
                writer.newLine();
                writer.write("----------------------------------------");
                writer.newLine();
                writer.write("IP 地址: " + device.getIpAddress());
                writer.newLine();
                if (device.getMacAddress() != null) {
                    writer.write("MAC 地址: " + device.getMacAddress());
                    writer.newLine();
                }
                if (device.getDeviceName() != null) {
                    writer.write("设备名称: " + device.getDeviceName());
                    writer.newLine();
                }
                writer.write("响应时间: " + device.getResponseTime() + "ms");
                writer.newLine();
                if (!device.getOpenPorts().isEmpty()) {
                    writer.write("开放端口: " + device.getOpenPorts());
                    writer.newLine();
                }
                writer.newLine();
            }

            writer.write("========================================");
            writer.newLine();
            writer.write("报告结束");
            writer.newLine();
            writer.write("========================================");
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean exportToCsv(List<DeviceInfo> devices, String filePath) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath))) {
            writer.write("序号,IP地址,MAC地址,设备名称,在线状态,响应时间(ms),开放端口");
            writer.newLine();

            for (int i = 0; i < devices.size(); i++) {
                DeviceInfo device = devices.get(i);
                StringBuilder sb = new StringBuilder();
                sb.append(i + 1).append(",");
                sb.append(device.getIpAddress()).append(",");
                sb.append(device.getMacAddress() != null ? device.getMacAddress() : "").append(",");
                sb.append(device.getDeviceName() != null ? escapeCsv(device.getDeviceName()) : "").append(",");
                sb.append(device.isOnline() ? "在线" : "离线").append(",");
                sb.append(device.getResponseTime()).append(",");
                sb.append("\"").append(device.getOpenPorts().toString().replace("[", "").replace("]", "")).append("\"");
                writer.write(sb.toString());
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    private static String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    public static String generateDefaultFileName(String format) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss");
        return "scan_result_" + sdf.format(new Date()) + "." + format;
    }
}
