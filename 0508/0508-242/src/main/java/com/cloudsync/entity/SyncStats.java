package com.cloudsync.entity;

public class SyncStats {
    private long totalFiles;
    private long uploadedFiles;
    private long downloadedFiles;
    private long deletedFiles;
    private long totalBytes;
    private long transferredBytes;
    private long startTime;
    private long lastSyncTime;

    public SyncStats() {
        reset();
    }

    public void reset() {
        totalFiles = 0;
        uploadedFiles = 0;
        downloadedFiles = 0;
        deletedFiles = 0;
        totalBytes = 0;
        transferredBytes = 0;
        startTime = System.currentTimeMillis();
    }

    public void incrementUploaded() { uploadedFiles++; }
    public void incrementDownloaded() { downloadedFiles++; }
    public void incrementDeleted() { deletedFiles++; }
    public void addTransferredBytes(long bytes) { transferredBytes += bytes; }

    public double getSpeed() {
        long elapsed = System.currentTimeMillis() - startTime;
        if (elapsed == 0) return 0;
        return (transferredBytes * 1000.0) / elapsed;
    }

    public long getTotalFiles() { return totalFiles; }
    public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }
    public long getUploadedFiles() { return uploadedFiles; }
    public long getDownloadedFiles() { return downloadedFiles; }
    public long getDeletedFiles() { return deletedFiles; }
    public long getTotalBytes() { return totalBytes; }
    public void setTotalBytes(long totalBytes) { this.totalBytes = totalBytes; }
    public long getTransferredBytes() { return transferredBytes; }
    public long getLastSyncTime() { return lastSyncTime; }
    public void setLastSyncTime(long lastSyncTime) { this.lastSyncTime = lastSyncTime; }
}
