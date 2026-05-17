package com.dbtool.ui;

import com.dbtool.util.*;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.io.File;
import java.sql.SQLException;
import java.util.List;

public class MainWindow extends JFrame {
    private JTabbedPane tabbedPane;
    private SQLEditor sqlTextArea;
    private JTable resultTable;
    private JTable structureTable;
    private JList<String> tableList;
    private JList<String> favoriteList;
    private JLabel statusLabel;
    private JComboBox<String> dbTypeCombo;
    private JTextField dbPathField;
    private JTextField userField;
    private JPasswordField passField;

    public MainWindow() {
        setTitle("轻量化数据库查询工具");
        setSize(1200, 800);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        initUI();
        loadLastConfig();
    }

    private void initUI() {
        JSplitPane mainSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
        mainSplit.setDividerLocation(250);

        JPanel leftPanel = createLeftPanel();
        JPanel rightPanel = createRightPanel();

        mainSplit.setLeftComponent(leftPanel);
        mainSplit.setRightComponent(rightPanel);

        add(mainSplit, BorderLayout.CENTER);
        add(createStatusBar(), BorderLayout.SOUTH);
    }

    private JPanel createLeftPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        tabbedPane = new JTabbedPane();
        tabbedPane.add("连接配置", createConnectionPanel());
        tabbedPane.add("数据表", createTablePanel());
        tabbedPane.add("SQL收藏", createFavoritePanel());

        panel.add(tabbedPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createConnectionPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0; gbc.gridy = 0;
        panel.add(new JLabel("数据库类型:"), gbc);

        gbc.gridx = 1; gbc.weightx = 1;
        dbTypeCombo = new JComboBox<>(new String[]{"H2", "SQLite"});
        dbTypeCombo.addActionListener(e -> toggleAuthFields());
        panel.add(dbTypeCombo, gbc);

        gbc.gridx = 0; gbc.gridy = 1; gbc.weightx = 0;
        panel.add(new JLabel("数据库路径:"), gbc);

        gbc.gridx = 1; gbc.weightx = 1;
        dbPathField = new JTextField();
        panel.add(dbPathField, gbc);

        gbc.gridx = 2; gbc.weightx = 0;
        JButton browseBtn = new JButton("浏览");
        browseBtn.addActionListener(e -> browseFile());
        panel.add(browseBtn, gbc);

        gbc.gridx = 0; gbc.gridy = 2; gbc.weightx = 0;
        panel.add(new JLabel("用户名:"), gbc);

        gbc.gridx = 1; gbc.weightx = 1;
        userField = new JTextField("sa");
        panel.add(userField, gbc);

        gbc.gridx = 0; gbc.gridy = 3; gbc.weightx = 0;
        panel.add(new JLabel("密码:"), gbc);

        gbc.gridx = 1; gbc.weightx = 1;
        passField = new JPasswordField();
        panel.add(passField, gbc);

        gbc.gridx = 0; gbc.gridy = 4; gbc.gridwidth = 3; gbc.weightx = 1;
        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        JButton connectBtn = new JButton("连接");
        connectBtn.addActionListener(e -> connectDatabase());
        JButton disconnectBtn = new JButton("断开");
        disconnectBtn.addActionListener(e -> disconnectDatabase());
        btnPanel.add(connectBtn);
        btnPanel.add(disconnectBtn);
        panel.add(btnPanel, gbc);

        gbc.gridy = 5; gbc.weighty = 1;
        gbc.anchor = GridBagConstraints.NORTH;
        panel.add(new JPanel(), gbc);

        toggleAuthFields();
        return panel;
    }

    private void toggleAuthFields() {
        String type = (String) dbTypeCombo.getSelectedItem();
        boolean isH2 = "H2".equals(type);
        userField.setEnabled(isH2);
        passField.setEnabled(isH2);
    }

