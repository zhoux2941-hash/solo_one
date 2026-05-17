package com.cloudsync.sync;

import java.io.File;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DirectoryWatcher {
    private final String directory;
    private final Map<String, Long> fileTimestamps = new ConcurrentHashMap<>();
    private final Set<String> changedFiles = ConcurrentHashMap.newKeySet();
    private volatile boolean running = false;
    private Thread watchThread;
    private FileChangeListener listener;

    public interface FileChangeListener {
        void onFilesChanged(Set<String> changedFiles);
    }

    public DirectoryWatcher(String directory) {
        this.directory = directory;
    }

    public void setFileChangeListener(FileChangeListener listener) {
        this.listener = listener;
    }

    public void start() {
        if (running) return;
        running = true;
        initializeTimestamps();
        watchThread = new Thread(this::watchLoop, "DirectoryWatcher");
        watchThread.setDaemon(true);
        watchThread.start();
    }

    public void stop() {
        running = false;
        if (watchThread != null) {
            watchThread.interrupt();
        }
    }

    private void initializeTimestamps() {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) return;
        scanDirectory(dir);
    }

    private void scanDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            String path = file.getAbsolutePath();
            fileTimestamps.put(path, file.lastModified());
            if (file.isDirectory()) {
                scanDirectory(file);
            }
        }
    }

    private void watchLoop() {
        while (running) {
            try {
                Thread.sleep(2000);
                checkChanges();
                if (!changedFiles.isEmpty() && listener != null) {
                    Set<String> copy = new HashSet<>(changedFiles);
                    changedFiles.clear();
                    listener.onFilesChanged(copy);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void checkChanges() {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) return;

        Set<String> currentPaths = new HashSet<>();
        checkDirectoryRecursive(dir, currentPaths);

        for (String oldPath : fileTimestamps.keySet()) {
            if (!currentPaths.contains(oldPath)) {
                String relative = getRelativePath(oldPath);
                if (relative != null) {
                    changedFiles.add(relative);
                }
            }
        }

        fileTimestamps.keySet().retainAll(currentPaths);
    }

    private void checkDirectoryRecursive(File dir, Set<String> currentPaths) {
        File[] files = dir.listFiles();
        if (files == null) return;

        for (File file : files) {
            String path = file.getAbsolutePath();
            currentPaths.add(path);

            Long oldTimestamp = fileTimestamps.get(path);
            long newTimestamp = file.lastModified();

            if (oldTimestamp == null || oldTimestamp != newTimestamp) {
                fileTimestamps.put(path, newTimestamp);
                String relative = getRelativePath(path);
                if (relative != null) {
                    changedFiles.add(relative);
                }
            }

            if (file.isDirectory()) {
                checkDirectoryRecursive(file, currentPaths);
            }
        }
    }

    private String getRelativePath(String absolutePath) {
        if (absolutePath.startsWith(directory)) {
            String relative = absolutePath.substring(directory.length());
            relative = relative.replace("\\", "/");
            if (relative.startsWith("/")) {
                relative = relative.substring(1);
            }
            return relative;
        }
        return null;
    }
}
