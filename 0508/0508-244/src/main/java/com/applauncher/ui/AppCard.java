package com.applauncher.ui;

import com.applauncher.model.Application;
import com.applauncher.service.AppLauncherService;
import com.applauncher.util.IconUtil;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class AppCard extends JPanel {
    private Application app;
    private JLabel iconLabel;
    private JLabel nameLabel;
    private JButton pinButton;
    private JButton launchButton;
    private boolean selected;
    private AppCardListener listener;

    public interface AppCardListener {
        void onPinToggle(Application app);
        void onEdit(Application app);
        void onDelete(Application app);
        void onMoveUp(Application app);
        void onMoveDown(Application app);
        void onSelectionChanged(AppCard card, boolean selected);
    }

    public AppCard(Application app) {
        this.app = app;
        this.selected = false;
        initializeUI();
        setupPopupMenu();
    }

    private void initializeUI() {
        setLayout(new BorderLayout(5, 5));
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(200, 200, 200), 1, true),
                BorderFactory.createEmptyBorder(8, 8, 8, 8)
        ));
        setBackground(Color.WHITE);
        setCursor(new Cursor(Cursor.HAND_CURSOR));

        Icon icon = IconUtil.getFileIcon(app.getPath());
        iconLabel = new JLabel(icon);
        iconLabel.setPreferredSize(new Dimension(48, 48));
        iconLabel.setHorizontalAlignment(SwingConstants.CENTER);

        JPanel centerPanel = new JPanel(new BorderLayout());
        centerPanel.setOpaque(false);

        nameLabel = new JLabel(app.getName());
        nameLabel.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        nameLabel.setToolTipText(app.getPath());

        JPanel infoPanel = new JPanel(new BorderLayout());
        infoPanel.setOpaque(false);

        JLabel pathLabel = new JLabel();
        String path = app.getPath();
        if (path.length() > 30) {
            path = "..." + path.substring(path.length() - 27);
        }
        pathLabel.setText(path);
        pathLabel.setFont(new Font("微软雅黑", Font.PLAIN, 11));
        pathLabel.setForeground(Color.GRAY);

        JLabel statsLabel = new JLabel();
        String statsText = "";
        if (app.getLaunchCount() > 0) {
            statsText = "启动" + app.getLaunchCount() + "次";
            if (app.getLastLaunchTime() > 0) {
                statsText += " · " + formatLastLaunchTime(app.getLastLaunchTime());
            }
        }
        statsLabel.setText(statsText);
        statsLabel.setFont(new Font("微软雅黑", Font.PLAIN, 10));
        statsLabel.setForeground(new Color(120, 120, 120));

        infoPanel.add(pathLabel, BorderLayout.NORTH);
        infoPanel.add(statsLabel, BorderLayout.SOUTH);

        centerPanel.add(nameLabel, BorderLayout.NORTH);
        centerPanel.add(infoPanel, BorderLayout.CENTER);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 2, 0));
        buttonPanel.setOpaque(false);

        pinButton = new JButton(app.isPinned() ? "★" : "☆");
        pinButton.setFont(new Font("微软雅黑", Font.PLAIN, 16));
        pinButton.setBorderPainted(false);
        pinButton.setContentAreaFilled(false);
        pinButton.setFocusPainted(false);
        pinButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        pinButton.addActionListener(e -> togglePin());

        launchButton = new JButton("启动");
        launchButton.setFont(new Font("微软雅黑", Font.PLAIN, 11));
        launchButton.addActionListener(e -> launchApp());

        buttonPanel.add(pinButton);
        buttonPanel.add(launchButton);

        add(iconLabel, BorderLayout.WEST);
        add(centerPanel, BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.EAST);

        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    launchApp();
                } else if (e.getButton() == MouseEvent.BUTTON1) {
                    toggleSelection();
                }
            }

            @Override
            public void mouseEntered(MouseEvent e) {
                if (!selected) {
                    setBackground(new Color(240, 248, 255));
                }
            }

            @Override
            public void mouseExited(MouseEvent e) {
                if (!selected) {
                    setBackground(Color.WHITE);
                }
            }
        });
    }

    private void setupPopupMenu() {
        JPopupMenu popupMenu = new JPopupMenu();

        JMenuItem launchItem = new JMenuItem("启动");
        launchItem.addActionListener(e -> launchApp());
        popupMenu.add(launchItem);

        popupMenu.addSeparator();

        JMenuItem pinItem = new JMenuItem(app.isPinned() ? "取消置顶" : "置顶");
        pinItem.addActionListener(e -> togglePin());
        popupMenu.add(pinItem);

        JMenuItem moveUpItem = new JMenuItem("上移");
        moveUpItem.addActionListener(e -> {
            if (listener != null) listener.onMoveUp(app);
        });
        popupMenu.add(moveUpItem);

        JMenuItem moveDownItem = new JMenuItem("下移");
        moveDownItem.addActionListener(e -> {
            if (listener != null) listener.onMoveDown(app);
        });
        popupMenu.add(moveDownItem);

        popupMenu.addSeparator();

        JMenuItem editItem = new JMenuItem("编辑");
        editItem.addActionListener(e -> {
            if (listener != null) listener.onEdit(app);
        });
        popupMenu.add(editItem);

        JMenuItem deleteItem = new JMenuItem("删除");
        deleteItem.addActionListener(e -> {
            if (listener != null) listener.onDelete(app);
        });
        popupMenu.add(deleteItem);

        setComponentPopupMenu(popupMenu);
    }

    private void launchApp() {
        AppLauncherService.getInstance().launchApplication(app);
    }

    private void togglePin() {
        app.setPinned(!app.isPinned());
        pinButton.setText(app.isPinned() ? "★" : "☆");
        if (listener != null) {
            listener.onPinToggle(app);
        }
    }

    private void toggleSelection() {
        selected = !selected;
        updateSelectionUI();
        if (listener != null) {
            listener.onSelectionChanged(this, selected);
        }
    }

    private void updateSelectionUI() {
        if (selected) {
            setBackground(new Color(135, 206, 250));
            setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(new Color(70, 130, 180), 2, true),
                    BorderFactory.createEmptyBorder(7, 7, 7, 7)
            ));
        } else {
            setBackground(Color.WHITE);
            setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(new Color(200, 200, 200), 1, true),
                    BorderFactory.createEmptyBorder(8, 8, 8, 8)
            ));
        }
    }

    public Application getApp() {
        return app;
    }

    public boolean isSelected() {
        return selected;
    }

    public void setSelected(boolean selected) {
        this.selected = selected;
        updateSelectionUI();
    }

    public void setAppCardListener(AppCardListener listener) {
        this.listener = listener;
    }

    public void refresh() {
        nameLabel.setText(app.getName());
        pinButton.setText(app.isPinned() ? "★" : "☆");
        Icon icon = IconUtil.getFileIcon(app.getPath());
        iconLabel.setIcon(icon);
    }

    private String formatLastLaunchTime(long timeMillis) {
        if (timeMillis <= 0) {
            return "";
        }
        long now = System.currentTimeMillis();
        long diff = now - timeMillis;
        
        long seconds = diff / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;
        
        if (days > 0) {
            return days + "天前";
        } else if (hours > 0) {
            return hours + "小时前";
        } else if (minutes > 0) {
            return minutes + "分钟前";
        } else {
            return "刚刚";
        }
    }
}
