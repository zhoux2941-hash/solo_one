package com.cloudsync.ui;

import com.cloudsync.entity.SyncStats;
import com.cloudsync.sync.SyncEngine;
import com.cloudsync.util.FileUtils;

import javax.swing.*;
import java.awt.*;
import java.text.SimpleDateFormat;
import java.util.Date;

public class SyncProgressPanel extends JPanel {
    private final JLabel uploadCountLabel;
    private final JLabel downloadCountLabel;
    private final JLabel deleteCountLabel;
    private final JLabel speedLabel;
    private final JLabel dataLabel;
    private final JLabel lastSyncLabel;
    private final JProgressBar totalProgress;
    private final Timer updateTimer;
    private final SyncEngine syncEngine;

    public SyncProgressPanel() {
        syncEngine = SyncEngine.getInstance();

        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createTitledBorder("同步统计"));

        JPanel statsPanel = new JPanel(new GridLayout(2, 4, 10, 5));

        uploadCountLabel = createStatLabel("上传文件", "0");
        downloadCountLabel = createStatLabel("下载文件", "0");
        deleteCountLabel = createStatLabel("删除文件", "0");
        speedLabel = createStatLabel("传输速度", "0 B/s");
        dataLabel = createStatLabel("已传输", "0 B");
        lastSyncLabel = createStatLabel("上次同步", "从未");

        statsPanel.add(uploadCountLabel);
        statsPanel.add(downloadCountLabel);
        statsPanel.add(deleteCountLabel);
        statsPanel.add(speedLabel);
        statsPanel.add(dataLabel);
        statsPanel.add(lastSyncLabel);

        add(statsPanel, BorderLayout.NORTH);

        JPanel progressPanel = new JPanel(new BorderLayout(5, 5));
        progressPanel.add(new JLabel("总体进度:"), BorderLayout.WEST);
        totalProgress = new JProgressBar(0, 100);
        totalProgress.setStringPainted(true);
        progressPanel.add(totalProgress, BorderLayout.CENTER);

        add(progressPanel, BorderLayout.CENTER);

        updateTimer = new Timer(1000, e -> updateStats());
        updateTimer.start();
    }

    private JLabel createStatLabel(String title, String value) {
        JLabel label = new JLabel(title + ": " + value);
        label.setFont(label.getFont().deriveFont(12f));
        return label;
    }

    private void updateStats() {
        SyncStats stats = syncEngine.getStats();

        SwingUtilities.invokeLater(() -> {
            uploadCountLabel.setText("上传文件: " + stats.getUploadedFiles());
            downloadCountLabel.setText("下载文件: " + stats.getDownloadedFiles());
            deleteCountLabel.setText("删除文件: " + stats.getDeletedFiles());
            speedLabel.setText("传输速度: " + FileUtils.formatSpeed(stats.getSpeed()));
            dataLabel.setText("已传输: " + FileUtils.formatFileSize(stats.getTransferredBytes()));

            if (stats.getLastSyncTime() > 0) {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                lastSyncLabel.setText("上次同步: " + sdf.format(new Date(stats.getLastSyncTime())));
            }

            long total = stats.getTotalFiles();
            long completed = stats.getUploadedFiles() + stats.getDownloadedFiles() + stats.getDeletedFiles();
            if (total > 0) {
                int progress = (int) ((completed * 100) / total);
                totalProgress.setValue(progress);
            }
        });
    }

    public void stop() {
        updateTimer.stop();
    }
}
