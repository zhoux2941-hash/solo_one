package com.dbtool.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnectionUtil {
    private static Connection currentConnection;
    private static String currentDbType;
    private static String currentDbPath;

    public static boolean connectH2(String dbPath, String user, String password) throws SQLException {
        closeConnection();
        String url = "jdbc:h2:" + dbPath;
        currentConnection = DriverManager.getConnection(url, user, password);
        currentDbType = "H2";
        currentDbPath = dbPath;
        return currentConnection != null && !currentConnection.isClosed();
    }

    public static boolean connectSQLite(String dbPath) throws SQLException {
        closeConnection();
        String url = "jdbc:sqlite:" + dbPath;
        currentConnection = DriverManager.getConnection(url);
        currentDbType = "SQLite";
        currentDbPath = dbPath;
        return currentConnection != null && !currentConnection.isClosed();
    }

    public static Connection getConnection() {
        return currentConnection;
    }

    public static String getCurrentDbType() {
        return currentDbType;
    }

    public static String getCurrentDbPath() {
        return currentDbPath;
    }

    public static boolean isConnected() {
        try {
            return currentConnection != null && !currentConnection.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }

    public static void closeConnection() {
        if (currentConnection != null) {
            try {
                currentConnection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
            currentConnection = null;
            currentDbType = null;
            currentDbPath = null;
        }
    }
}
