package com.applauncher.util;

import javax.swing.*;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class IconUtil {
    private static final Map<String, Icon> iconCache = new HashMap<>();
    private static Icon defaultIcon;

    static {
        defaultIcon = UIManager.getIcon("FileView.fileIcon");
    }

    public static Icon getFileIcon(String filePath) {
        if (filePath == null) {
            return defaultIcon;
        }

        if (iconCache.containsKey(filePath)) {
            return iconCache.get(filePath);
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return defaultIcon;
        }

        try {
            javax.swing.filechooser.FileSystemView fsv = 
                javax.swing.filechooser.FileSystemView.getFileSystemView();
            Icon icon = fsv.getSystemIcon(file);
            iconCache.put(filePath, icon);
            return icon;
        } catch (Exception e) {
            return defaultIcon;
        }
    }

    public static Icon getFolderIcon() {
        return UIManager.getIcon("FileView.directoryIcon");
    }

    public static Icon getDefaultIcon() {
        return defaultIcon;
    }

    public static void clearCache() {
        iconCache.clear();
    }

    public static Icon resizeIcon(Icon icon, int width, int height) {
        if (icon == null) {
            return null;
        }
        if (icon.getIconWidth() == width && icon.getIconHeight() == height) {
            return icon;
        }
        if (icon instanceof ImageIcon) {
            ImageIcon imageIcon = (ImageIcon) icon;
            java.awt.Image image = imageIcon.getImage().getScaledInstance(width, height, java.awt.Image.SCALE_SMOOTH);
            return new ImageIcon(image);
        }
        return icon;
    }
}
