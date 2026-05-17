package com.dbtool.util;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SQLExecutor {
    public static QueryResult executeQuery(String sql) throws SQLException {
        if (!DBConnectionUtil.isConnected()) {
            throw new SQLException("数据库未连接");
        }

        Connection conn = DBConnectionUtil.getConnection();
        Statement stmt = null;
        ResultSet rs = null;

        try {
            stmt = conn.createStatement();
            boolean hasResultSet = stmt.execute(sql);

            QueryResult result = new QueryResult();

            if (hasResultSet) {
                rs = stmt.getResultSet();
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();

                for (int i = 1; i <= columnCount; i++) {
                    result.addColumn(metaData.getColumnName(i));
                }

                while (rs.next()) {
                    Object[] row = new Object[columnCount];
                    for (int i = 1; i <= columnCount; i++) {
                        row[i - 1] = rs.getObject(i);
                    }
                    result.addRow(row);
                }
            } else {
                result.setUpdateCount(stmt.getUpdateCount());
            }

            return result;
        } finally {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
        }
    }

    public static List<String> getTableNames() throws SQLException {
        if (!DBConnectionUtil.isConnected()) {
            throw new SQLException("数据库未连接");
        }

        Connection conn = DBConnectionUtil.getConnection();
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet rs = null;
        List<String> tables = new ArrayList<>();

        try {
            String dbType = DBConnectionUtil.getCurrentDbType();
            String[] types = {"TABLE"};

            if ("H2".equals(dbType)) {
                rs = metaData.getTables(null, "PUBLIC", "%", types);
            } else {
                rs = metaData.getTables(null, null, "%", types);
            }

            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }

            return tables;
        } finally {
            if (rs != null) rs.close();
        }
    }

    public static List<TableColumn> getTableStructure(String tableName) throws SQLException {
        if (!DBConnectionUtil.isConnected()) {
            throw new SQLException("数据库未连接");
        }

        Connection conn = DBConnectionUtil.getConnection();
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet rs = null;
        List<TableColumn> columns = new ArrayList<>();

        try {
            String dbType = DBConnectionUtil.getCurrentDbType();
            String schema = null;

            if ("H2".equals(dbType)) {
                schema = "PUBLIC";
            }

            rs = metaData.getColumns(null, schema, tableName, null);

            while (rs.next()) {
                TableColumn col = new TableColumn();
                col.setName(rs.getString("COLUMN_NAME"));
                col.setType(rs.getString("TYPE_NAME"));
                col.setSize(rs.getInt("COLUMN_SIZE"));
                col.setNullable(rs.getInt("NULLABLE") == DatabaseMetaData.columnNullable);
                col.setDefaultValue(rs.getString("COLUMN_DEF"));
                columns.add(col);
            }

            return columns;
        } finally {
            if (rs != null) rs.close();
        }
    }

    public static class QueryResult {
        private List<String> columns = new ArrayList<>();
        private List<Object[]> rows = new ArrayList<>();
        private int updateCount = -1;

        public void addColumn(String column) {
            columns.add(column);
        }

        public void addRow(Object[] row) {
            rows.add(row);
        }

        public List<String> getColumns() {
            return columns;
        }

        public List<Object[]> getRows() {
            return rows;
        }

        public int getUpdateCount() {
            return updateCount;
        }

        public void setUpdateCount(int updateCount) {
            this.updateCount = updateCount;
        }

        public boolean hasResults() {
            return !columns.isEmpty();
        }
    }

    public static class TableColumn {
        private String name;
        private String type;
        private int size;
        private boolean nullable;
        private String defaultValue;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public boolean isNullable() { return nullable; }
        public void setNullable(boolean nullable) { this.nullable = nullable; }
        public String getDefaultValue() { return defaultValue; }
        public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }
    }
}
