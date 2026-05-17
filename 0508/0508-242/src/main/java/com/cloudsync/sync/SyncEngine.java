package com.cloudsync.sync;

import com.cloudsync.entity.*;
import com.cloudsync.network.CloudApiClient;
import com.cloudsync.util.ConfigManager;
import com.cloudsync.util.FileUtils;

import java.io.File;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class SyncEngine {
    private static SyncEngine instance;
    private final BlockingQueue<SyncTask> taskQueue;
    private final List<SyncTask> currentTasks;
    private final SyncStats stats;
    private volatile boolean running = false;
    private volatile boolean paused = false;
    private volatile boolean stopRequested = false;
    private Thread syncThread;
    private DirectoryWatcher directoryWatcher;
    private SyncListener listener;
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);

    public interface SyncListener {
        void onTaskStarted(SyncTask task);
        void onTaskProgress(SyncTask task);
        void onTaskCompleted(SyncTask task);
        void onSyncStarted();
        void onSyncCompleted();
        void onError(String message);
    }

    private SyncEngine() {
        taskQueue = new LinkedBlockingQueue<>();
        currentTasks = Collections.synchronizedList(new ArrayList<>());
        stats = new SyncStats();
    }

    public static synchronized SyncEngine getInstance() {
        if (instance == null) {
            instance = new SyncEngine();
        }
        return instance;
    }

    public void setSyncListener(SyncListener listener) {
        this.listener = listener;
    }

    public void start() {
        if (running) return;
        running = true;
        paused = false;
        stopRequested = false;

        SyncConfig config = ConfigManager.getInstance().getConfig();
        if (config.getLocalSyncDir() != null && !config.getLocalSyncDir().isEmpty()) {
            directoryWatcher = new DirectoryWatcher(config.getLocalSyncDir());
            directoryWatcher.setFileChangeListener(files -> triggerSync());
            directoryWatcher.start();
        }

        syncThread = new Thread(this::syncLoop, "SyncEngine");
        syncThread.setDaemon(true);
        syncThread.start();

        if (listener != null) {
            listener.onSyncStarted();
        }
    }

    public void stop() {
        stopRequested = true;
        running = false;

        if (directoryWatcher != null) {
            directoryWatcher.stop();
        }

        taskQueue.clear();

        if (syncThread != null) {
            syncThread.interrupt();
            try {
                syncThread.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        syncInProgress.set(false);

        if (listener != null) {
            listener.onSyncCompleted();
        }
    }

    public void pause() {
        paused = true;
    }

    public void resume() {
        paused = false;
        synchronized (this) {
            notifyAll();
        }
    }

    public boolean isRunning() {
        return running;
    }

    public boolean isPaused() {
        return paused;
    }

    public SyncStats getStats() {
        return stats;
    }

    public List<SyncTask> getCurrentTasks() {
        return new ArrayList<>(currentTasks);
    }

    public void triggerSync() {
        synchronized (this) {
            notifyAll();
        }
    }

    private void syncLoop() {
        while (running) {
            try {
                while (paused) {
                    synchronized (this) {
                        wait();
                    }
                }

                if (!syncInProgress.get()) {
                    performSync();
                }

                SyncConfig config = ConfigManager.getInstance().getConfig();
                long interval = config.getSyncInterval();
                synchronized (this) {
                    wait(interval);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                if (listener != null) {
                    listener.onError(e.getMessage());
                }
            }
        }
    }

    private void performSync() {
        if (!syncInProgress.compareAndSet(false, true)) {
            return;
        }

        try {
            SyncConfig config = ConfigManager.getInstance().getConfig();
            if (!config.isValid()) {
                return;
            }

            CloudApiClient api = CloudApiClient.getInstance();
            api.authenticate();

            List<FileInfo> localFiles = FileUtils.scanDirectory(config.getLocalSyncDir());
            List<FileInfo> remoteFiles = api.listFiles("");

            FileComparator comparator = new FileComparator();
            FileComparator.DiffResult diff = comparator.compare(
                    localFiles, remoteFiles, config.isUploadOnly(), config.isDownloadOnly());

            taskQueue.addAll(diff.uploadTasks);
            taskQueue.addAll(diff.downloadTasks);
            taskQueue.addAll(diff.deleteTasks);

            stats.setTotalFiles(taskQueue.size());
            stats.reset();

            processTasks();

            stats.setLastSyncTime(System.currentTimeMillis());

        } catch (Exception e) {
            if (listener != null) {
                listener.onError("同步失败: " + e.getMessage());
            }
        } finally {
            syncInProgress.set(false);
        }
    }

    private void processTasks() {
        while (!taskQueue.isEmpty() && !stopRequested) {
            SyncTask task = taskQueue.poll();
            if (task == null || stopRequested) break;

            currentTasks.add(task);

            if (listener != null) {
                listener.onTaskStarted(task);
            }

            try {
                if (stopRequested) {
                    task.setStatus("已取消");
                    break;
                }
                executeTask(task);
                task.setStatus("完成");
                task.setTransferred(task.getFileSize());

                if (listener != null) {
                    listener.onTaskProgress(task);
                    listener.onTaskCompleted(task);
                }

                updateStats(task);

            } catch (InterruptedException e) {
                task.setStatus("已取消");
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                task.setStatus("失败: " + e.getMessage());
                if (listener != null) {
                    listener.onTaskProgress(task);
                    listener.onError("任务失败 " + task.getFilePath() + ": " + e.getMessage());
                }
            }

            currentTasks.remove(task);
        }
    }

    private void executeTask(SyncTask task) throws Exception {
        SyncConfig config = ConfigManager.getInstance().getConfig();
        CloudApiClient api = CloudApiClient.getInstance();
        String localPath = config.getLocalSyncDir() + "/" + task.getFilePath();
        String remotePath = task.getFilePath();

        switch (task.getSyncType()) {
            case UPLOAD_NEW:
            case UPLOAD_MODIFY:
                File localFile = new File(localPath);
                if (localFile.isDirectory()) {
                    api.createDirectory(remotePath);
                } else {
                    api.uploadFile(localPath, remotePath, transferred -> {
                        task.setTransferred(transferred);
                        stats.addTransferredBytes(transferred);
                        if (listener != null) {
                            listener.onTaskProgress(task);
                        }
                    });
                }
                break;

            case DOWNLOAD_NEW:
            case DOWNLOAD_MODIFY:
                File destFile = new File(localPath);
                File destParent = destFile.getParentFile();
                if (destParent != null && !destParent.exists()) {
                    destParent.mkdirs();
                }
                api.downloadFile(remotePath, localPath, transferred -> {
                    task.setTransferred(transferred);
                    stats.addTransferredBytes(transferred);
                    if (listener != null) {
                        listener.onTaskProgress(task);
                    }
                });
                break;

            case DELETE_LOCAL:
                FileUtils.deleteRecursively(new File(localPath));
                break;

            case DELETE_REMOTE:
                api.deleteFile(remotePath);
                break;
        }
    }

    private void updateStats(SyncTask task) {
        switch (task.getSyncType()) {
            case UPLOAD_NEW:
            case UPLOAD_MODIFY:
                stats.incrementUploaded();
                break;
            case DOWNLOAD_NEW:
            case DOWNLOAD_MODIFY:
                stats.incrementDownloaded();
                break;
            case DELETE_LOCAL:
            case DELETE_REMOTE:
                stats.incrementDeleted();
                break;
        }
    }
}
