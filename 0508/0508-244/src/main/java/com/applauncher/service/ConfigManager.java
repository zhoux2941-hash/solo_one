package com.applauncher.service;

import com.applauncher.model.Configuration;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.*;
import java.nio.charset.StandardCharsets;

public class ConfigManager {
    private static ConfigManager instance;
    private static final String CONFIG_FILE_NAME = "applauncher_config.json";
    
    private Configuration configuration;
    private Gson gson;
    private String configPath;

    private ConfigManager() {
        this.gson = new GsonBuilder()
                .setPrettyPrinting()
                .create();
        this.configPath = getDefaultConfigPath();
        loadConfiguration();
    }

    public static synchronized ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();
        }
        return instance;
    }

    private String getDefaultConfigPath() {
        String userHome = System.getProperty("user.home");
        File configDir = new File(userHome, ".applauncher");
        if (!configDir.exists()) {
            configDir.mkdirs();
        }
        return new File(configDir, CONFIG_FILE_NAME).getAbsolutePath();
    }

    public void loadConfiguration() {
        File configFile = new File(configPath);
        if (configFile.exists()) {
            try (Reader reader = new InputStreamReader(
                    new FileInputStream(configFile), StandardCharsets.UTF_8)) {
                configuration = gson.fromJson(reader, Configuration.class);
            } catch (IOException e) {
                System.err.println("加载配置失败: " + e.getMessage());
                configuration = new Configuration();
            }
        } else {
            configuration = new Configuration();
        }
        
        if (configuration.getGroups().isEmpty()) {
            configuration.initializeDefaultGroups();
        }
    }

    public void saveConfiguration() {
        configuration.updateModified();
        File configFile = new File(configPath);
        try (Writer writer = new OutputStreamWriter(
                new FileOutputStream(configFile), StandardCharsets.UTF_8)) {
            gson.toJson(configuration, writer);
        } catch (IOException e) {
            System.err.println("保存配置失败: " + e.getMessage());
        }
    }

    public Configuration getConfiguration() {
        return configuration;
    }

    public void setConfiguration(Configuration configuration) {
        this.configuration = configuration;
    }

    public String getConfigPath() {
        return configPath;
    }

    public void setConfigPath(String configPath) {
        this.configPath = configPath;
    }

    public void exportConfiguration(String exportPath) {
        File exportFile = new File(exportPath);
        try (Writer writer = new OutputStreamWriter(
                new FileOutputStream(exportFile), StandardCharsets.UTF_8)) {
            gson.toJson(configuration, writer);
        } catch (IOException e) {
            System.err.println("导出配置失败: " + e.getMessage());
        }
    }

    public void importConfiguration(String importPath) {
        File importFile = new File(importPath);
        if (importFile.exists()) {
            try (Reader reader = new InputStreamReader(
                    new FileInputStream(importFile), StandardCharsets.UTF_8)) {
                configuration = gson.fromJson(reader, Configuration.class);
                saveConfiguration();
            } catch (IOException e) {
                System.err.println("导入配置失败: " + e.getMessage());
            }
        }
    }
}
