package com.dbtool.util;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public class ConfigManager {
    private static final String CONFIG_DIR = System.getProperty("user.home") + File.separator + ".dbquerytool";
    private static final String CONFIG_FILE = CONFIG_DIR + File.separator + "config.properties";
    private static final String FAVORITES_FILE = CONFIG_DIR + File.separator + "favorites.txt";

    private static Properties properties;

    static {
        initConfigDir();
        loadConfig();
    }

    private static void initConfigDir() {
        File dir = new File(CONFIG_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    private static void loadConfig() {
        properties = new Properties();
        File file = new File(CONFIG_FILE);
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                properties.load(fis);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private static void saveConfig() {
        try (FileOutputStream fos = new FileOutputStream(CONFIG_FILE)) {
            properties.store(fos, "DB Query Tool Configuration");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void saveConnectionConfig(String dbType, String dbPath, String user) {
        properties.setProperty("last.dbtype", dbType);
        properties.setProperty("last.dbpath", dbPath);
        if (user != null) {
            properties.setProperty("last.user", user);
        }
        saveConfig();
    }

    public static String getLastDbType() {
        return properties.getProperty("last.dbtype", "");
    }

    public static String getLastDbPath() {
        return properties.getProperty("last.dbpath", "");
    }

    public static String getLastUser() {
        return properties.getProperty("last.user", "");
    }

    public static void addFavorite(String name, String sql) {
        List<FavoriteItem> favorites = getFavorites();
        favorites.add(new FavoriteItem(name, sql));
        saveFavorites(favorites);
    }

    public static void removeFavorite(int index) {
        List<FavoriteItem> favorites = getFavorites();
        if (index >= 0 && index < favorites.size()) {
            favorites.remove(index);
            saveFavorites(favorites);
        }
    }

    public static List<FavoriteItem> getFavorites() {
        List<FavoriteItem> favorites = new ArrayList<>();
        File file = new File(FAVORITES_FILE);
        if (file.exists()) {
            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                while ((line = br.readLine()) != null) {
                    String[] parts = line.split("\\|\\|", 2);
                    if (parts.length == 2) {
                        favorites.add(new FavoriteItem(parts[0], parts[1].replace("\\n", "\n")));
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return favorites;
    }

    private static void saveFavorites(List<FavoriteItem> favorites) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(FAVORITES_FILE))) {
            for (FavoriteItem item : favorites) {
                String sql = item.getSql().replace("\n", "\\n");
                bw.write(item.getName() + "||" + sql);
                bw.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static class FavoriteItem {
        private String name;
        private String sql;

        public FavoriteItem(String name, String sql) {
            this.name = name;
            this.sql = sql;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSql() { return sql; }
        public void setSql(String sql) { this.sql = sql; }
    }
}
