package com.cloudsync.entity;

public class SyncTask {
    public enum SyncType {
        UPLOAD_NEW,
        UPLOAD_MODIFY,
        DOWNLOAD_NEW,
        DOWNLOAD_MODIFY,
        DELETE_LOCAL,
        DELETE_REMOTE
    }

    private String filePath;
    private SyncType syncType;
    private long fileSize;
    private long transferred;
    private int progress;
    private String status;

    public SyncTask(String filePath, SyncType syncType, long fileSize) {
        this.filePath = filePath;
        this.syncType = syncType;
        this.fileSize = fileSize;
        this.progress = 0;
        this.status = "等待中";
    }

    public String getFilePath() { return filePath; }
    public SyncType getSyncType() { return syncType; }
    public long getFileSize() { return fileSize; }
    public long getTransferred() { return transferred; }
    public void setTransferred(long transferred) {
        this.transferred = transferred;
        this.progress = fileSize > 0 ? (int) ((transferred * 100) / fileSize) : 100;
    }
    public int getProgress() { return progress; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSyncTypeName() {
        switch (syncType) {
            case UPLOAD_NEW: return "新增上传";
            case UPLOAD_MODIFY: return "修改上传";
            case DOWNLOAD_NEW: return "新增下载";
            case DOWNLOAD_MODIFY: return "修改下载";
            case DELETE_LOCAL: return "本地删除";
            case DELETE_REMOTE: return "云端删除";
            default: return "未知";
        }
    }
}
