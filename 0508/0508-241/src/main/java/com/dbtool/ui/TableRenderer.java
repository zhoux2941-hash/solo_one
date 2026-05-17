package com.dbtool.ui;

import javax.swing.*;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;

public class TableRenderer {
    public static JTable createResultTable() {
        JTable table = new JTable();
        table.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
        table.setRowHeight(25);
        table.setShowGrid(true);
        table.setGridColor(new Color(200, 200, 200));
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);

        JTableHeader header = table.getTableHeader();
        header.setFont(header.getFont().deriveFont(Font.BOLD));
        header.setBackground(new Color(240, 240, 240));

        table.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value,
                    boolean isSelected, boolean hasFocus, int row, int column) {
                super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);

                if (!isSelected) {
                    if (row % 2 == 0) {
                        setBackground(Color.WHITE);
                    } else {
                        setBackground(new Color(248, 248, 248));
                    }
                }

                setBorder(BorderFactory.createEmptyBorder(0, 5, 0, 5));

                return this;
            }
        });

        return table;
    }

    public static DefaultTableModel createTableModel(String[] columns) {
        return new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
    }

    public static void adjustColumnWidth(JTable table) {
        for (int i = 0; i < table.getColumnCount(); i++) {
            int width = 100;
            for (int j = 0; j < table.getRowCount(); j++) {
                Object value = table.getValueAt(j, i);
                if (value != null) {
                    int textWidth = value.toString().length() * 8 + 20;
                    width = Math.max(width, textWidth);
                }
            }
            table.getColumnModel().getColumn(i).setPreferredWidth(Math.min(width, 300));
        }
    }

    public static JTable createStructureTable() {
        JTable table = createResultTable();
        table.setAutoResizeMode(JTable.AUTO_RESIZE_ALL_COLUMNS);
        return table;
    }
}
