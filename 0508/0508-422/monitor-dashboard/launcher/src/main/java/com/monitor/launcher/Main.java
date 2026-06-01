package com.monitor.launcher;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleException;
import org.osgi.framework.Constants;
import org.osgi.framework.launch.Framework;
import org.osgi.framework.launch.FrameworkFactory;
import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ServiceLoader;

public class Main {
    private static final String[][] FELIX_SERVICE_BUNDLES = {
        {"org.apache.felix.eventadmin", "https://repo1.maven.org/maven2/org/apache/felix/org.apache.felix.eventadmin/1.1.8/org.apache.felix.eventadmin-1.1.8.jar"},
        {"org.apache.felix.configadmin", "https://repo1.maven.org/maven2/org/apache/felix/org.apache.felix.configadmin/1.9.26/org.apache.felix.configadmin-1.9.26.jar"},
        {"org.apache.felix.log", "https://repo1.maven.org/maven2/org/apache/felix/org.apache.felix.log/1.2.6/org.apache.felix.log-1.2.6.jar"}
    };

    private static final String[] PROJECT_BUNDLE_ORDER = {
        "com.monitor.api",
        "com.monitor.kernel",
        "com.monitor.plugin.cpu",
        "com.monitor.plugin.memory",
        "com.monitor.plugin.disk"
    };

    public static void main(String[] args) throws Exception {
        String baseDir = System.getProperty("monitor.basedir", ".");
        String bundlesPath = baseDir + File.separator + "bundles";
        String dropinsPath = baseDir + File.separator + "dropins";

        File bundleDir = new File(bundlesPath);
        if (!bundleDir.exists()) bundleDir.mkdirs();
        File dropinsDir = new File(dropinsPath);
        if (!dropinsDir.exists()) dropinsDir.mkdirs();

        ensureFelixBundles(bundleDir);

        Map<String, String> config = new HashMap<>();
        config.put(Constants.FRAMEWORK_STORAGE, baseDir + File.separator + "felix-cache");
        config.put(Constants.FRAMEWORK_SYSTEMPACKAGES_EXTRA,
            "com.monitor.api;version=1.0.0");
        config.put("monitor.db.path", baseDir + File.separator + "monitor_config");
        config.put("monitor.dropins.path", dropinsPath);

        FrameworkFactory frameworkFactory = ServiceLoader.load(FrameworkFactory.class).iterator().next();
        Framework framework = frameworkFactory.newFramework(config);
        framework.start();

        BundleContext context = framework.getBundleContext();
        List<Bundle> installedBundles = new ArrayList<>();

        for (String[] bundleInfo : FELIX_SERVICE_BUNDLES) {
            Bundle bundle = installBundleFromDir(context, bundleDir, bundleInfo[0]);
            if (bundle != null) installedBundles.add(bundle);
        }

        for (String symbolicName : PROJECT_BUNDLE_ORDER) {
            Bundle bundle = installBundleFromDir(context, bundleDir, symbolicName);
            if (bundle != null) installedBundles.add(bundle);
        }

        for (Bundle bundle : installedBundles) {
            try {
                bundle.start();
                System.out.println("[LAUNCHER] Started bundle: " + bundle.getSymbolicName() +
                    " (ID=" + bundle.getBundleId() + ")");
            } catch (BundleException e) {
                System.err.println("[LAUNCHER] Failed to start bundle: " +
                    bundle.getSymbolicName() + " - " + e.getMessage());
            }
        }

        System.out.println("==============================================");
        System.out.println("  Monitor Dashboard is running.");
        System.out.println("  Bundles dir:  " + bundleDir.getAbsolutePath());
        System.out.println("  Dropins dir:  " + dropinsDir.getAbsolutePath());
        System.out.println("  Drop plugin JARs into dropins for auto-install.");
        System.out.println("  Press Ctrl+C to stop.");
        System.out.println("==============================================");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("[LAUNCHER] Shutting down...");
            try {
                framework.stop();
                framework.waitForStop(5000);
            } catch (Exception e) {
                System.err.println("[LAUNCHER] Shutdown error: " + e.getMessage());
            }
        }));

        framework.waitForStop(0);
    }

    private static void ensureFelixBundles(File bundleDir) {
        for (String[] bundleInfo : FELIX_SERVICE_BUNDLES) {
            String symbolicName = bundleInfo[0];
            String downloadUrl = bundleInfo[1];
            String fileName = symbolicName + ".jar";
            File targetFile = new File(bundleDir, fileName);
            boolean found = false;
            File[] existing = bundleDir.listFiles((dir, name) -> name.endsWith(".jar"));
            if (existing != null) {
                for (File f : existing) {
                    if (f.getName().contains(symbolicName.replace(".", "-")) ||
                        f.getName().contains(symbolicName)) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                System.out.println("[LAUNCHER] Downloading " + symbolicName + "...");
                try {
                    URL url = new URL(downloadUrl);
                    try (InputStream is = url.openStream()) {
                        Files.copy(is, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    }
                    System.out.println("[LAUNCHER] Downloaded: " + fileName);
                } catch (Exception e) {
                    System.err.println("[LAUNCHER] Failed to download " + symbolicName +
                        ": " + e.getMessage());
                    System.err.println("[LAUNCHER] Please manually download from: " + downloadUrl);
                }
            }
        }
    }

    private static Bundle installBundleFromDir(BundleContext context, File bundleDir, String symbolicName) {
        File[] files = bundleDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (files != null) {
            for (File file : files) {
                String fileName = file.getName();
                if (fileName.contains(symbolicName) ||
                    fileName.contains(symbolicName.replace(".", "-"))) {
                    try {
                        Bundle bundle = context.installBundle("file:" + file.getAbsolutePath());
                        System.out.println("[LAUNCHER] Installed bundle: " + fileName);
                        return bundle;
                    } catch (BundleException e) {
                        System.err.println("[LAUNCHER] Failed to install " + fileName + ": " + e.getMessage());
                    }
                }
            }
        }
        System.err.println("[LAUNCHER] Bundle JAR not found for: " + symbolicName +
            " in " + bundleDir.getAbsolutePath());
        return null;
    }
}
