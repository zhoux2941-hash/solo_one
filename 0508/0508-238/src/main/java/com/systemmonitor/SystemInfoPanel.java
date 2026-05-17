package com.systemmonitor;

import javax.swing.*;
import java.awt.*;
import java.text.SimpleDateFormat;
import java.util.Date;

public class SystemInfoPanel extends JPanel {
    private final SystemInfoCollector collector;
    private JLabel cpuUsageLabel;
    private JLabel memoryUsageLabel;
    private JLabel diskUsageLabel;
    private JLabel refreshTimeLabel;
    private Timer refreshTimer;
    private JPanel dynamicInfoPanel;

    public SystemInfoPanel(SystemInfoCollector collector) {
        this.collector = collector;
        initUI();
        startAutoRefresh();
    }

    private void initUI() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        JLabel titleLabel = new JLabel("系统信息");
        titleLabel.setFont(new Font("微软雅黑", Font.BOLD, 24));
        titleLabel.setHorizontalAlignment(SwingConstants.CENTER);
        add(titleLabel, BorderLayout.NORTH);

        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));

        JPanel staticInfoPanel = createStaticInfoPanel();
        dynamicInfoPanel = createDynamicInfoPanel();

        mainPanel.add(staticInfoPanel, BorderLayout.NORTH);
        mainPanel.add(dynamicInfoPanel, BorderLayout.CENTER);

        add(mainPanel, BorderLayout.CENTER);

        JPanel controlPanel = createControlPanel();
        add(controlPanel, BorderLayout.SOUTH);
    }

    private JPanel createStaticInfoPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBorder(BorderFactory.createTitledBorder(
                BorderFactory.createEtchedBorder(), "硬件与软件信息"));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 15, 8, 15);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 0.3;
        addInfoRow(panel, gbc, "操作系统:", collector.getOsVersion());

        gbc.gridy++;
        addInfoRow(panel, gbc, "CPU型号:", collector.getCpuModel());

        gbc.gridy++;
        addInfoRow(panel, gbc, "CPU核心数:", collector.getCpuCoreCount() + " 核");

        gbc.gridy++;
        addInfoRow(panel, gbc, "总内存:", SystemInfoCollector.formatBytes(collector.getTotalMemory()));

        gbc.gridy++;
        addInfoRow(panel, gbc, "总磁盘容量:", SystemInfoCollector.formatBytes(collector.getTotalDiskSpace()));

        gbc.gridy++;
        addInfoRow(panel, gbc, "Java版本:", System.getProperty("java.version"));

        gbc.gridy++;
        addInfoRow(panel, gbc, "Java虚拟机:", System.getProperty("java.vm.name"));

        gbc.gridy++;
        addInfoRow(panel, gbc, "系统架构:", System.getProperty("os.arch"));

        gbc.gridy++;
        addInfoRow(panel, gbc, "用户名:", System.getProperty("user.name"));

        gbc.gridy++;
        addInfoRow(panel, gbc, "工作目录:", System.getProperty("user.dir"));

        return panel;
    }

    private JPanel createDynamicInfoPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBorder(BorderFactory.createTitledBorder(
                BorderFactory.createEtchedBorder(), "实时资源状态"));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 15, 10, 15);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 0.3;

        gbc.gridy++;
        addInfoRow(panel, gbc, "CPU使用率:", "计算中...");
        cpuUsageLabel = (JLabel) ((JPanel) panel.getComponent(panel.getComponentCount() - 1)).getComponent(1);
        cpuUsageLabel.setForeground(new Color(217, 83, 79));

        gbc.gridy++;
        addInfoRow(panel, gbc, "内存使用率:", "计算中...");
        memoryUsageLabel = (JLabel) ((JPanel) panel.getComponent(panel.getComponentCount() - 1)).getComponent(1);
        memoryUsageLabel.setForeground(new Color(92, 184, 92));

        gbc.gridy++;
        addInfoRow(panel, gbc, "磁盘使用率:", "计算中...");
        diskUsageLabel = (JLabel) ((JPanel) panel.getComponent(panel.getComponentCount() - 1)).getComponent(1);
        diskUsageLabel.setForeground(new Color(240, 173, 78));

        gbc.gridy++;
        addInfoRow(panel, gbc, "上次刷新:", "--");
        refreshTimeLabel = (JLabel) ((JPanel) panel.getComponent(panel.getComponentCount() - 1)).getComponent(1);

        return panel;
    }

    private JPanel createControlPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));

        JButton refreshBtn = new JButton("立即刷新");
        refreshBtn.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        refreshBtn.addActionListener(e -> refreshInfo());

        JCheckBox autoRefreshCheck = new JCheckBox("自动刷新 (每5秒)", true);
        autoRefreshCheck.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        autoRefreshCheck.addActionListener(e -> {
            if (autoRefreshCheck.isSelected()) {
                refreshTimer.start();
            } else {
                refreshTimer.stop();
            }
        });

        panel.add(refreshBtn);
        panel.add(autoRefreshCheck);

        return panel;
    }

    private void addInfoRow(JPanel panel, GridBagConstraints gbc, String label, String value) {
        JPanel rowPanel = new JPanel(new GridBagLayout());
        rowPanel.setOpaque(false);

        GridBagConstraints rowGbc = new GridBagConstraints();
        rowGbc.insets = new Insets(0, 0, 0, 10);
        rowGbc.anchor = GridBagConstraints.WEST;

        rowGbc.gridx = 0;
        rowGbc.weightx = 0.3;
        JLabel lbl = new JLabel(label);
        lbl.setFont(new Font("微软雅黑", Font.BOLD, 14));
        lbl.setForeground(new Color(51, 51, 51));
        rowPanel.add(lbl, rowGbc);

        rowGbc.gridx = 1;
        rowGbc.weightx = 0.7;
        JLabel val = new JLabel(value);
        val.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        val.setForeground(new Color(102, 102, 102));
        rowPanel.add(val, rowGbc);

        gbc.gridwidth = 2;
        panel.add(rowPanel, gbc);
        gbc.gridwidth = 1;
    }

    private void startAutoRefresh() {
        refreshTimer = new Timer(5000, e -> refreshInfo());
        refreshTimer.start();
        refreshInfo();
    }

    private void refreshInfo() {
        SwingUtilities.invokeLater(() -> {
            double cpuUsage = collector.getCpuUsage();
            double memoryUsage = collector.getMemoryUsage();
            double diskUsage = collector.getDiskUsage();

            cpuUsageLabel.setText(String.format("%.1f%%", cpuUsage));
            memoryUsageLabel.setText(String.format("%.1f%%", memoryUsage));
            diskUsageLabel.setText(String.format("%.1f%%", diskUsage));

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            refreshTimeLabel.setText(sdf.format(new Date()));

            updateLabelColor(cpuUsageLabel, cpuUsage);
            updateLabelColor(memoryUsageLabel, memoryUsage);
            updateLabelColor(diskUsageLabel, diskUsage);
        });
    }

    private void updateLabelColor(JLabel label, double value) {
        if (value >= 80) {
            label.setForeground(new Color(217, 83, 79));
        } else if (value >= 50) {
            label.setForeground(new Color(240, 173, 78));
        } else {
            label.setForeground(new Color(92, 184, 92));
        }
    }
}
