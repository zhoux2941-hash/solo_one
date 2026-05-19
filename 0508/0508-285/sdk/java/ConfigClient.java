package com.configcenter.sdk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

public class ConfigClient {
    private final String serverUrl;
    private final String appId;
    private final String namespace;
    private final String environment;
    private final Map<String, String> tags;
    private final Map<String, Object> configs;
    private final Map<String, Long> versions;
    private final List<Consumer<Map<String, Object>>> callbacks;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private volatile boolean running;

    public ConfigClient(String serverUrl, String appId, String namespace, String environment) {
        this.serverUrl = serverUrl;
        this.appId = appId;
        this.namespace = namespace;
        this.environment = environment;
        this.tags = new HashMap<>();
        this.configs = new HashMap<>();
        this.versions = new HashMap<>();
        this.callbacks = new CopyOnWriteArrayList<>();
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(40, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public void addTag(String key, String value) {
        tags.put(key, value);
    }

    public void onChange(Consumer<Map<String, Object>> callback) {
        callbacks.add(callback);
    }

    public Object get(String key) {
        synchronized (configs) {
            return configs.get(key);
        }
    }

    public String getString(String key) {
        Object val = get(key);
        return val != null ? val.toString() : null;
    }

    public Map<String, Object> getAll() {
        synchronized (configs) {
            return new HashMap<>(configs);
        }
    }

    public void start() throws IOException {
        fetchConfigs();
        running = true;
        new Thread(this::pollLoop).start();
    }

    public void stop() {
        running = false;
    }

    private void fetchConfigs() throws IOException {
        String url = String.format("%s/api/v1/configs?app_id=%s&namespace=%s&environment=%s",
                serverUrl, appId, namespace, environment);

        Request.Builder reqBuilder = new Request.Builder().url(url);
        for (Map.Entry<String, String> tag : tags.entrySet()) {
            reqBuilder.header("X-Tag-" + tag.getKey(), tag.getValue());
        }

        try (Response response = httpClient.newCall(reqBuilder.build()).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code());
            }

            List<ConfigItem> items = objectMapper.readValue(
                    response.body().string(),
                    new TypeReference<List<ConfigItem>>() {}
            );

            boolean changed = false;
            synchronized (configs) {
                for (ConfigItem item : items) {
                    Object parsed = parseValue(item.value, item.format);
                    configs.put(item.key, parsed);
                    versions.put(item.key, item.version);
                    changed = true;
                }
            }

            if (changed && !callbacks.isEmpty()) {
                Map<String, Object> snapshot = getAll();
                for (Consumer<Map<String, Object>> cb : callbacks) {
                    new Thread(() -> cb.accept(snapshot)).start();
                }
            }
        }
    }

    private Object parseValue(String value, String format) {
        try {
            if ("json".equals(format)) {
                return objectMapper.readValue(value, new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception e) {
            // ignore
        }
        Map<String, Object> raw = new HashMap<>();
        raw.put("raw", value);
        return raw;
    }

    private void pollLoop() {
        while (running) {
            try {
                longPoll();
            } catch (Exception e) {
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void longPoll() throws IOException {
        Map<String, Long> versionsCopy;
        synchronized (configs) {
            versionsCopy = new HashMap<>(versions);
        }

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("app_id", appId);
        reqBody.put("namespace", namespace);
        reqBody.put("environment", environment);
        reqBody.put("last_version", versionsCopy);
        reqBody.put("tags", tags);

        String url = serverUrl + "/api/v1/long-poll";
        RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(reqBody),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.code() == 304) {
                return;
            }
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code());
            }

            Map<String, Object> newConfigs = objectMapper.readValue(
                    response.body().string(),
                    new TypeReference<Map<String, Object>>() {}
            );

            synchronized (configs) {
                configs.putAll(newConfigs);
            }

            Map<String, Object> snapshot = getAll();
            for (Consumer<Map<String, Object>> cb : callbacks) {
                new Thread(() -> cb.accept(snapshot)).start();
            }
        }
    }

    private static class ConfigItem {
        public String key;
        public String value;
        public String format;
        public long version;
    }
}
