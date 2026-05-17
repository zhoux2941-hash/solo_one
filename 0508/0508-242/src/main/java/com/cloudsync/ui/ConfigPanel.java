package com.cloudsync.ui;

import com.cloudsync.entity.SyncConfig;
import com.cloudsync.network.CloudApiClient;
import com.cloudsync.util.ConfigManager;

import javax.swing.*;
import java.awt.*;
import java.io.File;

public class ConfigPanel extends JPanel {
    private final JTextField serverUrlField;
    private final JTextField usernameField;
    private final JPasswordField passwordField;
    private final JTextField localDirField;
    private final JTextField remoteDirField;
    private final JTextField intervalField;
    private final JCheckBox autoStartCheck;
    private final JButton testButton;
    private final JButton saveButton;

    public ConfigPanel() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createTitledBorder("账号与同步配置"));

        JPanel formPanel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.anchor = GridBagConstraints.WEST;

        int row = 0;

        gbc.gridx = 0;
        gbc.gridy = row;
        formPanel.add(new JLabel("网盘服务地址:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        serverUrlField = new JTextField(30);
        formPanel.add(serverUrlField, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("用户名:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        usernameField = new JTextField(20);
        formPanel.add(usernameField, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("密码:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        passwordField = new JPasswordField(20);
        formPanel.add(passwordField, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("本地同步目录:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        JPanel localDirPanel = new JPanel(new BorderLayout(5, 0));
        localDirField = new JTextField(25);
        JButton browseButton = new JButton("浏览...");
        browseButton.addActionListener(e -> browseLocalDir());
        localDirPanel.add(localDirField, BorderLayout.CENTER);
        localDirPanel.add(browseButton, BorderLayout.EAST);
        formPanel.add(localDirPanel, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("云端同步目录:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        remoteDirField = new JTextField(20);
        formPanel.add(remoteDirField, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("同步间隔(毫秒):"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        intervalField = new JTextField("30000", 10);
        formPanel.add(intervalField, gbc);
        row++;

        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.fill = GridBagConstraints.NONE;
        gbc.weightx = 0;
        formPanel.add(new JLabel("自动启动:"), gbc);
        gbc.gridx = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        autoStartCheck = new JCheckBox();
        formPanel.add(autoStartCheck, gbc);
        row++;

        add(formPanel, BorderLayout.CENTER);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));
        testButton = new JButton("测试连接");
        testButton.addActionListener(e -> testConnection());
        saveButton = new JButton("保存配置");
        saveButton.addActionListener(e -> saveConfig());
        buttonPanel.add(testButton);
        buttonPanel.add(saveButton);
        add(buttonPanel, BorderLayout.SOUTH);

        loadConfig();
    }

    private void browseLocalDir() {
        JFileChooser chooser = new JFileChooser();
        chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            localDirField.setText(chooser.getSelectedFile().getAbsolutePath());
        }
    }

    private void testConnection() {
        saveConfigToObject();
        boolean success = CloudApiClient.getInstance().testConnection();
        if (success) {
            JOptionPane.showMessageDialog(this, "连接成功！", "测试结果", JOptionPane.INFORMATION_MESSAGE);
        } else {
            JOptionPane.showMessageDialog(this, "连接失败，请检查配置！", "测试结果", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void saveConfig() {
        saveConfigToObject();
        ConfigManager.getInstance().saveConfig();
        JOptionPane.showMessageDialog(this, "配置已保存！", "提示", JOptionPane.INFORMATION_MESSAGE);
    }

    private void saveConfigToObject() {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        config.setServerUrl(serverUrlField.getText());
        config.setUsername(usernameField.getText());
        config.setPassword(new String(passwordField.getPassword()));
        config.setLocalSyncDir(localDirField.getText());
        config.setRemoteSyncDir(remoteDirField.getText());
        try {
            config.setSyncInterval(Long.parseLong(intervalField.getText()));
        } catch (NumberFormatException e) {
            config.setSyncInterval(30000);
        }
        config.setAutoStart(autoStartCheck.isSelected());
    }

    private void loadConfig() {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        serverUrlField.setText(config.getServerUrl());
        usernameField.setText(config.getUsername());
        passwordField.setText(config.getPassword());
        localDirField.setText(config.getLocalSyncDir());
        remoteDirField.setText(config.getRemoteSyncDir());
        intervalField.setText(String.valueOf(config.getSyncInterval()));
        autoStartCheck.setSelected(config.isAutoStart());
    }
}
