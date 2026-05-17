package com.cloudsync.ui;

import com.cloudsync.entity.SyncTask;
import com.cloudsync.util.FileUtils;

import javax.swing.*;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

public class SyncQueuePanel extends JPanel {
    private final JTable taskTable;
    private final DefaultTableModel tableModel;
    private final JLabel statusLabel;

    public SyncQueuePanel() {
        setLayout(new BorderLayout(5, 5));
        setBorder(BorderFactory.createTitledBorder("同步队列"));

        String[] columns = {"文件路径", "同步类型", "进度", "状态", "文件大小"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        taskTable = new JTable(tableModel);
        taskTable.getColumnModel().getColumn(0).setPreferredWidth(300);
        taskTable.getColumnModel().getColumn(1).setPreferredWidth(100);
        taskTable.getColumnModel().getColumn(2).setPreferredWidth(150);
        taskTable.getColumnModel().getColumn(3).setPreferredWidth(100);
        taskTable.getColumnModel().getColumn(4).setPreferredWidth(100);

        taskTable.getColumnModel().getColumn(2).setCellRenderer(new ProgressRenderer());

        JScrollPane scrollPane = new JScrollPane(taskTable);
        add(scrollPane, BorderLayout.CENTER);

        JPanel statusPanel = new JPanel(new BorderLayout());
        statusLabel = new JLabel("等待同步...");
        statusPanel.add(statusLabel, BorderLayout.WEST);
        add(statusPanel, BorderLayout.SOUTH);
    }

    public void addTask(SyncTask task) {
        SwingUtilities.invokeLater(() -> {
            Object[] row = {
                    task.getFilePath(),
                    task.getSyncTypeName(),
                    task.getProgress(),
                    task.getStatus(),
                    FileUtils.formatFileSize(task.getFileSize())
            };
            tableModel.addRow(row);
        });
    }

    public void updateTask(SyncTask task) {
        SwingUtilities.invokeLater(() -> {
            for (int i = 0; i < tableModel.getRowCount(); i++) {
                if (tableModel.getValueAt(i, 0).equals(task.getFilePath())) {
                    tableModel.setValueAt(task.getProgress(), i, 2);
                    tableModel.setValueAt(task.getStatus(), i, 3);
                    break;
                }
            }
        });
    }

    public void removeTask(SyncTask task) {
        SwingUtilities.invokeLater(() -> {
            for (int i = 0; i < tableModel.getRowCount(); i++) {
                if (tableModel.getValueAt(i, 0).equals(task.getFilePath())) {
                    tableModel.removeRow(i);
                    break;
                }
            }
        });
    }

    public void clearCompleted() {
        SwingUtilities.invokeLater(() -> {
            for (int i = tableModel.getRowCount() - 1; i >= 0; i--) {
                String status = (String) tableModel.getValueAt(i, 3);
                if ("完成".equals(status) || status.startsWith("失败")) {
                    tableModel.removeRow(i);
                }
            }
        });
    }

    public void setStatus(String status) {
        SwingUtilities.invokeLater(() -> statusLabel.setText(status));
    }

    private static class ProgressRenderer extends DefaultTableCellRenderer {
        private final JProgressBar progressBar;

        public ProgressRenderer() {
            progressBar = new JProgressBar(0, 100);
            progressBar.setStringPainted(true);
        }

        @Override
        public Component getTableCellRendererComponent(JTable table, Object value,
                                                       boolean isSelected, boolean hasFocus,
                                                       int row, int column) {
            if (value instanceof Integer) {
                progressBar.setValue((Integer) value);
            }
            return progressBar;
        }
    }
}
