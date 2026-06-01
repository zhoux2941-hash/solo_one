package com.monitor.kernel;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleException;
import java.io.File;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;

public class DropinsWatcher {
    private final BundleContext bundleContext;
    private final File dropinsDir;
    private Thread watcherThread;
    private volatile boolean running = false;
    private final Map<String, Long> installedBundles = new HashMap<>();

    public DropinsWatcher(BundleContext context) {
        this.bundleContext = context;
        String dropinsPath = context.getProperty("monitor.dropins.path");
        if (dropinsPath == null) dropinsPath = "./dropins";
        this.dropinsDir = new File(dropinsPath);
    }

    public void start() {
        if (!dropinsDir.exists()) {
            dropinsDir.mkdirs();
        }
        running = true;
        scanAndInstall();
        watcherThread = new Thread(this::watchLoop, "dropins-watcher");
        watcherThread.setDaemon(true);
        watcherThread.start();
        System.out.println("[DROPINS] Watching directory: " + dropinsDir.getAbsolutePath());
    }

    public void stop() {
        running = false;
        if (watcherThread != null) {
            watcherThread.interrupt();
        }
    }

    private void scanAndInstall() {
        File[] jars = dropinsDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jars == null) return;
        for (File jar : jars) {
            installOrUpdate(jar);
        }
    }

    private void installOrUpdate(File jarFile) {
        String path = jarFile.getAbsolutePath();
        try {
            Long existingId = installedBundles.get(path);
            if (existingId != null) {
                Bundle bundle = bundleContext.getBundle(existingId);
                if (bundle != null) {
                    bundle.update();
                    System.out.println("[DROPINS] Updated bundle: " + bundle.getSymbolicName());
                    return;
                }
            }
            Bundle bundle = bundleContext.installBundle("file:" + path);
            installedBundles.put(path, bundle.getBundleId());
            bundle.start();
            System.out.println("[DROPINS] Installed and started bundle: " + bundle.getSymbolicName() +
                " (ID=" + bundle.getBundleId() + ")");
        } catch (BundleException e) {
            System.err.println("[DROPINS] Failed to install/update " + path + ": " + e.getMessage());
        }
    }

    private void watchLoop() {
        try {
            WatchService watchService = FileSystems.getDefault().newWatchService();
            Path dropinsPath = dropinsDir.toPath();
            dropinsPath.register(watchService, StandardWatchEventKinds.ENTRY_CREATE,
                StandardWatchEventKinds.ENTRY_MODIFY);
            while (running) {
                WatchKey key = watchService.take();
                for (WatchEvent<?> event : key.pollEvents()) {
                    WatchEvent.Kind<?> kind = event.kind();
                    if (kind == StandardWatchEventKinds.OVERFLOW) continue;
                    Path fileName = (Path) event.context();
                    if (fileName.toString().endsWith(".jar")) {
                        File jarFile = new File(dropinsDir, fileName.toString());
                        Thread.sleep(500);
                        if (jarFile.exists()) {
                            installOrUpdate(jarFile);
                        }
                    }
                }
                key.reset();
            }
            watchService.close();
        } catch (InterruptedException ignored) {
        } catch (Exception e) {
            System.err.println("[DROPINS] Watcher error: " + e.getMessage());
        }
    }
}
