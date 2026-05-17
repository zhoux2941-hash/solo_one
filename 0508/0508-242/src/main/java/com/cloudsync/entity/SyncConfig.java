package com.cloudsync.entity;

public class SyncConfig {
    private String serverUrl;
    private String username;
    private String password;
    private String localSyncDir;
    private String remoteSyncDir;
    private long syncInterval = 30000;
    private boolean autoStart = true;
    private boolean uploadOnly = false;
    private boolean downloadOnly = false;

    public SyncConfig() {}

    public String getServerUrl() { return serverUrl; }
    public void setServerUrl(String serverUrl) { this.serverUrl = serverUrl; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getLocalSyncDir() { return localSyncDir; }
    public void setLocalSyncDir(String localSyncDir) { this.localSyncDir = localSyncDir; }
    public String getRemoteSyncDir() { return remoteSyncDir; }
    public void setRemoteSyncDir(String remoteSyncDir) { this.remoteSyncDir = remoteSyncDir; }
    public long getSyncInterval() { return syncInterval; }
    public void setSyncInterval(long syncInterval) { this.syncInterval = syncInterval; }
    public boolean isAutoStart() { return autoStart; }
    public void setAutoStart(boolean autoStart) { this.autoStart = autoStart; }
    public boolean isUploadOnly() { return uploadOnly; }
    public void setUploadOnly(boolean uploadOnly) { this.uploadOnly = uploadOnly; }
    public boolean isDownloadOnly() { return downloadOnly; }
    public void setDownloadOnly(boolean downloadOnly) { this.downloadOnly = downloadOnly; }

    public boolean isValid() {
        return serverUrl != null && !serverUrl.isEmpty() &&
               localSyncDir != null && !localSyncDir.isEmpty();
    }
}
