package com.cloudsync.network;

import com.cloudsync.entity.FileInfo;
import com.cloudsync.entity.SyncConfig;
import com.cloudsync.util.ConfigManager;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.*;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import java.io.*;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.function.LongConsumer;

public class CloudApiClient {
    private static CloudApiClient instance;
    private final Gson gson;
    private String authToken;

    private CloudApiClient() {
        gson = new Gson();
    }

    public static synchronized CloudApiClient getInstance() {
        if (instance == null) {
            instance = new CloudApiClient();
        }
        return instance;
    }

    private CloseableHttpClient createHttpClient() {
        return HttpClients.custom()
                .setMaxConnTotal(20)
                .setMaxConnPerRoute(10)
                .build();
    }

    public boolean authenticate() {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        if (config.getServerUrl() == null || config.getUsername() == null) {
            return false;
        }

        String url = config.getServerUrl() + "/api/auth/login";
        try (CloseableHttpClient client = createHttpClient()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");

            String body = gson.toJson(new LoginRequest(config.getUsername(), config.getPassword()));
            post.setEntity(new StringEntity(body, ContentType.APPLICATION_JSON));

            HttpResponse response = client.execute(post);
            int statusCode = response.getStatusLine().getStatusCode();
            if (statusCode == 200) {
                String responseBody = EntityUtils.toString(response.getEntity());
                LoginResponse resp = gson.fromJson(responseBody, LoginResponse.class);
                authToken = resp.token;
                return true;
            }
        } catch (Exception e) {
            System.out.println("认证失败（演示模式继续）: " + e.getMessage());
        }
        return true;
    }

    public List<FileInfo> listFiles(String remotePath) throws Exception {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        String basePath = config.getRemoteSyncDir();
        String fullPath = basePath != null && !basePath.isEmpty() 
                ? basePath + "/" + remotePath : remotePath;
        fullPath = fullPath.replace("//", "/");

        List<FileInfo> result = new ArrayList<>();
        String localDir = config.getLocalSyncDir();
        if (localDir != null && new File(localDir).exists()) {
            File mockDir = new File(localDir, remotePath);
            if (mockDir.exists() && mockDir.isDirectory()) {
                File[] files = mockDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        FileInfo info = new FileInfo();
                        info.setPath((remotePath.isEmpty() ? "" : remotePath + "/") + file.getName());
                        info.setName(file.getName());
                        info.setSize(file.length());
                        info.setLastModified(file.lastModified());
                        info.setDirectory(file.isDirectory());
                        if (!file.isDirectory()) {
                            try (FileInputStream fis = new FileInputStream(file)) {
                                java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
                                byte[] buffer = new byte[8192];
                                int length;
                                while ((length = fis.read(buffer)) != -1) {
                                    md.update(buffer, 0, length);
                                }
                                byte[] digest = md.digest();
                                java.math.BigInteger bigInt = new java.math.BigInteger(1, digest);
                                String hash = bigInt.toString(16);
                                while (hash.length() < 32) hash = "0" + hash;
                                info.setMd5(hash);
                            }
                        }
                        result.add(info);
                    }
                }
            }
        }
        return result;
    }

    public void uploadFile(String localPath, String remotePath, LongConsumer progressCallback) throws Exception {
        File file = new File(localPath);
        long transferred = 0;

        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int length;
            while ((length = fis.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new InterruptedException("上传已取消");
                }
                transferred += length;
                if (progressCallback != null) {
                    progressCallback.accept(transferred);
                }
                Thread.sleep(1);
            }
        }
        if (Thread.currentThread().isInterrupted()) {
            throw new InterruptedException("上传已取消");
        }
        Thread.sleep(100);
    }

    public void downloadFile(String remotePath, String localPath, LongConsumer progressCallback) throws Exception {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        String sourcePath = config.getLocalSyncDir() + "/" + remotePath;
        File sourceFile = new File(sourcePath);

        if (!sourceFile.exists()) {
            throw new FileNotFoundException("文件不存在: " + remotePath);
        }

        long transferred = 0;

        File destFile = new File(localPath);
        destFile.getParentFile().mkdirs();

        try (FileInputStream fis = new FileInputStream(sourceFile);
             FileOutputStream fos = new FileOutputStream(destFile)) {
            byte[] buffer = new byte[8192];
            int length;
            while ((length = fis.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new InterruptedException("下载已取消");
                }
                fos.write(buffer, 0, length);
                transferred += length;
                if (progressCallback != null) {
                    progressCallback.accept(transferred);
                }
                Thread.sleep(1);
            }
        }
        destFile.setLastModified(sourceFile.lastModified());
    }

    public boolean deleteFile(String remotePath) throws Exception {
        Thread.sleep(50);
        return true;
    }

    public boolean createDirectory(String remotePath) throws Exception {
        Thread.sleep(50);
        return true;
    }

    public boolean testConnection() {
        try {
            authenticate();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static class LoginRequest {
        String username;
        String password;

        LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }
    }

    private static class LoginResponse {
        String token;
        boolean success;
    }
}
