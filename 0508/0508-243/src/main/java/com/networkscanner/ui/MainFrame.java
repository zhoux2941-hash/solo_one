package com.networkscanner.ui;

import com.networkscanner.exporter.ResultExporter;
import com.networkscanner.model.DeviceInfo;
import com.networkscanner.scanner.NetworkScanner;
import com.networkscanner.scanner.ScanListener;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class MainFrame extends JFrame implements ScanListener {
    private NetworkScanner scanner;
    private List<DeviceInfo> scanResults;
    private SwingWorker<Void, DeviceInfo> scanWorker;

    private JTextField networkField;
    private JComboBox<String> presetCombo;
    private JButton scanButton;
    private JButton stopButton;
    private JButton exportButton;
    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JTable deviceTable;
    private DefaultTableModel tableModel;

    public MainFrame() {
        scanner = new NetworkScanner();
        scanner.addScanListener(this);
        scanResults = new ArrayList<>();

        initUI();
        setupLayout();
    }

    private void initUI() {
        setTitle("局域网设备探测工具");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 600);
        setLocationRelativeTo(null);
        setMinimumSize(new Dimension(700, 500));

        ImageIcon icon = new ImageIcon();
        setIconImage(icon.getImage());
    }

    private void setupLayout() {
        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(new EmptyBorder(10, 10, 10, 10));

        mainPanel.add(createTopPanel(), BorderLayout.NORTH);
        mainPanel.add(createCenterPanel(), BorderLayout.CENTER);
        mainPanel.add(createBottomPanel(), BorderLayout.SOUTH);

        add(mainPanel);
    }

    private JPanel createTopPanel() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBorder(new TitledBorder("网段设置"));

        JPanel inputPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 5));

        inputPanel.add(new JLabel("预设网段:"));
        presetCombo = new JComboBox<>(new String[]{
                "自定义",
                "192.168.1.1-255",
                "192.168.0.1-255",
                "10.0.0.1-255",
                "172.16.0.1-255"
        });
        presetCombo.addActionListener(e -> {
            String selected = (String) presetCombo.getSelectedItem();
            if (!"自定义".equals(selected)) {
                networkField.setText(selected);
            }
        });
        inputPanel.add(presetCombo);

        inputPanel.add(Box.createHorizontalStrut(20));
        inputPanel.add(new JLabel("网段地址:"));
        networkField = new JTextField("192.168.1.1-255", 20);
        networkField.setToolTipText("支持格式: 192.168.1.1-255 或 192.168.1.0/24");
        inputPanel.add(networkField);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 5));

        scanButton = new JButton("开始扫描");
        scanButton.setFont(scanButton.getFont().deriveFont(Font.BOLD));
        scanButton.addActionListener(e -> startScan());
        buttonPanel.add(scanButton);

        stopButton = new JButton("停止扫描");
        stopButton.setEnabled(false);
        stopButton.addActionListener(e -> stopScan());
        buttonPanel.add(stopButton);

        exportButton = new JButton("导出结果");
        exportButton.setEnabled(false);
        exportButton.addActionListener(e -> exportResults());
        buttonPanel.add(exportButton);

        panel.add(inputPanel, BorderLayout.WEST);
        panel.add(buttonPanel, BorderLayout.EAST);

        return panel;
    }

    private JPanel createCenterPanel() {
        JPanel panel = new JPanel(new BorderLayout(5, 5));
        panel.setBorder(new TitledBorder("扫描结果"));

        String[] columnNames = {"#", "IP地址", "MAC地址", "设备名称", "响应时间", "开放端口"};
        tableModel = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        deviceTable = new JTable(tableModel);
        deviceTable.setRowHeight(25);
        deviceTable.getColumnModel().getColumn(0).setPreferredWidth(40);
        deviceTable.getColumnModel().getColumn(1).setPreferredWidth(120);
        deviceTable.getColumnModel().getColumn(2).setPreferredWidth(140);
        deviceTable.getColumnModel().getColumn(3).setPreferredWidth(150);
        deviceTable.getColumnModel().getColumn(4).setPreferredWidth(80);
        deviceTable.getColumnModel().getColumn(5).setPreferredWidth(200);

        JScrollPane scrollPane = new JScrollPane(deviceTable);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);

        panel.add(scrollPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createBottomPanel() {
        JPanel panel = new JPanel(new BorderLayout(5, 5));

        progressBar = new JProgressBar();
        progressBar.setStringPainted(true);
        progressBar.setString("就绪");

        statusLabel = new JLabel("就绪", JLabel.LEFT);

        panel.add(progressBar, BorderLayout.CENTER);
        panel.add(statusLabel, BorderLayout.SOUTH);

        return panel;
    }

    private void startScan() {
        String networkRange = networkField.getText().trim();
        if (networkRange.isEmpty()) {
            JOptionPane.showMessageDialog(this, "请输入网段地址", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }

        scanResults.clear();
        tableModel.setRowCount(0);
        exportButton.setEnabled(false);

        scanButton.setEnabled(false);
        stopButton.setEnabled(true);
        networkField.setEnabled(false);
        presetCombo.setEnabled(false);

        scanner.scanNetwork(networkRange);
    }

    private void stopScan() {
        scanner.stopScan();
    }

    private void exportResults() {
        if (scanResults.isEmpty()) {
            JOptionPane.showMessageDialog(this, "没有可导出的数据", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }

        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("导出扫描结果");
        fileChooser.setSelectedFile(new File(ResultExporter.generateDefaultFileName("txt")));

        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileFilter() {
            @Override
            public boolean accept(File f) {
                return f.isDirectory() || f.getName().toLowerCase().endsWith(".txt");
            }

            @Override
            public String getDescription() {
                return "文本文件 (*.txt)";
            }
        });

        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileFilter() {
            @Override
            public boolean accept(File f) {
                return f.isDirectory() || f.getName().toLowerCase().endsWith(".csv");
            }

            @Override
            public String getDescription() {
                return "CSV文件 (*.csv)";
            }
        });

        int result = fileChooser.showSaveDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File selectedFile = fileChooser.getSelectedFile();
            String filePath = selectedFile.getAbsolutePath();
            boolean success = false;

            if (filePath.toLowerCase().endsWith(".csv")) {
                success = ResultExporter.exportToCsv(scanResults, filePath);
            } else {
                if (!filePath.toLowerCase().endsWith(".txt")) {
                    filePath += ".txt";
                }
                success = ResultExporter.exportToTxt(scanResults, filePath);
            }

            if (success) {
                JOptionPane.showMessageDialog(this, "导出成功!\n文件: " + filePath, "成功", JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this, "导出失败，请重试", "错误", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    @Override
    public void onScanStart(int totalDevices) {
        SwingUtilities.invokeLater(() -> {
            progressBar.setMaximum(totalDevices);
            progressBar.setValue(0);
            progressBar.setString("扫描中... 0/" + totalDevices);
            statusLabel.setText("开始扫描，共 " + totalDevices + " 个IP地址");
        });
    }

    @Override
    public void onDeviceFound(DeviceInfo deviceInfo) {
        SwingUtilities.invokeLater(() -> {
            scanResults.add(deviceInfo);
            updateTable();
        });
    }

    @Override
    public void onDeviceUpdate(DeviceInfo deviceInfo) {
    }

    @Override
    public void onScanProgress(int current, int total) {
        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(current);
            progressBar.setString("扫描中... " + current + "/" + total);
            statusLabel.setText("正在扫描... 已发现 " + scanResults.size() + " 台设备");
        });
    }

    @Override
    public void onScanComplete(List<DeviceInfo> devices) {
        SwingUtilities.invokeLater(() -> {
            scanResults = devices;
            updateTable();
            progressBar.setValue(progressBar.getMaximum());
            progressBar.setString("完成");
            statusLabel.setText("扫描完成！共发现 " + devices.size() + " 台在线设备");

            scanButton.setEnabled(true);
            stopButton.setEnabled(false);
            networkField.setEnabled(true);
            presetCombo.setEnabled(true);
            exportButton.setEnabled(true);

            if (devices.isEmpty()) {
                JOptionPane.showMessageDialog(this, "未发现在线设备，请检查网段设置", "提示", JOptionPane.INFORMATION_MESSAGE);
            }
        });
    }

    @Override
    public void onScanStopped(List<DeviceInfo> devices) {
        SwingUtilities.invokeLater(() -> {
            scanResults = devices;
            updateTable();
            progressBar.setString("已停止");
            statusLabel.setText("扫描已停止！共发现 " + devices.size() + " 台在线设备");

            scanButton.setEnabled(true);
            stopButton.setEnabled(false);
            networkField.setEnabled(true);
            presetCombo.setEnabled(true);
            exportButton.setEnabled(!devices.isEmpty());
        });
    }

    @Override
    public void onScanError(String error) {
        SwingUtilities.invokeLater(() -> {
            statusLabel.setText("错误: " + error);
            scanButton.setEnabled(true);
            stopButton.setEnabled(false);
            networkField.setEnabled(true);
            presetCombo.setEnabled(true);
            JOptionPane.showMessageDialog(this, error, "错误", JOptionPane.ERROR_MESSAGE);
        });
    }

    private void updateTable() {
        tableModel.setRowCount(0);
        for (int i = 0; i < scanResults.size(); i++) {
            DeviceInfo device = scanResults.get(i);
            Object[] row = {
                i + 1,
                device.getIpAddress(),
                device.getMacAddress() != null ? device.getMacAddress() : "未知",
                device.getDeviceName() != null ? device.getDeviceName() : "未知",
                device.getResponseTime() + "ms",
                device.getOpenPorts().isEmpty() ? "无" : device.getOpenPorts().toString()
            };
            tableModel.addRow(row);
        }
    }
}
