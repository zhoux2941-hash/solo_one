package com.watermark;

import com.watermark.ui.WatermarkToolUI;

import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                e.printStackTrace();
            }
            WatermarkToolUI ui = new WatermarkToolUI();
            ui.setVisible(true);
        });
    }
}