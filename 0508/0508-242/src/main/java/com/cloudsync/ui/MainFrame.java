package com.cloudsync.ui;

import com.cloudsync.entity.SyncTask;
import com.cloudsync.sync.SyncEngine;
import com.cloudsync.util.ConfigManager;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

public class MainFrame extends JFrame {
    private final SyncEngine syncEngine;
    private SyncQueuePanel queuePanel;
    private SyncProgressPanel progressPanel;
    private JButton startButton;
    private JButton pauseButton;
    private JButton stopButton;
    private JLabel statusLabel;

    public MainFrame() {
        syncEngine = SyncEngine.getInstance();

        setTitle("云盘同步客户端");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 650);
        setLocationRelativeTo(null);

        initUI();
        setupSyncListener();

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                if (syncEngine.isRunning()) {
                    syncEngine.stop();
                }
                progressPanel.stop();
            }
        });

        if (ConfigManager.getInstance().getConfig().isAutoStart()) {
            SwingUtilities.invokeLater(this::startSync);
        }
    }

    private void initUI() {
        JTabbedPane tabbedPane = new JTabbedPane();

        JPanel syncPanel = new JPanel(new BorderLayout(5, 5));
        syncPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JPanel controlPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 5));
        startButton = new JButton("开始同步");
        startButton.addActionListener(e -> startSync());
        pauseButton = new JButton("暂停");
        pauseButton.setEnabled(false);
        pauseButton.addActionListener(e -> togglePause());
        stopButton = new JButton("停止");
        stopButton.setEnabled(false);
        stopButton.addActionListener(e -> stopSync());
        JButton clearButton = new JButton("清除完成");
        clearButton.addActionListener(e -> queuePanel.clearCompleted());

        controlPanel.add(startButton);
        controlPanel.add(pauseButton);
        controlPanel.add(stopButton);
        controlPanel.add(clearButton);

        progressPanel = new SyncProgressPanel();
        queuePanel = new SyncQueuePanel();

        JPanel centerPanel = new JPanel(new BorderLayout(5, 5));
        centerPanel.add(progressPanel, BorderLayout.NORTH);
        centerPanel.add(queuePanel, BorderLayout.CENTER);

        syncPanel.add(controlPanel, BorderLayout.NORTH);
        syncPanel.add(centerPanel, BorderLayout.CENTER);

        tabbedPane.addTab("同步管理", syncPanel);
        tabbedPane.addTab("配置", new ConfigPanel());

        add(tabbedPane, BorderLayout.CENTER);

        JPanel statusPanel = new JPanel(new BorderLayout());
        statusPanel.setBorder(BorderFactory.createEtchedBorder());
        statusLabel = new JLabel("  就绪");
        statusPanel.add(statusLabel, BorderLayout.WEST);
        add(statusPanel, BorderLayout.SOUTH);
    }

    private void setupSyncListener() {
        syncEngine.setSyncListener(new SyncEngine.SyncListener() {
            @Override
            public void onTaskStarted(SyncTask task) {
                queuePanel.addTask(task);
                updateStatus("正在同步: " + task.getFilePath());
            }

            @Override
            public void onTaskProgress(SyncTask task) {
                queuePanel.updateTask(task);
            }

            @Override
            public void onTaskCompleted(SyncTask task) {
                queuePanel.updateTask(task);
            }

            @Override
            public void onSyncStarted() {
                updateStatus("同步中...");
            }

            @Override
            public void onSyncCompleted() {
                updateStatus("同步完成");
            }

            @Override
            public void onError(String message) {
                updateStatus("错误: " + message);
                JOptionPane.showMessageDialog(MainFrame.this, message, "错误", JOptionPane.ERROR_MESSAGE);
            }
        });
    }

    private void startSync() {
        if (!ConfigManager.getInstance().getConfig().isValid()) {
            JOptionPane.showMessageDialog(this, "请先配置服务地址和本地同步目录！", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }
        syncEngine.start();
        startButton.setEnabled(false);
        pauseButton.setEnabled(true);
        stopButton.setEnabled(true);
        pauseButton.setText("暂停");
        updateStatus("同步已启动");
    }

    private void togglePause() {
        if (syncEngine.isPaused()) {
            syncEngine.resume();
            pauseButton.setText("暂停");
            updateStatus("同步继续");
        } else {
            syncEngine.pause();
            pauseButton.setText("继续");
            updateStatus("同步已暂停");
        }
    }

    private void stopSync() {
        syncEngine.stop();
        startButton.setEnabled(true);
        pauseButton.setEnabled(false);
        stopButton.setEnabled(false);
        updateStatus("同步已停止");
    }

    private void updateStatus(String status) {
        SwingUtilities.invokeLater(() -> statusLabel.setText("  " + status));
    }
}
