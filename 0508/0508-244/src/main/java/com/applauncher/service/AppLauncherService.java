package com.applauncher.service;

import com.applauncher.model.Application;
import com.applauncher.model.AppGroup;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AppLauncherService {
    private static AppLauncherService instance;
    private static final int LAUNCH_INTERVAL = 1000;
    private static final int MAX_RETRY = 3;
    private final Map<String, Long> lastLaunchTime = new ConcurrentHashMap<>();

    private AppLauncherService() {
    }

    public static synchronized AppLauncherService getInstance() {
        if (instance == null) {
            instance = new AppLauncherService();
        }
        return instance;
    }

    public boolean launchApplication(Application app) {
        if (app == null || app.getPath() == null) {
            System.err.println("应用或路径为空");
            return false;
        }

        String path = app.getPath();
        File appFile = new File(path);
        
        if (!appFile.exists()) {
            System.err.println("文件不存在: " + path);
            return false;
        }

        System.out.println("正在启动: " + app.getName() + " -> " + path);
        
        boolean success = false;
        for (int retry = 0; retry < MAX_RETRY && !success; retry++) {
            if (retry > 0) {
                System.out.println("重试启动 (第" + (retry + 1) + "次): " + app.getName());
                try {
                    Thread.sleep(300);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            success = launchWithRuntime(path);
        }

        if (success) {
            app.incrementLaunchCount();
            ConfigManager.getInstance().saveConfiguration();
            lastLaunchTime.put(path, System.currentTimeMillis());
            System.out.println("启动成功: " + app.getName());
        } else {
            System.err.println("启动失败: " + app.getName());
        }

        return success;
    }

    private boolean launchWithRuntime(String path) {
        try {
            File file = new File(path);
            String lowerPath = path.toLowerCase();
            
            ProcessBuilder processBuilder;
            String workingDir = file.getParent();
            if (workingDir == null || workingDir.isEmpty()) {
                workingDir = System.getProperty("user.home");
            }

            if (lowerPath.endsWith(".lnk")) {
                processBuilder = new ProcessBuilder("cmd", "/c", "start", "/wait", "\"\"", path);
            } else if (file.isDirectory()) {
                processBuilder = new ProcessBuilder("explorer.exe", path);
            } else if (isOfficeDocument(path)) {
                processBuilder = new ProcessBuilder("cmd", "/c", "start", "\"\"", "/b", path);
            } else if (isBrowser(path)) {
                processBuilder = new ProcessBuilder("cmd", "/c", "start", "\"\"", path);
            } else {
                processBuilder = new ProcessBuilder("cmd", "/c", "start", "\"\"", path);
            }
            
            processBuilder.directory(new File(workingDir));
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            try {
                process.waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            return true;
        } catch (IOException e) {
            System.err.println("启动失败: " + e.getMessage());
            return false;
        }
    }

    private boolean isOfficeDocument(String path) {
        String lower = path.toLowerCase();
        return lower.endsWith(".doc") || lower.endsWith(".docx") ||
               lower.endsWith(".xls") || lower.endsWith(".xlsx") ||
               lower.endsWith(".ppt") || lower.endsWith(".pptx") ||
               lower.endsWith(".pdf");
    }

    private boolean isBrowser(String path) {
        String lower = path.toLowerCase();
        return lower.contains("chrome") || lower.contains("firefox") ||
               lower.contains("edge") || lower.contains("browser") ||
               lower.contains("quark") || lower.contains("夸克");
    }

    public void launchGroupApplications(AppGroup group) {
        if (group == null) {
            return;
        }
        
        List<Application> apps = group.getApplications();
        System.out.println("========== 开始批量启动，共" + apps.size() + "个应用 ==========");
        
        for (int i = 0; i < apps.size(); i++) {
            Application app = apps.get(i);
            System.out.println("[" + (i + 1) + "/" + apps.size() + "] " + app.getName());
            launchApplication(app);
            
            if (i < apps.size() - 1) {
                try {
                    Thread.sleep(LAUNCH_INTERVAL);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    System.err.println("批量启动被中断");
                    break;
                }
            }
        }
        
        System.out.println("========== 批量启动完成 ==========");
    }

    public void launchMultipleApplications(List<Application> apps) {
        if (apps == null || apps.isEmpty()) {
            return;
        }
        
        System.out.println("========== 开始启动选中应用，共" + apps.size() + "个 ==========");
        
        for (int i = 0; i < apps.size(); i++) {
            Application app = apps.get(i);
            System.out.println("[" + (i + 1) + "/" + apps.size() + "] " + app.getName());
            launchApplication(app);
            
            if (i < apps.size() - 1) {
                try {
                    Thread.sleep(LAUNCH_INTERVAL);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    System.err.println("启动被中断");
                    break;
                }
            }
        }
        
        System.out.println("========== 启动选中应用完成 ==========");
    }

    public boolean isExecutableFile(String path) {
        if (path == null) {
            return false;
        }
        String lowerPath = path.toLowerCase();
        return lowerPath.endsWith(".exe") || 
               lowerPath.endsWith(".lnk") ||
               lowerPath.endsWith(".bat") ||
               lowerPath.endsWith(".cmd") ||
               lowerPath.endsWith(".com");
    }

    public String extractFileName(String path) {
        if (path == null) {
            return "";
        }
        File file = new File(path);
        String name = file.getName();
        int lastDot = name.lastIndexOf('.');
        if (lastDot > 0) {
            return name.substring(0, lastDot);
        }
        return name;
    }
}
