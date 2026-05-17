package com.cloudsync.util;

import com.cloudsync.entity.FileInfo;
import org.apache.commons.io.FilenameUtils;

import java.io.*;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class FileUtils {

    public static String calculateMD5(File file) {
        if (!file.exists() || file.isDirectory()) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[8192];
                int length;
                while ((length = fis.read(buffer)) != -1) {
                    md.update(buffer, 0, length);
                }
            }
            byte[] digest = md.digest();
            BigInteger bigInt = new BigInteger(1, digest);
            String result = bigInt.toString(16);
            while (result.length() < 32) {
                result = "0" + result;
            }
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static List<FileInfo> scanDirectory(String rootPath) {
        List<FileInfo> fileList = new ArrayList<>();
        File rootDir = new File(rootPath);
        if (!rootDir.exists() || !rootDir.isDirectory()) {
            return fileList;
        }
        scanDirectoryRecursive(rootDir, rootPath, fileList);
        return fileList;
    }

    private static void scanDirectoryRecursive(File dir, String rootPath, List<FileInfo> fileList) {
        File[] files = dir.listFiles();
        if (files == null) return;

        for (File file : files) {
            String relativePath = file.getAbsolutePath().substring(rootPath.length());
            relativePath = relativePath.replace("\\", "/");
            if (relativePath.startsWith("/")) {
                relativePath = relativePath.substring(1);
            }

            FileInfo fileInfo = new FileInfo();
            fileInfo.setPath(relativePath);
            fileInfo.setName(file.getName());
            fileInfo.setSize(file.length());
            fileInfo.setLastModified(file.lastModified());
            fileInfo.setDirectory(file.isDirectory());

            if (!file.isDirectory()) {
                fileInfo.setMd5(calculateMD5(file));
            }

            fileList.add(fileInfo);

            if (file.isDirectory()) {
                scanDirectoryRecursive(file, rootPath, fileList);
            }
        }
    }

    public static String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.2f MB", size / (1024.0 * 1024));
        return String.format("%.2f GB", size / (1024.0 * 1024 * 1024));
    }

    public static String formatSpeed(double bytesPerSecond) {
        return formatFileSize((long) bytesPerSecond) + "/s";
    }

    public static boolean ensureParentDir(String filePath) {
        File file = new File(filePath);
        File parent = file.getParentFile();
        return parent != null && (parent.exists() || parent.mkdirs());
    }

    public static boolean deleteRecursively(File file) {
        if (file == null || !file.exists()) return true;
        if (file.isDirectory()) {
            File[] files = file.listFiles();
            if (files != null) {
                for (File child : files) {
                    deleteRecursively(child);
                }
            }
        }
        return file.delete();
    }

    public static String normalizePath(String path) {
        path = path.replace("\\", "/");
        while (path.contains("//")) {
            path = path.replace("//", "/");
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        return path;
    }
}
