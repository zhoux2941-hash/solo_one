package com.systemmonitor;

import javax.swing.*;
import java.awt.*;

public class SystemMonitorApp extends JFrame {
    private final SystemInfoCollector collector;
    private JTabbedPane tabbedPane;

    public SystemMonitorApp() {
        collector = new SystemInfoCollector();
        initUI();
    }

    private void initUI() {
        setTitle("系统监控");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1000, 700);
        setLocationRelativeTo(null);
        setResizable(true);

        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("微软雅黑", Font.PLAIN, 14));

        ResourceMonitorPanel resourcePanel = new ResourceMonitorPanel(collector);
        ProcessMonitorPanel processPanel = new ProcessMonitorPanel(collector);
        SystemInfoPanel infoPanel = new SystemInfoPanel(collector);

        tabbedPane.addTab("资源监控", resourcePanel);
        tabbedPane.addTab("进程管理", processPanel);
        tabbedPane.addTab("系统信息", infoPanel);

        add(tabbedPane, BorderLayout.CENTER);

        JLabel statusLabel = new JLabel(" 系统监控运行中...");
        statusLabel.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        statusLabel.setBorder(BorderFactory.createEtchedBorder());
        add(statusLabel, BorderLayout.SOUTH);
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            e.printStackTrace();
        }

        SwingUtilities.invokeLater(() -> {
            SystemMonitorApp app = new SystemMonitorApp();
            app.setVisible(true);
        });
    }
}
