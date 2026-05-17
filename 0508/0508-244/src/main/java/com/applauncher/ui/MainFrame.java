package com.applauncher.ui;

import com.applauncher.model.AppGroup;
import com.applauncher.model.Application;
import com.applauncher.model.Configuration;
import com.applauncher.service.AppLauncherService;
import com.applauncher.service.ConfigManager;

import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.io.File;
import java.util.List;

public class MainFrame extends JFrame {
    private JTabbedPane tabbedPane;
    private ConfigManager configManager;
    private AppLauncherService launcherService;

    public MainFrame() {
        this.configManager = ConfigManager.getInstance();
        this.launcherService = AppLauncherService.getInstance();
        initializeUI();
    }

    private void initializeUI() {
        setTitle("软件收纳启动器");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1000, 700);
        setLocationRelativeTo(null);

        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            e.printStackTrace();
        }

        setJMenuBar(createMenuBar());

        JPanel mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("微软雅黑", Font.PLAIN, 14));

        loadGroups();

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        
        JButton importButton = new JButton("批量导入应用");
        importButton.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        importButton.addActionListener(e -> importApplications());

        JButton addGroupButton = new JButton("新建分组");
        addGroupButton.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        addGroupButton.addActionListener(e -> addNewGroup());

        JButton refreshButton = new JButton("刷新");
        refreshButton.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        refreshButton.addActionListener(e -> refreshAll());

        buttonPanel.add(importButton);
        buttonPanel.add(addGroupButton);
        buttonPanel.add(refreshButton);

        mainPanel.add(buttonPanel, BorderLayout.NORTH);
        mainPanel.add(tabbedPane, BorderLayout.CENTER);

        add(mainPanel);
    }

    private JMenuBar createMenuBar() {
        JMenuBar menuBar = new JMenuBar();

        JMenu fileMenu = new JMenu("文件");
        fileMenu.setFont(new Font("微软雅黑", Font.PLAIN, 13));

        JMenuItem importItem = new JMenuItem("导入应用");
        importItem.addActionListener(e -> importApplications());
        fileMenu.add(importItem);

        JMenuItem importConfigItem = new JMenuItem("导入配置");
        importConfigItem.addActionListener(e -> importConfig());
        fileMenu.add(importConfigItem);

        JMenuItem exportConfigItem = new JMenuItem("导出配置");
        exportConfigItem.addActionListener(e -> exportConfig());
        fileMenu.add(exportConfigItem);

        fileMenu.addSeparator();

        JMenuItem exitItem = new JMenuItem("退出");
        exitItem.addActionListener(e -> System.exit(0));
        fileMenu.add(exitItem);

        JMenu helpMenu = new JMenu("帮助");
        helpMenu.setFont(new Font("微软雅黑", Font.PLAIN, 13));

        JMenuItem aboutItem = new JMenuItem("关于");
        aboutItem.addActionListener(e -> showAbout());
        helpMenu.add(aboutItem);

        menuBar.add(fileMenu);
        menuBar.add(helpMenu);

        return menuBar;
    }

    private void loadGroups() {
        tabbedPane.removeAll();
        Configuration config = configManager.getConfiguration();
        List<AppGroup> groups = config.getGroups();

        for (AppGroup group : groups) {
            GroupPanel groupPanel = new GroupPanel(group);
            groupPanel.setGroupPanelListener(new GroupPanel.GroupPanelListener() {
                @Override
                public void onAddApp(AppGroup group) {
                    addApplicationToGroup(group);
                }

                @Override
                public void onEditGroup(AppGroup group) {
                    editGroup(group);
                }

                @Override
                public void onDeleteGroup(AppGroup group) {
                    deleteGroup(group);
                }

                @Override
                public void onAppUpdated() {
                    // 更新完成
                }
            });
            tabbedPane.addTab(group.getName(), groupPanel);
        }
    }

    private void importApplications() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setMultiSelectionEnabled(true);
        fileChooser.setFileSelectionMode(JFileChooser.FILES_ONLY);
        fileChooser.setDialogTitle("选择要导入的应用程序");

        FileNameExtensionFilter filter = new FileNameExtensionFilter(
                "可执行文件 (*.exe, *.lnk, *.bat, *.cmd)",
                "exe", "lnk", "bat", "cmd");
        fileChooser.setFileFilter(filter);

        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File[] files = fileChooser.getSelectedFiles();
            if (files.length > 0) {
                showImportDialog(files);
            }
        }
    }

    private void showImportDialog(File[] files) {
        List<AppGroup> groups = configManager.getConfiguration().getGroups();
        String[] groupNames = new String[groups.size()];
        for (int i = 0; i < groups.size(); i++) {
            groupNames[i] = groups.get(i).getName();
        }

        JPanel panel = new JPanel(new BorderLayout(10, 10));

        DefaultListModel<String> listModel = new DefaultListModel<>();
        for (File file : files) {
            listModel.addElement(file.getName());
        }
        JList<String> fileList = new JList<>(listModel);
        fileList.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
        fileList.setVisibleRowCount(Math.min(files.length, 10));
        JScrollPane scrollPane = new JScrollPane(fileList);

        JComboBox<String> groupCombo = new JComboBox<>(groupNames);

        JPanel inputPanel = new JPanel(new GridLayout(1, 2, 5, 5));
        inputPanel.add(new JLabel("目标分组:"));
        inputPanel.add(groupCombo);

        panel.add(new JLabel("将导入以下应用:"), BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.add(inputPanel, BorderLayout.SOUTH);

        int result = JOptionPane.showConfirmDialog(this, panel, "导入应用", JOptionPane.OK_CANCEL_OPTION);
        if (result == JOptionPane.OK_OPTION) {
            AppGroup targetGroup = groups.get(groupCombo.getSelectedIndex());
            int imported = 0;
            for (File file : files) {
                Application app = new Application();
                app.setName(launcherService.extractFileName(file.getAbsolutePath()));
                app.setPath(file.getAbsolutePath());
                targetGroup.addApplication(app);
                imported++;
            }
            configManager.saveConfiguration();
            refreshAll();
            JOptionPane.showMessageDialog(this, "成功导入 " + imported + " 个应用");
        }
    }

    private void addApplicationToGroup(AppGroup group) {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setMultiSelectionEnabled(true);
        fileChooser.setDialogTitle("选择要添加到 \"" + group.getName() + "\" 的应用");

        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File[] files = fileChooser.getSelectedFiles();
            int added = 0;
            for (File file : files) {
                Application app = new Application();
                app.setName(launcherService.extractFileName(file.getAbsolutePath()));
                app.setPath(file.getAbsolutePath());
                group.addApplication(app);
                added++;
            }
            configManager.saveConfiguration();
            refreshAll();
            JOptionPane.showMessageDialog(this, "成功添加 " + added + " 个应用到 \"" + group.getName() + "\"");
        }
    }

    private void addNewGroup() {
        String name = JOptionPane.showInputDialog(this, "请输入分组名称:", "新建分组", JOptionPane.PLAIN_MESSAGE);
        if (name != null && !name.trim().isEmpty()) {
            AppGroup newGroup = new AppGroup(name.trim());
            configManager.getConfiguration().addGroup(newGroup);
            configManager.saveConfiguration();
            loadGroups();
        }
    }

    private void editGroup(AppGroup group) {
        JTextField nameField = new JTextField(group.getName());
        JTextField descField = new JTextField(group.getDescription() != null ? group.getDescription() : "");

        JPanel panel = new JPanel(new GridLayout(2, 2, 5, 5));
        panel.add(new JLabel("分组名称:"));
        panel.add(nameField);
        panel.add(new JLabel("描述:"));
        panel.add(descField);

        int result = JOptionPane.showConfirmDialog(this, panel, "编辑分组", JOptionPane.OK_CANCEL_OPTION);
        if (result == JOptionPane.OK_OPTION) {
            group.setName(nameField.getText().trim());
            group.setDescription(descField.getText().trim());
            configManager.saveConfiguration();
            loadGroups();
        }
    }

    private void deleteGroup(AppGroup group) {
        int result = JOptionPane.showConfirmDialog(this,
                "确定要删除分组 \"" + group.getName() + "\" 吗?\n该分组下的所有应用也将被删除。",
                "确认删除", JOptionPane.YES_NO_OPTION);
        if (result == JOptionPane.YES_OPTION) {
            configManager.getConfiguration().removeGroup(group);
            configManager.saveConfiguration();
            loadGroups();
        }
    }

    private void importConfig() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("选择配置文件");
        FileNameExtensionFilter filter = new FileNameExtensionFilter("JSON 配置文件", "json");
        fileChooser.setFileFilter(filter);

        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            configManager.importConfiguration(fileChooser.getSelectedFile().getAbsolutePath());
            loadGroups();
            JOptionPane.showMessageDialog(this, "配置导入成功");
        }
    }

    private void exportConfig() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("保存配置文件");
        fileChooser.setSelectedFile(new File("applauncher_config.json"));
        FileNameExtensionFilter filter = new FileNameExtensionFilter("JSON 配置文件", "json");
        fileChooser.setFileFilter(filter);

        int result = fileChooser.showSaveDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            String path = fileChooser.getSelectedFile().getAbsolutePath();
            if (!path.toLowerCase().endsWith(".json")) {
                path += ".json";
            }
            configManager.exportConfiguration(path);
            JOptionPane.showMessageDialog(this, "配置导出成功");
        }
    }

    private void refreshAll() {
        loadGroups();
    }

    private void showAbout() {
        JOptionPane.showMessageDialog(this,
                "软件收纳启动器 v1.0\n\n" +
                        "功能特点:\n" +
                        "- 批量导入本地应用\n" +
                        "- 自定义分组管理\n" +
                        "- 一键批量启动\n" +
                        "- 应用置顶排序\n" +
                        "- 配置永久保存\n\n" +
                        "配置文件位置: " + configManager.getConfigPath(),
                "关于",
                JOptionPane.INFORMATION_MESSAGE);
    }
}