    private void browseFile() {
        JFileChooser chooser = new JFileChooser();
        chooser.setFileSelectionMode(JFileChooser.FILES_AND_DIRECTORIES);
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            dbPathField.setText(chooser.getSelectedFile().getAbsolutePath());
        }
    }

    private void connectDatabase() {
        try {
            String dbType = (String) dbTypeCombo.getSelectedItem();
            String dbPath = dbPathField.getText().trim();

            if (dbPath.isEmpty()) {
                JOptionPane.showMessageDialog(this, "请选择数据库路径");
                return;
            }

            boolean success;
            if ("H2".equals(dbType)) {
                success = DBConnectionUtil.connectH2(dbPath, userField.getText(), new String(passField.getPassword()));
            } else {
                success = DBConnectionUtil.connectSQLite(dbPath);
            }

            if (success) {
                ConfigManager.saveConnectionConfig(dbType, dbPath, userField.getText());
                statusLabel.setText("已连接: " + dbType + " - " + new File(dbPath).getName());
                loadTables();
                tabbedPane.setSelectedIndex(1);
            }
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "连接失败: " + e.getMessage());
        }
    }

    private void disconnectDatabase() {
        DBConnectionUtil.closeConnection();
        statusLabel.setText("未连接");
        tableList.setListData(new String[0]);
        clearTableData(resultTable);
        clearTableData(structureTable);
    }

    private JPanel createTablePanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        tableList = new JList<>();
        tableList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        tableList.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    showTableStructure();
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(tableList);
        panel.add(scrollPane, BorderLayout.CENTER);

        JButton refreshBtn = new JButton("刷新表列表");
        refreshBtn.addActionListener(e -> loadTables());
        panel.add(refreshBtn, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createFavoritePanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        favoriteList = new JList<>();
        favoriteList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        favoriteList.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    loadFavorite();
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(favoriteList);
        panel.add(scrollPane, BorderLayout.CENTER);

        JPanel btnPanel = new JPanel(new GridLayout(1, 2, 5, 5));
        JButton loadBtn = new JButton("加载");
        loadBtn.addActionListener(e -> loadFavorite());
        JButton deleteBtn = new JButton("删除");
        deleteBtn.addActionListener(e -> deleteFavorite());
        btnPanel.add(loadBtn);
        btnPanel.add(deleteBtn);

        panel.add(btnPanel, BorderLayout.SOUTH);

        loadFavorites();
        return panel;
    }

    private JPanel createRightPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        JSplitPane split = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
        split.setDividerLocation(300);

        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.setBorder(BorderFactory.createTitledBorder("SQL 编辑器"));

        sqlTextArea = new SQLEditor();
        topPanel.add(sqlTextArea.createScrollPaneWithLineNumbers(), BorderLayout.CENTER);

        JPanel sqlBtnPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JButton executeBtn = new JButton("执行 SQL");
        executeBtn.addActionListener(e -> executeSQL());
        JButton clearBtn = new JButton("清空");
        clearBtn.addActionListener(e -> sqlTextArea.setText(""));
        JButton favoriteBtn = new JButton("收藏 SQL");
        favoriteBtn.addActionListener(e -> addFavorite());
        sqlBtnPanel.add(executeBtn);
        sqlBtnPanel.add(clearBtn);
        sqlBtnPanel.add(favoriteBtn);
        topPanel.add(sqlBtnPanel, BorderLayout.NORTH);

        JPanel bottomPanel = new JPanel(new BorderLayout());
        bottomPanel.setBorder(BorderFactory.createTitledBorder("执行结果"));

        JTabbedPane resultTabs = new JTabbedPane();

        resultTable = TableRenderer.createResultTable();
        resultTabs.add("查询结果", new JScrollPane(resultTable));

        structureTable = TableRenderer.createStructureTable();
        resultTabs.add("表结构", new JScrollPane(structureTable));

        bottomPanel.add(resultTabs, BorderLayout.CENTER);

        split.setTopComponent(topPanel);
        split.setBottomComponent(bottomPanel);

        panel.add(split, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createStatusBar() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEtchedBorder());
        statusLabel = new JLabel("  未连接");
        panel.add(statusLabel, BorderLayout.WEST);
        return panel;
    }

    private void loadTables() {
        try {
            List<String> tables = SQLExecutor.getTableNames();
            tableList.setListData(tables.toArray(new String[0]));
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "加载表失败: " + e.getMessage());
        }
    }

    private void showTableStructure() {
        String tableName = tableList.getSelectedValue();
        if (tableName == null) return;

        try {
            List<SQLExecutor.TableColumn> columns = SQLExecutor.getTableStructure(tableName);
            String[] colNames = {"字段名", "类型", "大小", "可空", "默认值"};
            DefaultTableModel model = TableRenderer.createTableModel(colNames);

            for (SQLExecutor.TableColumn col : columns) {
                model.addRow(new Object[]{
                    col.getName(),
                    col.getType(),
                    col.getSize(),
                    col.isNullable() ? "是" : "否",
                    col.getDefaultValue()
                });
            }

            structureTable.setModel(model);
            sqlTextArea.setText("SELECT * FROM " + tableName + ";");
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "加载表结构失败: " + e.getMessage());
        }
    }

    private void executeSQL() {
        String sql = sqlTextArea.getText().trim();
        if (sql.isEmpty()) {
            JOptionPane.showMessageDialog(this, "请输入 SQL 语句");
            return;
        }

        if (!DBConnectionUtil.isConnected()) {
            JOptionPane.showMessageDialog(this, "请先连接数据库");
            return;
        }

        try {
            SQLExecutor.QueryResult result = SQLExecutor.executeQuery(sql);

            if (result.hasResults()) {
                DefaultTableModel model = TableRenderer.createTableModel(
                    result.getColumns().toArray(new String[0]));

                for (Object[] row : result.getRows()) {
                    model.addRow(row);
                }

                resultTable.setModel(model);
                TableRenderer.adjustColumnWidth(resultTable);
                statusLabel.setText("  查询完成，共 " + result.getRows().size() + " 条记录");
            } else {
                clearTableData(resultTable);
                int count = result.getUpdateCount();
                statusLabel.setText("  执行完成，影响 " + (count >= 0 ? count : 0) + " 行");
            }
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "执行失败: " + e.getMessage());
        }
    }

    private void addFavorite() {
        String sql = sqlTextArea.getText().trim();
        if (sql.isEmpty()) {
            JOptionPane.showMessageDialog(this, "SQL 语句为空");
            return;
        }

        String name = JOptionPane.showInputDialog(this, "请输入收藏名称:");
        if (name != null && !name.trim().isEmpty()) {
            ConfigManager.addFavorite(name.trim(), sql);
            loadFavorites();
        }
    }

    private void loadFavorites() {
        List<ConfigManager.FavoriteItem> favorites = ConfigManager.getFavorites();
        String[] names = favorites.stream()
            .map(ConfigManager.FavoriteItem::getName)
            .toArray(String[]::new);
        favoriteList.setListData(names);
    }

    private void loadFavorite() {
        int index = favoriteList.getSelectedIndex();
        if (index >= 0) {
            List<ConfigManager.FavoriteItem> favorites = ConfigManager.getFavorites();
            sqlTextArea.setText(favorites.get(index).getSql());
        }
    }

    private void deleteFavorite() {
        int index = favoriteList.getSelectedIndex();
        if (index >= 0) {
            ConfigManager.removeFavorite(index);
            loadFavorites();
        }
    }

    private void clearTableData(JTable table) {
        table.setModel(TableRenderer.createTableModel(new String[0]));
    }

    private void loadLastConfig() {
        String dbType = ConfigManager.getLastDbType();
        String dbPath = ConfigManager.getLastDbPath();
        String user = ConfigManager.getLastUser();

        if (!dbType.isEmpty()) {
            dbTypeCombo.setSelectedItem(dbType);
        }
        if (!dbPath.isEmpty()) {
            dbPathField.setText(dbPath);
        }
        if (!user.isEmpty()) {
            userField.setText(user);
        }
    }
}
