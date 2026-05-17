package com.systemmonitor;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

public class ProcessMonitorPanel extends JPanel {
    private final SystemInfoCollector collector;
    private JTable processTable;
    private DefaultTableModel tableModel;
    private JTextField searchField;
    private Timer refreshTimer;
    private JLabel refreshStatusLabel;
    private JLabel processCountLabel;
    private JCheckBox autoRefreshCheck;

    public ProcessMonitorPanel(SystemInfoCollector collector) {
        this.collector = collector;
        initUI();
        startAutoRefresh();
    }

    private void initUI() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JPanel topPanel = new JPanel(new BorderLayout(10, 0));

        JPanel searchPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        searchPanel.add(new JLabel("搜索进程:"));
        searchField = new JTextField(20);
        searchField.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        searchField.addActionListener(e -> filterProcesses());
        searchPanel.add(searchField);

        JButton searchBtn = new JButton("搜索");
        searchBtn.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        searchBtn.addActionListener(e -> filterProcesses());
        searchPanel.add(searchBtn);

        JButton refreshBtn = new JButton("刷新");
        refreshBtn.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        refreshBtn.addActionListener(e -> refreshProcessList());
        searchPanel.add(refreshBtn);

        topPanel.add(searchPanel, BorderLayout.WEST);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 5));
        
        autoRefreshCheck = new JCheckBox("自动刷新 (每3秒)", true);
        autoRefreshCheck.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        autoRefreshCheck.addActionListener(e -> toggleAutoRefresh());
        buttonPanel.add(autoRefreshCheck);

        JButton killBtn = new JButton("结束进程");
        killBtn.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        killBtn.setBackground(new Color(217, 83, 79));
        killBtn.setForeground(Color.WHITE);
        killBtn.addActionListener(e -> killSelectedProcess());
        buttonPanel.add(killBtn);

        topPanel.add(buttonPanel, BorderLayout.EAST);

        add(topPanel, BorderLayout.NORTH);

        String[] columns = {"PID", "进程名", "CPU使用率(%)", "内存占用", "启动时间"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        processTable = new JTable(tableModel);
        processTable.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        processTable.getTableHeader().setFont(new Font("微软雅黑", Font.BOLD, 12));
        processTable.setRowHeight(22);
        processTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        processTable.setAutoCreateRowSorter(true);

        JScrollPane scrollPane = new JScrollPane(processTable);
        add(scrollPane, BorderLayout.CENTER);

        JPanel statusPanel = new JPanel(new BorderLayout(10, 0));
        statusPanel.setBorder(BorderFactory.createEtchedBorder());

        processCountLabel = new JLabel(" 进程数: 0");
        processCountLabel.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        statusPanel.add(processCountLabel, BorderLayout.WEST);

        refreshStatusLabel = new JLabel("上次刷新: -- ", JLabel.RIGHT);
        refreshStatusLabel.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        statusPanel.add(refreshStatusLabel, BorderLayout.EAST);

        add(statusPanel, BorderLayout.SOUTH);
    }

    private void startAutoRefresh() {
        refreshTimer = new Timer(3000, e -> refreshProcessList());
        refreshTimer.start();
        refreshProcessList();
    }

    private void toggleAutoRefresh() {
        if (autoRefreshCheck.isSelected()) {
            refreshTimer.start();
            refreshProcessList();
        } else {
            refreshTimer.stop();
            refreshStatusLabel.setText("自动刷新已暂停 | 上次刷新: " + refreshStatusLabel.getText().split("上次刷新: ")[1]);
        }
    }

    private void refreshProcessList() {
        SwingUtilities.invokeLater(() -> {
            String searchText = searchField.getText().trim().toLowerCase();
            int selectedRow = processTable.getSelectedRow();
            int selectedPid = -1;
            
            if (selectedRow != -1) {
                selectedPid = (int) tableModel.getValueAt(selectedRow, 0);
            }
            
            tableModel.setRowCount(0);

            List<SystemInfoCollector.ProcessInfo> processes = collector.getAllProcesses();
            int displayedCount = 0;
            
            for (SystemInfoCollector.ProcessInfo process : processes) {
                if (searchText.isEmpty() || 
                    process.getName().toLowerCase().contains(searchText) ||
                    String.valueOf(process.getPid()).contains(searchText)) {
                    
                    Object[] row = {
                            process.getPid(),
                            process.getName(),
                            String.format("%.1f", process.getCpuUsage()),
                            SystemInfoCollector.formatBytes(process.getMemory()),
                            formatStartTime(process.getStartTime())
                    };
                    tableModel.addRow(row);
                    displayedCount++;
                }
            }

            processCountLabel.setText(" 进程数: " + displayedCount);

            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm:ss");
            refreshStatusLabel.setText("上次刷新: " + sdf.format(new Date()) + " ");

            if (selectedPid != -1) {
                for (int i = 0; i < tableModel.getRowCount(); i++) {
                    if ((int) tableModel.getValueAt(i, 0) == selectedPid) {
                        processTable.setRowSelectionInterval(i, i);
                        break;
                    }
                }
            }
        });
    }

    private void filterProcesses() {
        refreshProcessList();
    }

    private String formatStartTime(long startTime) {
        if (startTime <= 0) return "N/A";
        long elapsed = System.currentTimeMillis() - startTime;
        long seconds = elapsed / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        if (days > 0) return days + "天前";
        if (hours > 0) return hours + "小时前";
        if (minutes > 0) return minutes + "分钟前";
        return seconds + "秒前";
    }

    private void killSelectedProcess() {
        int selectedRow = processTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, 
                    "请先选择一个进程", 
                    "提示", 
                    JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        int pid = (int) tableModel.getValueAt(selectedRow, 0);
        String processName = (String) tableModel.getValueAt(selectedRow, 1);

        int confirm = JOptionPane.showConfirmDialog(this,
                String.format("确定要结束进程 %s (PID: %d) 吗？", processName, pid),
                "确认结束进程",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.WARNING_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            boolean success = collector.killProcess(pid);
            if (success) {
                JOptionPane.showMessageDialog(this,
                        "进程已成功结束",
                        "成功",
                        JOptionPane.INFORMATION_MESSAGE);
                refreshProcessList();
            } else {
                JOptionPane.showMessageDialog(this,
                        "结束进程失败，可能需要管理员权限",
                        "错误",
                        JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
