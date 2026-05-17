package com.applauncher.ui;

import com.applauncher.model.AppGroup;
import com.applauncher.model.Application;
import com.applauncher.model.SortType;
import com.applauncher.service.AppLauncherService;
import com.applauncher.service.ConfigManager;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.List;

public class GroupPanel extends JPanel {
    private AppGroup group;
    private List<AppCard> appCards;
    private JPanel cardsPanel;
    private JLabel titleLabel;
    private JButton launchAllButton;
    private JButton addAppButton;
    private JComboBox<String> sortComboBox;
    private GroupPanelListener listener;
    private List<AppCard> selectedCards;

    public interface GroupPanelListener {
        void onAddApp(AppGroup group);
        void onEditGroup(AppGroup group);
        void onDeleteGroup(AppGroup group);
        void onAppUpdated();
    }

    public GroupPanel(AppGroup group) {
        this.group = group;
        this.appCards = new ArrayList<>();
        this.selectedCards = new ArrayList<>();
        initializeUI();
    }

    private void initializeUI() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setBorder(BorderFactory.createEmptyBorder(0, 0, 5, 0));

        JPanel leftPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));

        titleLabel = new JLabel(group.getName());
        titleLabel.setFont(new Font("微软雅黑", Font.BOLD, 16));
        titleLabel.setForeground(new Color(50, 50, 150));

        String[] sortOptions = {
            SortType.MANUAL.getDisplayName(),
            SortType.LAST_LAUNCH_TIME.getDisplayName(),
            SortType.LAUNCH_COUNT.getDisplayName(),
            SortType.NAME.getDisplayName()
        };
        sortComboBox = new JComboBox<>(sortOptions);
        sortComboBox.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        sortComboBox.setSelectedIndex(getSortTypeIndex(group.getSortType()));
        sortComboBox.addActionListener(e -> changeSortType());

        leftPanel.add(titleLabel);
        leftPanel.add(new JLabel("排序:"));
        leftPanel.add(sortComboBox);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 0));

        launchAllButton = new JButton("一键启动");
        launchAllButton.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        launchAllButton.addActionListener(e -> launchAllApps());

        addAppButton = new JButton("+ 添加应用");
        addAppButton.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        addAppButton.addActionListener(e -> {
            if (listener != null) listener.onAddApp(group);
        });

        JButton menuButton = new JButton("☰");
        menuButton.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        menuButton.setBorderPainted(false);
        menuButton.setContentAreaFilled(false);
        menuButton.addActionListener(e -> showGroupMenu(e));

        buttonPanel.add(launchAllButton);
        buttonPanel.add(addAppButton);
        buttonPanel.add(menuButton);

        headerPanel.add(leftPanel, BorderLayout.WEST);
        headerPanel.add(buttonPanel, BorderLayout.EAST);

        cardsPanel = new JPanel(new GridBagLayout());
        cardsPanel.setBackground(new Color(245, 245, 245));

        JScrollPane scrollPane = new JScrollPane(cardsPanel);
        scrollPane.setBorder(null);
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);

        add(headerPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);

        refreshApps();
    }

    private void showGroupMenu(ActionEvent e) {
        JPopupMenu menu = new JPopupMenu();

        JMenuItem editItem = new JMenuItem("编辑分组");
        editItem.addActionListener(ev -> {
            if (listener != null) listener.onEditGroup(group);
        });
        menu.add(editItem);

        JMenuItem launchSelectedItem = new JMenuItem("启动选中");
        launchSelectedItem.addActionListener(ev -> launchSelectedApps());
        menu.add(launchSelectedItem);

        JMenuItem clearSelectionItem = new JMenuItem("取消全选");
        clearSelectionItem.addActionListener(ev -> clearSelection());
        menu.add(clearSelectionItem);

        menu.addSeparator();

        JMenuItem deleteItem = new JMenuItem("删除分组");
        deleteItem.addActionListener(ev -> {
            if (listener != null) listener.onDeleteGroup(group);
        });
        menu.add(deleteItem);

        menu.show((JButton) e.getSource(), 0, ((JButton) e.getSource()).getHeight());
    }

    public void refreshApps() {
        appCards.clear();
        selectedCards.clear();
        cardsPanel.removeAll();

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;
        gbc.insets = new Insets(5, 5, 5, 5);

        List<Application> apps = group.getApplications();
        for (Application app : apps) {
            AppCard card = new AppCard(app);
            card.setAppCardListener(new AppCard.AppCardListener() {
                @Override
                public void onPinToggle(Application app) {
                    group.sortApplications();
                    ConfigManager.getInstance().saveConfiguration();
                    refreshApps();
                }

                @Override
                public void onEdit(Application app) {
                    editApplication(app);
                }

                @Override
                public void onDelete(Application app) {
                    deleteApplication(app);
                }

                @Override
                public void onMoveUp(Application app) {
                    moveApp(app, -1);
                }

                @Override
                public void onMoveDown(Application app) {
                    moveApp(app, 1);
                }

                @Override
                public void onSelectionChanged(AppCard card, boolean selected) {
                    if (selected) {
                        if (!selectedCards.contains(card)) {
                            selectedCards.add(card);
                        }
                    } else {
                        selectedCards.remove(card);
                    }
                }
            });
            appCards.add(card);
            cardsPanel.add(card, gbc);
            gbc.gridy++;
        }

        if (apps.isEmpty()) {
            JLabel emptyLabel = new JLabel("该分组暂无应用，点击\"添加应用\"导入");
            emptyLabel.setFont(new Font("微软雅黑", Font.ITALIC, 14));
            emptyLabel.setForeground(Color.GRAY);
            emptyLabel.setHorizontalAlignment(SwingConstants.CENTER);
            emptyLabel.setBorder(BorderFactory.createEmptyBorder(50, 10, 50, 10));
            cardsPanel.add(emptyLabel, gbc);
        }

        cardsPanel.revalidate();
        cardsPanel.repaint();
    }

    private void launchAllApps() {
        List<Application> apps = group.getApplications();
        if (apps.isEmpty()) {
            JOptionPane.showMessageDialog(this, "该分组暂无应用");
            return;
        }
        showLaunchProgress("正在启动分组应用...", apps, () -> {
            AppLauncherService.getInstance().launchGroupApplications(group);
        });
    }

    private void launchSelectedApps() {
        if (selectedCards.isEmpty()) {
            JOptionPane.showMessageDialog(this, "请先选择要启动的应用");
            return;
        }
        List<Application> apps = new ArrayList<>();
        for (AppCard card : selectedCards) {
            apps.add(card.getApp());
        }
        showLaunchProgress("正在启动选中的应用...", apps, () -> {
            AppLauncherService.getInstance().launchMultipleApplications(apps);
        });
    }

    private void showLaunchProgress(String title, List<Application> apps, Runnable task) {
        JDialog progressDialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), title, true);
        progressDialog.setSize(400, 150);
        progressDialog.setLocationRelativeTo(this);
        progressDialog.setResizable(false);
        progressDialog.setDefaultCloseOperation(JDialog.DO_NOTHING_ON_CLOSE);

        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        JLabel statusLabel = new JLabel("准备启动 " + apps.size() + " 个应用...");
        statusLabel.setFont(new Font("微软雅黑", Font.PLAIN, 14));

        JProgressBar progressBar = new JProgressBar(0, apps.size());
        progressBar.setStringPainted(true);
        progressBar.setFont(new Font("微软雅黑", Font.PLAIN, 12));

        panel.add(statusLabel, BorderLayout.NORTH);
        panel.add(progressBar, BorderLayout.CENTER);
        progressDialog.add(panel);

        new Thread(() -> {
            try {
                task.run();
                for (int i = 0; i <= apps.size(); i++) {
                    final int progress = i;
                    SwingUtilities.invokeLater(() -> {
                        progressBar.setValue(progress);
                        if (progress < apps.size()) {
                            statusLabel.setText("正在启动: " + apps.get(progress).getName());
                        } else {
                            statusLabel.setText("启动完成!");
                        }
                    });
                    if (i < apps.size()) {
                        Thread.sleep(1100);
                    }
                }
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                SwingUtilities.invokeLater(progressDialog::dispose);
            }
        }).start();

        progressDialog.setVisible(true);
    }

    private void clearSelection() {
        for (AppCard card : selectedCards) {
            card.setSelected(false);
        }
        selectedCards.clear();
    }

    private void editApplication(Application app) {
        JTextField nameField = new JTextField(app.getName());
        JTextField pathField = new JTextField(app.getPath());

        JPanel panel = new JPanel(new GridLayout(2, 2, 5, 5));
        panel.add(new JLabel("应用名称:"));
        panel.add(nameField);
        panel.add(new JLabel("路径:"));
        panel.add(pathField);

        int result = JOptionPane.showConfirmDialog(this, panel, "编辑应用", JOptionPane.OK_CANCEL_OPTION);
        if (result == JOptionPane.OK_OPTION) {
            app.setName(nameField.getText().trim());
            app.setPath(pathField.getText().trim());
            ConfigManager.getInstance().saveConfiguration();
            refreshApps();
            if (listener != null) listener.onAppUpdated();
        }
    }

    private void deleteApplication(Application app) {
        int result = JOptionPane.showConfirmDialog(this, 
            "确定要删除应用 \"" + app.getName() + "\" 吗?", "确认删除", JOptionPane.YES_NO_OPTION);
        if (result == JOptionPane.YES_OPTION) {
            group.removeApplication(app);
            ConfigManager.getInstance().saveConfiguration();
            refreshApps();
            if (listener != null) listener.onAppUpdated();
        }
    }

    private void moveApp(Application app, int direction) {
        List<Application> apps = group.getApplications();
        int index = apps.indexOf(app);
        if (index >= 0) {
            int newIndex = index + direction;
            if (newIndex >= 0 && newIndex < apps.size()) {
                group.moveApplication(index, newIndex);
                ConfigManager.getInstance().saveConfiguration();
                refreshApps();
            }
        }
    }

    public AppGroup getGroup() {
        return group;
    }

    public void setGroup(AppGroup group) {
        this.group = group;
        titleLabel.setText(group.getName());
        refreshApps();
    }

    public void setGroupPanelListener(GroupPanelListener listener) {
        this.listener = listener;
    }

    private int getSortTypeIndex(SortType sortType) {
        if (sortType == null) {
            return 0;
        }
        switch (sortType) {
            case MANUAL: return 0;
            case LAST_LAUNCH_TIME: return 1;
            case LAUNCH_COUNT: return 2;
            case NAME: return 3;
            default: return 0;
        }
    }

    private SortType getSortTypeFromIndex(int index) {
        switch (index) {
            case 0: return SortType.MANUAL;
            case 1: return SortType.LAST_LAUNCH_TIME;
            case 2: return SortType.LAUNCH_COUNT;
            case 3: return SortType.NAME;
            default: return SortType.MANUAL;
        }
    }

    private void changeSortType() {
        SortType newSortType = getSortTypeFromIndex(sortComboBox.getSelectedIndex());
        group.setSortType(newSortType);
        ConfigManager.getInstance().saveConfiguration();
        refreshApps();
    }

    public void refreshSortUI() {
        if (sortComboBox != null && group != null) {
            sortComboBox.setSelectedIndex(getSortTypeIndex(group.getSortType()));
        }
    }
}
