package com.cloudsync.util;

import com.cloudsync.entity.SyncConfig;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.*;
import java.nio.charset.StandardCharsets;

public class ConfigManager {
    private static final String CONFIG_FILE = "sync_config.json";
    private static ConfigManager instance;
    private SyncConfig config;
    private Gson gson;

    private ConfigManager() {
        gson = new GsonBuilder().setPrettyPrinting().create();
        loadConfig();
    }

    public static synchronized ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();
        }
        return instance;
    }

    public synchronized SyncConfig getConfig() {
        if (config == null) {
            config = new SyncConfig();
        }
        return config;
    }

    public synchronized void setConfig(SyncConfig config) {
        this.config = config;
        saveConfig();
    }

    public synchronized void saveConfig() {
        if (config == null) {
            config = new SyncConfig();
        }
        try (Writer writer = new OutputStreamWriter(new FileOutputStream(CONFIG_FILE), StandardCharsets.UTF_8)) {
            gson.toJson(config, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private synchronized void loadConfig() {
        File file = new File(CONFIG_FILE);
        if (!file.exists()) {
            config = new SyncConfig();
            return;
        }
        try (Reader reader = new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8)) {
            config = gson.fromJson(reader, SyncConfig.class);
        } catch (IOException e) {
            e.printStackTrace();
            config = new SyncConfig();
        }
        if (config == null) {
            config = new SyncConfig();
        }
    }
}
